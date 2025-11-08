import api, { getUserInfo } from './api';

// 将后端返回的抽取历史记录对象统一标准化，便于前端 UI 处理。
// 输入可能为多种不同字段命名的形式（兼容历史遗留接口），输出为统一字段：
// - id, document_id, form_id, ai_model, status, created_at, updated_at
// - extracted_data: { fieldName: value }
// - _fields: 原始 fields 数组的浅拷贝（如果存在）
// - fieldFoundCount / fieldTotalCount / avgConfidence: 统计信息（如可推断则填充）
function normalizeHistoryItem(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const item = { ...raw };

  // 标准化 id 与常见别名
  item.id = item.id || item.historyId || item.recordId;

  // 标准化 form/document 标识
  item.form_id = item.formId || item.form_id || item.formId;
  item.document_id = item.esId || item.documentId || item.fileId || item.document_id;

  // AI 模型与状态
  item.ai_model = item.model || item.aiModel || item.ai_model || '';
  item.status = item.status || 'completed';

  // 创建/更新时间：后端可能返回多种字段名或毫秒数时间戳
  if (item.createTime && !item.created_at) {
    // 如果 createTime 是毫秒数，尝试转换为 ISO 字符串
    try { item.created_at = new Date(Number(item.createTime)).toISOString(); } catch { item.created_at = item.createTime; }
  }
  item.created_at = item.created_at || item.createdAt || item.createTime || item.created_at;
  item.updated_at = item.updateTime || item.updated_at || item.updatedAt;

  // 如果后端返回 fields 数组（[{name, value, ...}, ...]），将其转换为键值对象 extracted_data，
  // 以便 UI 直接通过 fieldName 访问对应值；同时保留原始数组的浅拷贝到 _fields
  if (item.fields && Array.isArray(item.fields)) {
    const obj = {};
    item.fields.forEach(f => { if (!f || !f.name) return; obj[f.name] = f.value; });
    item.extracted_data = obj;
    item._fields = item.fields.map(f => ({ ...f }));
  }

  // 兼容不同后端返回的用户 id 字段，便于权限判断
  if ((item.userId || item.user_id) && !item.createUserId && !item.createUser) {
    item.createUserId = item.userId || item.user_id;
  }

  // 统计字段（若后端未提供则做合理默认）
  item.fieldFoundCount = item.fieldFoundCount ?? item.field_found_count ?? (item.fields ? item.fields.filter(f => !f.notFound).length : 0);
  item.fieldTotalCount = item.fieldTotalCount ?? item.field_total_count ?? (item.fields ? item.fields.length : 0);
  item.avgConfidence = item.avgConfidence ?? item.avg_confidence ?? item.avgConfidence;

  return item;
}

