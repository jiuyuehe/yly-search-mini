import api from './api';

// 将后端历史记录标准化
function normalizeHistoryItem(raw){
  if(!raw || typeof raw !== 'object') return raw;
  const item = { ...raw };
  // map identifiers
  item.id = item.id || item.historyId || item.recordId;
  item.form_id = item.formId || item.form_id || item.form_id;
  item.document_id = item.esId || item.documentId || item.fileId || item.document_id;
  // ai model / status
  item.ai_model = item.model || item.aiModel || item.ai_model || '';
  item.status = item.status || 'completed';
  // timestamps
  // createTime may be epoch millis
  if (item.createTime && !item.created_at) {
    try { item.created_at = new Date(Number(item.createTime)).toISOString(); } catch { item.created_at = item.createTime; }
  }
  item.created_at = item.created_at || item.createdAt || item.createTime || item.created_at;
  item.updated_at = item.updateTime || item.updated_at || item.updatedAt;

  // normalize fields array -> extracted_data object and keep raw fields
  if (item.fields && Array.isArray(item.fields)){
    const obj = {};
    item.fields.forEach(f=>{ if(!f || !f.name) return; obj[f.name] = f.value; });
    item.extracted_data = obj;
    // keep original fields array in a stable property for UI that expects details
    item._fields = item.fields.map(f => ({ ...f }));
  }

  // map returned userId into older createUserId/createUser aliases for permission checks
  if ((item.userId || item.user_id) && !item.createUserId && !item.createUser) {
    item.createUserId = item.userId || item.user_id;
  }

  // field counts and avgConfidence -> keep for metrics
  item.fieldFoundCount = item.fieldFoundCount ?? item.field_found_count ?? (item.fields ? item.fields.filter(f=>!f.notFound).length : 0);
  item.fieldTotalCount = item.fieldTotalCount ?? item.field_total_count ?? (item.fields ? item.fields.length : 0);
  item.avgConfidence = item.avgConfidence ?? item.avg_confidence ?? item.avgConfidence;

  return item;
}

class ExtractionsService {
  async getExtractions(filters = {}) {
    // 对接 /admin-api/rag/ai/text/extract/form/history/list
    const { page=1, pageSize=20, form_id, formId, esId, document_id } = filters;
    const params = {
      pageNo: page,
      pageSize,
      formId: form_id || formId,
      esId,
      documentId: document_id
    };
    Object.keys(params).forEach(k=> params[k]==null && delete params[k]);
    try {
      const res = await api.get('/admin-api/rag/ai/text/extract/form/history/list', { params, timeout:20000 });
      // Backend may return multiple shapes, including:
      // 1) raw array: [ ... ]
      // 2) { code:0, data: [...] }
      // 3) { data: { list: [], total, page, pageSize } }
      // 4) { total, size, page, items: [...] }
      const body = res?.data ?? res;

      let rawList = [];
      let total = 0;
      let respPage = undefined;
      let respPageSize = undefined;

      if (Array.isArray(body)) {
        rawList = body;
        total = rawList.length;
      } else if (body && typeof body === 'object') {
        // shape: { total, size, page, items }
        if (Array.isArray(body.items)) {
          rawList = body.items;
          total = Number(body.total ?? rawList.length ?? 0);
          respPage = body.page ?? body.pageNo ?? undefined;
          respPageSize = body.size ?? body.pageSize ?? undefined;
        }
        // shape: { code:0, data: [...] }
        else if (Array.isArray(body.data)) {
          rawList = body.data;
          total = rawList.length;
        }
        // shape: { data: { list: [], total, page, pageSize } }
        else if (body.data && typeof body.data === 'object') {
          const d = body.data;
          if (Array.isArray(d.list) || Array.isArray(d.rows) || Array.isArray(d.items)) {
            rawList = d.list || d.rows || d.items || [];
            total = Number(d.total ?? body.total ?? rawList.length ?? 0);
            respPage = d.page ?? d.pageNo ?? body.page ?? undefined;
            respPageSize = d.pageSize ?? d.size ?? body.size ?? undefined;
          } else if (Array.isArray(d)) {
            rawList = d;
            total = rawList.length;
          }
        }
      }

      const list = (rawList || []).map(normalizeHistoryItem);
      return { list, total: Number(total || 0), page: respPage, pageSize: respPageSize };
    } catch(e){
      console.warn('[ExtractionsService] history list failed', e);
      return { list: [], total: 0 };
    }
  }

