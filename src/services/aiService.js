import api from './api';

// AI 接口允许耗时较长，单独超时时间 (ms)
const AI_REQUEST_TIMEOUT = 180000; // 3 分钟，可按需再调大


const CLASSIFICATION_KEY = 'ai_doc_classification_forms_v1';
const DEFAULT_CLASSIFICATION_FORMS = [ '计划','总结','通知','公告','合同','发票','报价单','采购单','请示','批复','会议纪要','简报','报告','方案','预算','财务报表','工作日志','周报','月报','年报','招聘简章','培训材料','流程文档','规范','需求文档','设计文档','测试用例','用户手册','技术白皮书','市场分析' ].map((n,i)=>({ id:i+1, name:n, enabled:true }));

function loadForms() {
  let raw=null;
  try { raw = JSON.parse(localStorage.getItem(CLASSIFICATION_KEY) || 'null'); } catch { /* ignore parse error */ }
  if (Array.isArray(raw) && raw.length) return raw;
  localStorage.setItem(CLASSIFICATION_KEY, JSON.stringify(DEFAULT_CLASSIFICATION_FORMS));
  return [...DEFAULT_CLASSIFICATION_FORMS];
}
function saveForms(list) { try { localStorage.setItem(CLASSIFICATION_KEY, JSON.stringify(list)); } catch { /* ignore save */ } }