class ExtractionsService {
  /**
   * 查询抽取历史记录列表，适配后端多种返回结构。
   * filters 支持字段：page, pageSize, form_id/formId, esId, document_id
   * 返回格式：{ list: [], total: Number, page?: Number, pageSize?: Number }
   */
  async getExtractions(filters = {}) {
    // 对接后端历史记录列表接口（若后端路径或参数变化，可在此处调整）
    const { page = 1, pageSize = 20, form_id, formId, esId, document_id } = filters;
    const params = {
      pageNo: page,
      pageSize,
      formId: form_id || formId,
      esId,
      documentId: document_id
    };
    // 删除未设置的参数
    Object.keys(params).forEach(k => params[k] == null && delete params[k]);

    try {
      const res = await api.get('/admin-api/rag/ai/text/extract/form/history/list', { params, timeout: 20000 });
      const body = res?.data ?? res;

      // 适配常见返回形态：数组、{ items: [...] }、{ data: [...] }、{ data: { list: [...] } }
      let rawList = [];
      let total = 0;
      let respPage = undefined;
      let respPageSize = undefined;

      if (Array.isArray(body)) {
        rawList = body;
        total = rawList.length;
      } else if (body && typeof body === 'object') {
        if (Array.isArray(body.items)) {
          rawList = body.items;
          total = Number(body.total ?? rawList.length ?? 0);
          respPage = body.page ?? body.pageNo ?? undefined;
          respPageSize = body.size ?? body.pageSize ?? undefined;
        } else if (Array.isArray(body.data)) {
          rawList = body.data;
          total = rawList.length;
        } else if (body.data && typeof body.data === 'object') {
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
    } catch (e) {
      // 记录失败原因并返回空列表，调用方应处理空结果场景
      console.warn('[ExtractionsService] history list failed', e);
      return { list: [], total: 0 };
    }
  }

  /**
   * 获取单条抽取记录详情。参数 id 为后端记录 id。
   * 若后端返回包装结构（{ data: {...} }），会自动拆箱并通过 normalizeHistoryItem 进行标准化。
   */
  async getExtraction(id) {
    try {
      const res = await api.get('/admin-api/rag/ai/text/extract/form/history/detail', { params: { id }, timeout: 15000 });
      // 有些接口会将实际对象包装在 data 字段下
      const root = res?.data?.data ? res.data : res;
      const data = root.data || root.record || root;
      return normalizeHistoryItem(data);
    } catch (error) {
      // 向上抛出错误，调用方可选择捕获或展示错误信息
      console.warn('[ExtractionsService] getExtraction fallback error', error);
      throw error;
    }
  }

  /**
   * 删除单个抽取记录（调用后端删除接口）。
   * 返回 { success: true } 表示删除请求已发出且未抛出异常。
   */
  async deleteExtraction(id) {
    try {
      await api.delete('/admin-api/rag/ai/text/extract/form/history/delete', { params: { id }, timeout: 15000 });
      return { success: true };
    } catch (error) {
      console.warn('[ExtractionsService] deleteExtraction failed', error);
      throw error;
    }
  }

  /**
   * 批量删除抽取记录。ids 为 id 数组。
   */
  async deleteExtractions(ids) {
    try {
      await api.delete('/admin-api/rag/ai/text/extract/form/history/delete/batch', { data: { ids }, headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
      return { success: true };
    } catch (error) {
      console.warn('[ExtractionsService] deleteExtractions failed', error);
      throw error;
    }
  }

  /**
   * 在本地通过 getExtractions 返回的列表进行简单搜索（用于后端未实现搜索接口时的兜底实现）。
   * - keyword: 要搜索的字符串
   * - filters: 与 getExtractions 相同的过滤参数
   * 返回匹配的记录数组
   */
  async searchExtractions(keyword, filters = {}) {
    try {
      const { list } = await this.getExtractions(filters);
      if (!keyword) return list;
      const lower = keyword.toLowerCase();
      return list.filter(extraction => JSON.stringify(extraction.extracted_data || {}).toLowerCase().includes(lower));
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

  /**
   * 更新单条抽取记录的抽取数据。
   * 期望后端接口：POST /admin-api/rag/ai/text/extract/form/history/update
   * 请求体：{ id, extractedData, fields? }
   */
  async updateExtraction(id, payload = {}) {
    if (!id) throw new Error('缺少 id');
    const extractedData = payload.extracted_data || payload.extractedData || {};
    // 同步构造 fields 以兼容不同后端实现
    const fields = Object.keys(extractedData || {}).map((name) => ({ name, value: extractedData[name] }));
    const body = { id, extractedData, fields };
    try {
      const res = await api.post('/admin-api/rag/ai/text/extract/form/history/update', body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      });
      const root = res?.data ? res : { data: res };
      const data = root.data?.data || root.data || {};
      return normalizeHistoryItem(data);
    } catch (e) {
      console.warn('[ExtractionsService] updateExtraction failed', e);
      throw e;
    }
  }
}

export const extractionsService = new ExtractionsService();

// 新增方法：按表单导出/导出全部，使用后端导出接口
ExtractionsService.prototype.exportByForm = async function(params = {}) {
  try {
    const { ids, formId, fieldsOnly } = params || {};
    const query = {};
  if (ids && Array.isArray(ids) && ids.length) query.ids = ids.join(',');
    if (formId != null) query.formId = formId;
    if (fieldsOnly != null) query.fieldsOnly = fieldsOnly ? true : false;
  // include headers similar to curl example: Accept and Content-Type, and X-User-Id if available
  const user = getUserInfo ? (getUserInfo() || {}) : {};
  const uid = user.userId || user.id || user.uid || null;
  const headers = { 'Accept': '*/*', 'Content-Type': 'application/x-www-form-urlencoded' };
  if (uid) headers['X-User-Id'] = String(uid);
  const res = await api.get('/admin-api/rag/ai/text/extract/form/history/export', { params: query, responseType: 'blob', timeout: 60000, headers });
    const blob = res && res.data ? res.data : res;
    // Determine filename from Content-Disposition if present, otherwise infer from mime type
    let filenameBase = `extractions_${Date.now()}`;
    try {
      const disposition = res && res.headers ? (res.headers['content-disposition'] || res.headers['Content-Disposition']) : undefined;
      if (disposition) {
        const m = /filename\*=UTF-8''(.+)$/.exec(disposition) || /filename="?([^";]+)"?/.exec(disposition);
        if (m && m[1]) filenameBase = decodeURIComponent(m[1]);
      }
  } catch { /* ignore */ }

    // If filenameBase already contains an extension, use it. Otherwise infer from blob.type or headers
    let filename = filenameBase;
    const hasExt = /\.[a-zA-Z0-9]+$/.test(filenameBase);
    if (!hasExt) {
      const mimeType = (blob && blob.type) || (res && res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || '';
      let ext = 'bin';
      if (/csv/i.test(mimeType)) ext = 'csv';
      else if (/zip/i.test(mimeType)) ext = 'zip';
      else if (/json/i.test(mimeType)) ext = 'json';
      else if (/excel|sheet|spreadsheet|xlsx|xls/i.test(mimeType)) ext = 'xlsx';
      filename = `${filenameBase}.${ext}`;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
    return { success: true, filename };
  } catch (e) {
    console.warn('[ExtractionsService] exportByForm failed', e);
    throw e;
  }
};