  async getExtraction(id) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.get(`/admin-api/extractions/${id}`);
      // return response.data;
      
      // Mock response for now
  const res = await api.get('/admin-api/rag/ai/text/extract/form/history/detail', { params:{ id }, timeout:15000 });
  const root = res?.data?.data ? res.data : res;
  const data = root.data || root.record || root;
  return normalizeHistoryItem(data);
    } catch (error) {
  console.warn('[ExtractionsService] getExtraction fallback error', error);
  throw error;
    }
  }

  async createExtraction(_extractionData) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.post('/admin-api/extractions', extractionData);
      // return response.data;
      
      // Mock response for now
  // 暂无创建接口：直接抛出
  throw new Error('不支持手动创建抽取记录');
    } catch (error) {
      console.warn('Create extraction API not available, using mock data');
      throw error;
    }
  }

  async updateExtraction(_id, _extractionData) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.put(`/admin-api/extractions/${id}`, extractionData);
      // return response.data;
      
      // Mock response for now
  // 推测更新接口（如果后端后续提供可替换）
  throw new Error('暂不支持编辑历史记录');
    } catch (error) {
      console.warn('Update extraction API not available, using mock data');
      throw error;
    }
  }

  async deleteExtraction(id) {
    try {
      // Uncomment when backend API is ready
      // await api.delete(`/admin-api/extractions/${id}`);
      
      // Mock response for now
  await api.delete('/admin-api/rag/ai/text/extract/form/history/delete', { params:{ id }, timeout:15000 });
  return { success: true };
    } catch (error) {
      console.warn('Delete extraction API not available, using mock data');
      throw error;
    }
  }

  async deleteExtractions(ids) {
    try {
      // Uncomment when backend API is ready
      // await api.delete('/admin-api/extractions', { data: { ids } });
      
      // Mock response for now
  await api.delete('/admin-api/rag/ai/text/extract/form/history/delete/batch', { data:{ ids }, headers:{'Content-Type':'application/json'}, timeout:20000 });
  return { success: true };
    } catch (error) {
      console.warn('Batch delete extractions API not available, using mock data');
      throw error;
    }
  }

  async searchExtractions(keyword, filters = {}) {
    try {
      // Uncomment when backend API is ready
      // const params = new URLSearchParams({ ...filters, q: keyword });
      // const response = await api.get(`/admin-api/extractions/search?${params}`);
      // return response.data;
      
      // Mock search for now
  const { list } = await this.getExtractions(filters);
  if(!keyword) return list;
  return list.filter(extraction => JSON.stringify(extraction.extracted_data||{}).toLowerCase().includes(keyword.toLowerCase()));
    } catch (error) {
  console.warn('[ExtractionsService] search fallback error', error);
  return [];
    }
  }

  async exportExtractions(ids, format = 'json') {
    try {
      // Uncomment when backend API is ready
      // const response = await api.post('/admin-api/extractions/export', { ids, format });
      // return response.data;
      
      // Mock export for now
      await new Promise(resolve => setTimeout(resolve, 1000));
  const { list } = await this.getExtractions({ page:1, pageSize:1000 });
  const extractions = list.filter(e => ids.includes(e.id));
      
      if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(extractions);
        return { format: 'csv', data: csvData, filename: `extractions_${Date.now()}.csv` };
      } else {
        // Return JSON format
        return { format: 'json', data: extractions, filename: `extractions_${Date.now()}.json` };
      }
    } catch (error) {
  console.warn('[ExtractionsService] export error', error);
  throw error;
    }
  }

  convertToCSV(extractions) {
    if (extractions.length === 0) return '';
    
    const headers = ['ID', 'Document ID', 'Form ID', 'AI Model', 'Status', 'Created At', 'Extracted Data'];
    const rows = extractions.map(e => [
      e.id,
      e.document_id,
      e.form_id,
      e.ai_model,
      e.status,
      e.created_at,
      JSON.stringify(e.extracted_data)
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  // Get available AI models for extraction
  async getAvailableModels() {
    // 仍使用静态列表 (后端接好接口后再替换)
    return [
      { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', available: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', available: true },
      { id: 'claude-3', name: 'Claude-3', provider: 'Anthropic', available: true }
    ];
  }
}

export const extractionsService = new ExtractionsService();