class AIService {
  buildTextFromFileData(fileData) {
    // 传全文还是 ID: 接口文档提供 text / texts / esId，可根据需要扩展
    return fileData?.fileContents || fileData?.extractedText || '';
  }
  async getSummary(fileId, targetLanguage='中文', length=200, onChunk, fileData) {
    if (typeof targetLanguage === 'function') { fileData = onChunk; onChunk = targetLanguage; targetLanguage='中文'; }
    const text = this.buildTextFromFileData(fileData) || '';
  const esId = fileData?.esId || fileData?.esid || fileData?._raw?.esId || fileData?._raw?.esid || null;
  const body = { text, targetLang: targetLanguage === '中文' ? '' : targetLanguage, outputFormat: 'plain' };
  if (esId) { body.esId = esId; body.esid = esId; }
    try {
      const res = await api.post('/admin-api/rag/ai/text/summary', body, { headers:{'Content-Type':'application/json'}, timeout: AI_REQUEST_TIMEOUT }).catch(e=>{ throw e; });
      const parseMaybeJson = (str) => {
        if (typeof str !== 'string') return { summary: (str && str.summary) ? str.summary : (typeof str === 'string' ? str : '') };
        const trimmed = str.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try { const obj = JSON.parse(trimmed); return obj && typeof obj === 'object' ? obj : { summary: str }; } catch { return { summary: str }; }
        }
        return { summary: str };
      };
      if (res && typeof res === 'object') {
        const data = res.data || res.result || {};
        const targetRaw = data.summary || data.target || '';
        const sourceRaw = data.summarySource || data.source || data.original || '';
        const targetObj = parseMaybeJson(targetRaw);
        const sourceObj = parseMaybeJson(sourceRaw);
        let targetSummary = String(targetObj.summary || targetRaw || '');
        let sourceSummary = String(sourceObj.summary || sourceRaw || '');
        if (length && targetSummary && targetSummary.length > length) targetSummary = targetSummary.slice(0,length) + '...';
        // Streaming only for target summary
        if (onChunk && targetSummary) {
          const chars = targetSummary.split('');
            for (let i=0;i<chars.length;i++){ await new Promise(r=>setTimeout(r,8)); try { onChunk(chars.slice(0,i+1).join('')); } catch { /* ignore chunk error */ } }
        }
        return {
          targetSummary,
          sourceSummary,
          targetObj,
          sourceObj,
          targetLang: data.targetLang || targetLanguage,
          sourceLang: data.sourceLang || data.srcLang || '',
          esId: esId || body.esId || null
        };
      }
      return { targetSummary:'', sourceSummary:'', targetObj:{}, sourceObj:{}, targetLang: targetLanguage, sourceLang:'', esId: esId||null };
    } catch (e) {
      // 不立即使用本地 fallback，直接抛出由上层界面显示“生成失败”或重试，避免用户误以为已完成
      console.warn('[AIService] summary failed', e);
      throw e;
    }
  }
  async fetchCachedSummary(esId) {
    if (!esId) return null;
    try {
      const res = await api.get(`/admin-api/rag/ai/text/summary/${encodeURIComponent(esId)}`, { timeout: 30000 });
      if (!res || typeof res !== 'object') return null;
      const data = res.data || res.result || {};
      if (!data || Object.keys(data).length === 0) return null;
      const parseMaybeJson = (str) => {
        if (typeof str !== 'string') return { summary: str?.summary || '' };
        const trimmed = str.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) { try { return JSON.parse(trimmed); } catch { return { summary: str }; } }
        return { summary: str };
      };
      const targetRaw = data.summaryTarget || data.summary || '';
      const sourceRaw = data.summarySource || '';
      const targetObj = parseMaybeJson(targetRaw);
      const sourceObj = parseMaybeJson(sourceRaw);
      return {
        targetSummary: String(targetObj.summary || targetRaw || ''),
        sourceSummary: String(sourceObj.summary || sourceRaw || ''),
        targetObj,
        sourceObj,
        targetLang: data.targetLang || data.lang || '',
        sourceLang: data.sourceLang || '',
        esId
      };
    } catch (e) {
      console.warn('[AIService] fetchCachedSummary failed', e);
      return null;
    }
  }
  async saveSummary(esId, { sourceSummary, targetSummary, sourceLang:_sourceLang, targetLang:_targetLang }) {
    if (!esId) throw new Error('缺少 esId');
    const body = {
      esId,
      summarySource: sourceSummary || '',
      summary: targetSummary || '',
      summaryTarget: targetSummary || ''
    };
    try {
      const res = await api.post('/admin-api/rag/ai/text/summary/update', body, { headers:{'Content-Type':'application/json'}, timeout: 20000 });
      if (res && typeof res === 'object') {
        if (res.code === 0) return { success:true };
      }
      return { success:false, message: res?.msg || '保存失败' };
    } catch (e) {
      console.warn('[AIService] saveSummary failed', e);
      throw e;
    }
  }
  async getTags(fileId, fileData) {
  const text = this.buildTextFromFileData(fileData) || '';
  const esId = fileData?.esId || fileData?.esid || fileData?._raw?.esId || fileData?._raw?.esid || null;
  const body = { text, outputFormat: 'tag_list' };
  if (esId) { body.esId = esId; body.esid = esId; }
    try {
      const res = await api.post('/admin-api/rag/ai/text/tags', body, { headers:{'Content-Type':'application/json'}, timeout: AI_REQUEST_TIMEOUT }).catch(e=>{ throw e; });
      const out = [];
      if (res && typeof res === 'object') {
        const data = res.data || res.result || {};
        let kw = data.keywords || data.tags || data.list || data;
        // 若是关键字数组对象: [{weight, tag}...]
        if (Array.isArray(kw)) {
          kw.forEach(it=>{
            if (!it) return;
            if (typeof it === 'string') { out.push({ tag: it, weight: 0 }); return; }
            const tag = it.tag || it.keyword || it.key || it.name || '';
            const weight = Number(it.weight ?? it.score ?? 0) || 0;
            if (tag) out.push({ tag, weight });
          });
        } else if (typeof kw === 'string') {
          // 可能返回碎片化 JSON 片段拼接在 keywords 中，如示例，需要尝试重组
          const str = kw.trim();
          try {
            const parsed = JSON.parse(str);
            if (parsed && Array.isArray(parsed.keywords)) {
              parsed.keywords.forEach(k=>{ if (k?.tag) out.push({ tag:k.tag, weight:Number(k.weight||0) }); });
            } else {
              str.split(/[;,，、\s]+/).filter(Boolean).forEach(t=> out.push({ tag:t, weight:0 }));
            }
          } catch {
            str.split(/[;,，、\s]+/).filter(Boolean).forEach(t=> out.push({ tag:t, weight:0 }));
          }
        } else if (kw && typeof kw === 'object') {
          // 可能是 { tag: weight } map
            Object.entries(kw).forEach(([k,v])=>{ if (typeof v === 'number') out.push({ tag:k, weight:v }); });
        }
      }
      return out.slice(0,100);
    } catch (e) {
      console.warn('[AIService] tags failed', e);
      throw e;
    }
  }
  async saveTags(esId, _tagsWithWeights=[]) {
    if (!esId) return { success:false, message:'缺少 esId' };
    const keywords = _tagsWithWeights.map(t=>({ tag: t.tag, weight: Number(t.weight||0) })).filter(t=> t.tag);
    try {
      const res = await api.post('/admin-api/rag/ai/text/tags/update', { esId, keywords }, { headers:{'Content-Type':'application/json'}, timeout: 20000 });
      if (res && typeof res === 'object' && res.code === 0) return { success:true };
      return { success:false, message: res?.msg || '保存失败' };
    } catch (e) {
      console.warn('[AIService] saveTags failed', e); return { success:false, message:e.message };
    }
  }
  async fetchCachedTags(esId) {
    if (!esId) return null;
    try {
      const res = await api.get(`/admin-api/rag/ai/text/tags/${encodeURIComponent(esId)}`, { timeout: 20000 });
      if (!res || typeof res !== 'object') return null;
      const data = res.data || res.result || {};
      let kw = data.keywords || data.tags || data.list || data;
      const out = [];
      if (Array.isArray(kw)) {
        kw.forEach(it=>{
          if (!it) return;
            if (typeof it === 'string') { out.push({ tag: it, weight:0 }); return; }
            const tag = it.tag || it.keyword || it.key || it.name || '';
            const weight = Number(it.weight ?? it.score ?? 0) || 0;
            if (tag) out.push({ tag, weight });
        });
      } else if (kw && typeof kw === 'object') {
        Object.entries(kw).forEach(([k,v])=>{ if (typeof v === 'number') out.push({ tag:k, weight:v }); });
      }
      return out.length ? out.slice(0,100) : null;
    } catch (e) { console.warn('[AIService] fetchCachedTags failed', e); return null; }
  }
  async getNEREntities(fileId, fileData) {
    const text = this.buildTextFromFileData(fileData) || '';
  const esId = fileData?.esId || fileData?.esid || fileData?._raw?.esId || fileData?._raw?.esid || null;
  const body = { text, outputFormat: 'json' };
  if (esId) { body.esId = esId; body.esid = esId; }
    try {
      const res = await api.post('/admin-api/rag/ai/text/ner', body, { headers:{'Content-Type':'application/json'}, timeout: AI_REQUEST_TIMEOUT }).catch(e=>{ throw e; });
      const grouped = { persons:[], organizations:[], locations:[], dates:[], others:[] };
      if (res && typeof res === 'object') {
        const arr = Array.isArray(res.data) ? res.data : (Array.isArray(res.result)? res.result : []);
        if (Array.isArray(arr)) {
          arr.forEach(it=>{
            try {
              if (!it) return;
              const t = (it.type||'').toLowerCase();
              const val = it.value || it.text || it.name || '';
              if (!val) return;
              if (['person','per','persons'].includes(t)) grouped.persons.push(val);
              else if (['org','organization','orgs'].includes(t)) grouped.organizations.push(val);
              else if (['loc','location','place'].includes(t)) grouped.locations.push(val);
              else if (['date','time'].includes(t)) grouped.dates.push(val);
              else grouped.others.push(val);
            } catch { /* ignore item */ }
          });
        }
      }
      return grouped;
    } catch (e) {
      console.warn('[AIService] ner failed', e);
      throw e;
    }
  }
  async fetchCachedNER(esId) {
    if (!esId) return null;
    try {
      const res = await api.get(`/admin-api/rag/ai/text/ner/${encodeURIComponent(esId)}`, { timeout: 20000 });
      if (!res || typeof res !== 'object') return null;
      const data = res.data || res.result || {};
      // data.ner 可能是数组，或分类好的对象；接口文档示例如有差异，可再调整
      const grouped = { persons:[], organizations:[], locations:[], dates:[], others:[] };
      const arr = Array.isArray(data.ner) ? data.ner : (Array.isArray(data) ? data : data.ner || []);
      const pushByType = (t,val)=>{
        if (!val) return; const type=t.toLowerCase();
        if (['person','per','persons'].includes(type)) grouped.persons.push(val);
        else if (['org','organization','orgs'].includes(type)) grouped.organizations.push(val);
        else if (['loc','location','place'].includes(type)) grouped.locations.push(val);
        else if (['date','time'].includes(type)) grouped.dates.push(val);
        else grouped.others.push(val);
      };
      if (Array.isArray(arr)) {
  arr.forEach(it=>{ try { if (!it) return; pushByType(it.type||'', it.value||it.text||it.name||''); } catch{ /* ignore item parse */ } });
      } else if (data && typeof data === 'object') {
        // maybe already grouped { persons:[], organizations:[], ... }
        ['persons','organizations','locations','dates','others'].forEach(k=>{ if (Array.isArray(data[k])) grouped[k]=[...data[k]]; });
      }
      const hasAny = Object.values(grouped).some(v=>v.length);
      return hasAny ? grouped : null;
    } catch (e) { console.warn('[AIService] fetchCachedNER failed', e); return null; }
  }
  async saveNER(esId, nerGrouped) {
    if (!esId) return { success:false, message:'缺少 esId' };
    // 扁平化为数组形式 [{type,value}]
    const list=[]; const map = { persons:'person', organizations:'organization', locations:'location', dates:'date', others:'other' };
    Object.entries(map).forEach(([k,t])=>{ const arr = nerGrouped?.[k]; if (Array.isArray(arr)) arr.forEach(v=>{ if (v) list.push({ type:t, value:v }); }); });
    try {
      const res = await api.post('/admin-api/rag/ai/text/ner/update', { esId, ner: list }, { headers:{'Content-Type':'application/json'}, timeout: 20000 });
      if (res && typeof res === 'object' && res.code === 0) return { success:true };
      return { success:false, message: res?.msg || '保存失败' };
    } catch (e) { console.warn('[AIService] saveNER failed', e); return { success:false, message:e.message }; }
  }
  async extractCustomInfo(fileId, template) { try { await new Promise(r=>setTimeout(r,600)); const mockResults={ contract:{ parties:['甲方：XX公司','乙方：YY公司'], amount:'100万元', date:'2024-01-15', duration:'12个月' }, invoice:{ number:'INV-2024-001', amount:'50000元', date:'2024-01-15', vendor:'ABC供应商' } }; return mockResults[template.type] || {}; } catch { console.warn('AI Extract API fallback'); return {}; } }
  async extractWithForm(fileId, formStructure, _aiModel='gpt-4') { try { await new Promise(r=>setTimeout(r,1000)); if (formStructure && formStructure.fields) { return this.generateMockDataFromFormStructure(formStructure, fileId); } return { message:'无法生成符合表单结构的数据', formName: formStructure?.formName || '未知表单' }; } catch (e) { console.warn('Form-based AI Extract API fallback'); throw e; } }
  async askQuestion(fileId, question, onChunk) { try { const answers=[ '根据文档内容，这个问题的答案是：','首先，我们需要分析文档中的相关信息。','通过对文档的理解，可以得出以下结论：',`关于"${question}"这个问题，文档中提到了相关的内容和解决方案。`]; const answer=answers[Math.random()*answers.length|0] + ' 这是一个基于文档内容生成的模拟回答，展示了AI问答功能的工作方式。'; if (onChunk){ const words=answer.split(''); for (let i=0;i<words.length;i++){ await new Promise(r=>setTimeout(r,80)); onChunk(words.slice(0,i+1).join('')); } } return answer; } catch { console.warn('AI QA API fallback'); return '这是一个模拟的问答回复。'; } }
  async translateText(text, targetLanguage, onChunk, esId=null) {
    try {
      const body={ text, targetLang: targetLanguage, esId: esId || undefined, outputFormat:'plain' };
      const res= await api.post('/admin-api/rag/ai/text/translate', body, { headers:{'Content-Type':'application/json'}, timeout: AI_REQUEST_TIMEOUT });
      // 兼容统一包装格式 { code, data:{ translated }, msg }
      let translated = res?.data?.data?.translated || res?.data?.translated || res?.data?.data?.translation || res?.data?.translation || res?.data?.data?.text || res?.data?.text || res?.data?.result || '';
      if (translated && typeof translated === 'object') {
        // 避免把对象直接当字符串
        translated = translated.translated || translated.translation || translated.text || '';
      }
      if (typeof translated === 'object') translated = translated.translated || translated.translation || '';
      if (!translated) translated = `[${targetLanguage}] ${text}`;
      if (onChunk){
        const chars = translated.split('');
        for (let i=0;i<chars.length;i++){ await new Promise(r=>setTimeout(r,6)); try { onChunk(chars.slice(0,i+1).join('')); } catch {/* ignore */} }
      }
      return translated;
    } catch (e) {
      console.warn('[AIService] translateText failed', e);
      return `Mock translation: ${text}`;
    }
  }
  async translateWithXunfei(fullText, sourceLang, targetLang) {
    // 讯飞接口按需求一次性提交，后端地址: /Itrans/onlinetrans/tourist
    // 构建 type encn 之类: 源+目标
    const type = (sourceLang||'') + (targetLang||'');
    const body = {
      content: fullText,
      sourceLanguage: sourceLang || 'auto',
      targetLanguage: targetLang === 'zh' ? 'cn' : targetLang, // 若后端需要 cn 表示中文
      type,
      trans_uid: 6,
      userId: ''
    };
    try {
      const res = await api.post('/Itrans/onlinetrans/tourist', body, { headers:{'Content-Type':'application/json'}, timeout: AI_REQUEST_TIMEOUT });
      const data = res?.data || res?.result || {};
      // 预期 data.body.targetList
      const targetList = data.body?.targetList || data.targetList || [];
      if (Array.isArray(targetList) && targetList.length) {
        return { sentences: targetList };
      }
      return { text: data.body?.text || data.text || '' };
    } catch (e) {
      console.warn('[AIService] translateWithXunfei failed', e);
      throw e;
    }
  }
  async fetchCachedTranslation(esId) {
    if (!esId) return null;
    try {
      const res = await api.get(`/admin-api/rag/ai/text/translate/${encodeURIComponent(esId)}`, { timeout: 30000 });
      const data = res?.data || res?.result || {};
      if (!data || Object.keys(data).length===0) return null;
      const translation = data.translated || data.translation || data.text || data.content || '';
      if (!translation) return null;
      return { translation };
    } catch (e) { console.warn('[AIService] fetchCachedTranslation failed', e); return null; }
  }
  async saveTranslation(esId, translation) {
    if (!esId) return { success:false, message:'缺少 esId' };
    try {
      const body = { esId, translated: translation };
      const res = await api.post('/admin-api/rag/ai/text/translate/update', body, { headers:{'Content-Type':'application/json'}, timeout: 20000 });
      if (res && typeof res === 'object' && res.code === 0) return { success:true };
      return { success:false, message: res?.msg || '保存失败' };
    } catch (e) { console.warn('[AIService] saveTranslation failed', e); return { success:false, message:e.message }; }
  }
  async extractText(fileId) { try { await new Promise(r=>setTimeout(r,500)); const mockTexts={ 1:'这是从PDF文件中提取的文本内容。包含了项目需求的详细描述，技术规范，以及实施方案等重要信息。\n\n主要章节包括：\n1. 项目概述\n2. 功能需求\n3. 技术架构\n4. 实施计划\n\n这些内容为项目的顺利进行提供了重要的参考依据。', 2:'从图片中识别的文字内容：设计标准、UI规范、图标库等相关设计要素。', 3:'音频转文字：会议主要讨论了项目进度、技术难点和解决方案等议题。' }; return mockTexts[fileId] || '暂无可提取的文本内容'; } catch { console.warn('Text extraction API fallback'); return '模拟提取的文本内容'; } }
  async classifyDocument(fileId, _contentHint='') { try { await new Promise(r=>setTimeout(r,600)); const forms=loadForms().filter(f=>f.enabled); if (!forms.length) return []; const picks=forms.sort(()=>Math.random()-0.5).slice(0, Math.min(5, forms.length)); let remaining=1.0; const results=picks.map((f,idx)=>{ const score = idx===picks.length-1 ? remaining : +(Math.random()*remaining*0.6+0.05).toFixed(3); remaining = +(remaining - score).toFixed(3); return { category:f.name, score:score }; }); const total=results.reduce((s,r)=>s+r.score,0)||1; return results.map(r=>({ ...r, score:+(r.score/total).toFixed(4) })).sort((a,b)=>b.score-a.score); } catch { console.warn('classifyDocument mock fallback'); return []; } }
  async getRelatedDocuments({ esId, query='', page=1, pageSize=10, fileData }) {
    // Build request body; include text when available for recall improvement
    const text = fileData ? this.buildTextFromFileData(fileData) : '';
    const offset = (page - 1) * pageSize;
    const body = { esId, query, text, offset, limit: pageSize };
    try {
      const res = await api.post('/admin-api/rag/ai/text/related', body, { headers:{'Content-Type':'application/json'}, timeout: 60000 });
      const data = res?.data || res?.result || {};
      const listRaw = Array.isArray(data.list) ? data.list : (Array.isArray(data) ? data : []);
      const list = listRaw.map((it, idx) => {
        if (!it || typeof it !== 'object') return null;
        return {
          id: it.id || it.esId || it.esid || it.docId || `rel_${idx}`,
          esId: it.esId || it.esid || it.id,
          name: it.name || it.filename || it.title || it.fileName || `文档${idx+1}`,
          score: Number(it.score ?? it.similarity ?? it.rankScore ?? 0),
          snippet: it.snippet || it.summary || it.highlight || ''
        };
      }).filter(Boolean);
      const total = Number(data.total ?? data.count ?? list.length);
      return { list, total };
    } catch (e) {
      console.warn('[AIService] getRelatedDocuments failed, fallback mock', e);
      // Fallback mock data
      const mock = Array.from({ length: Math.min(pageSize, 5) }).map((_,i)=>({
        id: `mock_${page}_${i}`,
        esId: `mock_${page}_${i}`,
        name: `相关文档示例 ${i+1 + (page-1)*pageSize}`,
        score: +(Math.random()*0.5 + 0.5).toFixed(3),
        snippet: '这是一个模拟的相关内容片段，用于展示关联推荐效果。'
      }));
      return { list: mock, total: mock.length };
    }
  }
  async getClassificationForms() { return loadForms(); }
  async createClassificationForm(name) { const list=loadForms(); const id=Date.now(); list.push({ id, name, enabled:true }); saveForms(list); return { id, name }; }
  async updateClassificationForm(id, patch) { const list=loadForms(); const idx=list.findIndex(i=>i.id===id); if (idx>-1) { list[idx]={ ...list[idx], ...patch }; saveForms(list); return list[idx]; } throw new Error('Not found'); }
  async deleteClassificationForm(id) { const list=loadForms().filter(i=>i.id!==id); saveForms(list); return true; }
  generateMockDataFromFormStructure(formStructure, fileId) { const mockData = {}; if (!formStructure.fields) return {}; formStructure.fields.forEach(field => { if (field.type === 'object' && field.fields) { mockData[field.name] = {}; field.fields.forEach(subField => { mockData[field.name][subField.name] = this.generateFieldValue(subField, fileId); }); } else if (field.type === 'array' && field.fields) { const itemCount = Math.floor(Math.random() * 3) + 1; mockData[field.name] = []; for (let i = 0; i < itemCount; i++) { const item = {}; field.fields.forEach(subField => { item[subField.name] = this.generateFieldValue(subField, fileId, i); }); mockData[field.name].push(item); } } else { mockData[field.name] = this.generateFieldValue(field, fileId); } }); return mockData; }
  generateFieldValue(field, fileId, index = 0) { if (field.example !== undefined && field.example !== null) { if (field.type === 'number') { return typeof field.example === 'number' ? field.example + Math.floor(Math.random() * 1000) : parseFloat(field.example) || 0; } else if (field.type === 'text') { return typeof field.example === 'string' ? field.example + (index > 0 ? ` ${index + 1}` : '') : '示例文本'; } else if (field.type === 'date') { return field.example || '2024-01-15'; } else if (field.type === 'boolean') { return Math.random() > 0.5; } } const lowerName = field.name.toLowerCase(); if (field.type === 'number') { if (lowerName.includes('价格') || lowerName.includes('金额') || lowerName.includes('总价')) { return Math.floor(Math.random() * 100000) + 1000; } else if (lowerName.includes('数量')) { return Math.floor(Math.random() * 100) + 1; } else if (lowerName.includes('税率')) { return 0.13; } return Math.floor(Math.random() * 1000) + 1; } else if (field.type === 'date') { const dates = ['2024-01-15', '2024-01-20', '2024-01-25', '2024-02-01']; return dates[Math.floor(Math.random() * dates.length)]; } else if (field.type === 'boolean') { return Math.random() > 0.5; } else { if (lowerName.includes('公司') || lowerName.includes('company')) { const companies = ['示例科技有限公司', 'ABC软件公司', 'XYZ技术公司', '创新科技集团']; return companies[Math.floor(Math.random() * companies.length)]; } else if (lowerName.includes('姓名') || lowerName.includes('负责人') || lowerName.includes('name')) { const names = ['张三', '李四', '王五', '赵六', '钱七']; return names[Math.floor(Math.random() * names.length)]; } else if (lowerName.includes('电话') || lowerName.includes('联系') || lowerName.includes('phone')) { return '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'); } else if (lowerName.includes('邮箱') || lowerName.includes('email')) { return 'example@company.com'; } else if (lowerName.includes('地址') || lowerName.includes('address')) { return '北京市朝阳区示例大街123号'; } else if (lowerName.includes('产品') || lowerName.includes('项目')) { const products = ['云服务器', '数据库服务', '技术支持', '软件开发', '系统集成']; return products[Math.floor(Math.random() * products.length)] + (index > 0 ? ` ${index + 1}` : ''); } else if (lowerName.includes('号码') || lowerName.includes('编号')) { return 'NO-2024-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'); } return field.example || `示例${field.name}`; } }
  generateGenericMockData(formStructure) { return { message: '无法生成符合表单结构的数据', formName: formStructure?.formName || '未知表单' }; }
}

export const aiService = new AIService();
export const getRelatedDocuments = (options) => aiService.getRelatedDocuments(options);