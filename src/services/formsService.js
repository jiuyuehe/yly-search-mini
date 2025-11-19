import api from './api';

// 真实接口适配：基于 /admin-api/rag/ai/form* 系列
// 约定：
// GET /admin-api/rag/ai/form/page?pageNo=1&pageSize=20 -> { code, data:{ list,total } }
// GET /admin-api/rag/ai/form/get?id=xxx 或 /detail/{id}
// POST /admin-api/rag/ai/form/create  body: { name, structure/jsonSchema, description }
// POST /admin-api/rag/ai/form/update  body: { id, name?, structure?, description? }
// DELETE /admin-api/rag/ai/form/delete?id=xxx
// GET /admin-api/rag/ai/form/search?keyword=xxx (若无则前端本地过滤)
// POST /admin-api/rag/ai/form/extract  body: { esId, formId }

class FormsService {
  _normalize(res) { return (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {}); }
  _unwrapList(res) { const root = this._normalize(res); const data = root.data || root; const list = data.list || data.rows || data.data || []; const total = Number(data.total || data.count || list.length || 0); return { list, total }; }
  _deserializeForm(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    const f = { ...raw };
    // parse structure if it's a JSON string
    if (typeof f.structure === 'string') {
      try { f.structure = JSON.parse(f.structure); } catch { f.structure = { formName: f.name, fields: [] }; }
    }
    // ensure structure object shape
    if (!f.structure || typeof f.structure !== 'object') {
      f.structure = { formName: f.name, fields: [] };
    } else if (!f.structure.formName) {
      f.structure.formName = f.name;
    }
    // map timestamps to previous mock style keys
    if (f.createTime && !f.created_at) f.created_at = this._formatTs(f.createTime);
    if (f.updateTime && !f.updated_at) f.updated_at = this._formatTs(f.updateTime);
    // system flag
    const sys = f.systemFlag === 1 || f.system === true || f.isSystem === true || f.creator === 'system';
    f.system = sys;
    f.isSystem = sys;
    return f;
  }
  _formatTs(ts) { try { const d = new Date(ts); if (!isFinite(d)) return ''; return d.toISOString(); } catch { return ''; } }
  _serializeStructure(structure) {
    if (!structure) return '';
    if (typeof structure === 'string') return structure; // assume already stringified
    try { return JSON.stringify(structure); } catch { return ''; }
  }
  async getForms({ pageNo = 1, pageSize = 100 } = {}) {
    try { const res = await api.get('/admin-api/rag/ai/form/page', { params: { pageNo, pageSize }, timeout: 20000 }); return this._unwrapList(res).list.map(f => this._deserializeForm(f)); }
    catch (e) { console.warn('[FormsService] getForms failed', e); return []; }
  }

  async getForm(id) {
    if (!id) throw new Error('缺少表单 id');
    try {
      const res = await api.get('/admin-api/rag/ai/form/get', { params: { id }, timeout: 20000 });
      const root = this._normalize(res); const raw = root.data || root.form || root; return this._deserializeForm(raw);
    } catch (e) { console.warn('[FormsService] getForm failed', e); throw e; }
  }

  async createForm(formData) {
    const body = { name: formData.name, description: formData.description || '', structure: this._serializeStructure(formData.structure) }; // backend expects JSON string
    // visibility: include userId only when provided (personal)
    if (formData && formData.userId != null && formData.userId !== '') {
      body.userId = formData.userId;
    }
    try { const res = await api.post('/admin-api/rag/ai/form/create', body, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }); const root = this._normalize(res); const raw = root.data || { id: root.id, ...body }; return this._deserializeForm(raw); }
    catch (e) { console.warn('[FormsService] createForm failed', e); throw e; }
  }

  async updateForm(id, formData) {
    if (!id) throw new Error('缺少表单 id');
    const body = { id, name: formData.name, description: formData.description, structure: formData.structure && this._serializeStructure(formData.structure) };
    if (formData && formData.userId != null && formData.userId !== '') {
      body.userId = formData.userId;
    }
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    try { const res = await api.post('/admin-api/rag/ai/form/update', body, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }); const root = this._normalize(res); const raw = root.data || body; return this._deserializeForm(raw); }
    catch (e) { console.warn('[FormsService] updateForm failed', e); throw e; }
  }

  async deleteForm(id) {
    if (!id) throw new Error('缺少表单 id');
    try { const res = await api.delete('/admin-api/rag/ai/form/delete', { params: { id }, timeout: 15000 }); const root = this._normalize(res); return { success: root.code === 0 }; }
    catch (e) { console.warn('[FormsService] deleteForm failed', e); throw e; }
  }

  async searchForms(keyword) {
    if (!keyword) { return this.getForms(); }
    try { const res = await api.get('/admin-api/rag/ai/form/search', { params: { keyword }, timeout: 15000 }); return this._unwrapList(res).list; }
    catch (e) { console.warn('[FormsService] searchForms failed, fallback page filter', e); const all = await this.getForms(); return all.filter(f => (f.name || '').toLowerCase().includes(keyword.toLowerCase())); }
  }

  async extractByForm({ esId, formId }) {
    if (!esId || !formId) throw new Error('缺少 esId 或 formId');
    try {
      const body = { esId, formId };
      const res = await api.post('/admin-api/rag/ai/form/extract', body, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
      const root = this._normalize(res); return root.data || root.result || root;
    } catch (e) { console.warn('[FormsService] extractByForm failed', e); throw e; }
  }

  // New endpoint per requirement /admin-api/rag/ai/text/extract/form
  async extractTextByForm({ esId, formId, structure, timeout = 180000 }) {
    if (!esId || !formId) throw new Error('缺少 esId 或 formId');
    const started = Date.now();
    try {
      const body = { esId, formId };
      if (structure) {
        body.structure = this._serializeStructure(structure);
      }
      const res = await api.post('/admin-api/rag/ai/text/extract/form', body, { headers: { 'Content-Type': 'application/json' }, timeout });
      const root = this._normalize(res);
      const data = root.data || root.result || root;
      console.info('[FormsService] extractTextByForm success in', (Date.now() - started) + 'ms');
      return data;
    } catch (e) {
      console.warn('[FormsService] extractTextByForm failed after', (Date.now() - started) + 'ms', e);
      throw e;
    }
  }

  /**
   * 保存抽取结果历史
   * 文档: /admin-api/rag/ai/text/extract/form/history/save
   * 预期后端格式(推测): {
   *   esId, formId, fields: [ { name, value, confidence?, notFound? } ]
   * }
   * 返回: { id, esId, formId, ... }
   */
  async saveExtractionHistory({ esId, formId, fields, raw, timeout = 30000 }) {
    if (!esId || !formId) throw new Error('缺少 esId 或 formId');
    console.log('[raw ===========] ', raw);
    const body = { esId, formId, fields };
    if (raw) body.raw = raw; // 允许透传原始结果 (便于后端调试)
    try {
      const res = await api.post('/admin-api/rag/ai/form/history/save', body, { headers: { 'Content-Type': 'application/json' }, timeout });
      if (res.code === 500) {
        throw new Error(res.msg || '保存抽取历史失败');
      }
      const root = this._normalize(res);
      return root.data || root.result || root;
    } catch (e) {
      console.warn('[FormsService] saveExtractionHistory failed', e);
      throw e;
    }
  }
}

export const formsService = new FormsService();