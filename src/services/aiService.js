// Mock AI responses & supporting structures
const MOCK_AI_DATA = {
  summaries: {
    1: '这是一个关于项目需求的重要文档，包含了详细的功能规范和技术要求。主要涵盖用户管理、文件搜索、AI分析工具等核心模块的设计方案。',
    2: '设计图标准规范文档，定义了UI界面的视觉设计标准和图标使用规范。',
    3: '项目会议录音文件，讨论了开发进度和技术难点。'
  },
  tags: {
    1: ['项目文档', '需求分析', '技术规范', '重要'],
    2: ['设计', 'UI标准', '图标', '规范'],
    3: ['会议', '录音', '开发', '讨论']
  },
  nerEntities: {
    1: { persons: ['张三', '李四', '王五'], organizations: ['开发团队', '设计部门'], locations: ['北京', '上海'], dates: ['2024-01-15', '2024-02-01'] },
    2: { persons: ['设计师'], organizations: ['UI团队'], locations: [], dates: ['2024-01-14'] },
    3: { persons: ['项目经理', '开发工程师'], organizations: ['技术部'], locations: ['会议室'], dates: ['2024-01-13'] }
  },
  translations: {
    en: { '这是一个项目需求文档': 'This is a project requirements document', '包含详细的功能需求': 'Contains detailed functional requirements', '技术规范': 'Technical specifications' },
    ja: { '这是一个项目需求文档': 'これはプロジェクト要件書です', '包含详细的功能需求': '詳細な機能要件を含む', '技术规范': '技術仕様' }
  }
};

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
  async getSummary(fileId, targetLanguage = '中文', length = 200, onChunk) {
    if (typeof targetLanguage === 'function') { onChunk = targetLanguage; targetLanguage = '中文'; length = 200; }
    else if (typeof length === 'function') { onChunk = length; length = 200; }
    try {
      let summary = MOCK_AI_DATA.summaries?.[fileId] || '暂无摘要信息';
      if (length && summary.length > length) summary = summary.slice(0, length) + '...';
      if (targetLanguage && targetLanguage !== '中文') summary = `[${targetLanguage}] ` + summary;
      if (onChunk) { const chars = summary.split(''); for (let i=0;i<chars.length;i++){ await new Promise(r=>setTimeout(r,30)); onChunk(chars.slice(0,i+1).join('')); } }
      return summary;
    } catch { console.warn('AI Summary API fallback'); return '暂无摘要信息'; }
  }
  async getTags(fileId) { try { await new Promise(r=>setTimeout(r,300)); return MOCK_AI_DATA.tags?.[fileId] || []; } catch { console.warn('AI Tags API fallback'); return MOCK_AI_DATA.tags?.[fileId] || []; } }
  async getNEREntities(fileId) { try { await new Promise(r=>setTimeout(r,400)); return MOCK_AI_DATA.nerEntities?.[fileId] || { persons: [], organizations: [], locations: [], dates: [] }; } catch { console.warn('AI NER API fallback'); return MOCK_AI_DATA.nerEntities?.[fileId] || { persons: [], organizations: [], locations: [], dates: [] }; } }
  async extractCustomInfo(fileId, template) { try { await new Promise(r=>setTimeout(r,600)); const mockResults={ contract:{ parties:['甲方：XX公司','乙方：YY公司'], amount:'100万元', date:'2024-01-15', duration:'12个月' }, invoice:{ number:'INV-2024-001', amount:'50000元', date:'2024-01-15', vendor:'ABC供应商' } }; return mockResults[template.type] || {}; } catch { console.warn('AI Extract API fallback'); return {}; } }
  async extractWithForm(fileId, formStructure, _aiModel='gpt-4') { try { await new Promise(r=>setTimeout(r,1000)); if (formStructure && formStructure.fields) { return this.generateMockDataFromFormStructure(formStructure, fileId); } return { message:'无法生成符合表单结构的数据', formName: formStructure?.formName || '未知表单' }; } catch (e) { console.warn('Form-based AI Extract API fallback'); throw e; } }
  async askQuestion(fileId, question, onChunk) { try { const answers=[ '根据文档内容，这个问题的答案是：','首先，我们需要分析文档中的相关信息。','通过对文档的理解，可以得出以下结论：',`关于"${question}"这个问题，文档中提到了相关的内容和解决方案。`]; const answer=answers[Math.random()*answers.length|0] + ' 这是一个基于文档内容生成的模拟回答，展示了AI问答功能的工作方式。'; if (onChunk){ const words=answer.split(''); for (let i=0;i<words.length;i++){ await new Promise(r=>setTimeout(r,80)); onChunk(words.slice(0,i+1).join('')); } } return answer; } catch { console.warn('AI QA API fallback'); return '这是一个模拟的问答回复。'; } }
  async translateText(text, targetLanguage, onChunk) { try { const translations=MOCK_AI_DATA.translations?.[targetLanguage] || {}; let translatedText = translations[text] || `[${targetLanguage.toUpperCase()}] ${text}`; if (translatedText === `[${targetLanguage.toUpperCase()}] ${text}`) { switch(targetLanguage){ case 'en': translatedText=`Translated to English: ${text}`; break; case 'ja': translatedText=`日本語に翻訳: ${text}`; break; case 'ko': translatedText=`한국어로 번역: ${text}`; break; default: translatedText=`Translated text: ${text}`; }} if (onChunk){ const words=translatedText.split(''); for (let i=0;i<words.length;i++){ await new Promise(r=>setTimeout(r,60)); onChunk(words.slice(0,i+1).join('')); } } return translatedText; } catch { console.warn('AI Translation API fallback'); return `Mock translation: ${text}`; } }
  async extractText(fileId) { try { await new Promise(r=>setTimeout(r,500)); const mockTexts={ 1:'这是从PDF文件中提取的文本内容。包含了项目需求的详细描述，技术规范，以及实施方案等重要信息。\n\n主要章节包括：\n1. 项目概述\n2. 功能需求\n3. 技术架构\n4. 实施计划\n\n这些内容为项目的顺利进行提供了重要的参考依据。', 2:'从图片中识别的文字内容：设计标准、UI规范、图标库等相关设计要素。', 3:'音频转文字：会议主要讨论了项目进度、技术难点和解决方案等议题。' }; return mockTexts[fileId] || '暂无可提取的文本内容'; } catch { console.warn('Text extraction API fallback'); return '模拟提取的文本内容'; } }
  async classifyDocument(fileId, _contentHint='') { try { await new Promise(r=>setTimeout(r,600)); const forms=loadForms().filter(f=>f.enabled); if (!forms.length) return []; const picks=forms.sort(()=>Math.random()-0.5).slice(0, Math.min(5, forms.length)); let remaining=1.0; const results=picks.map((f,idx)=>{ const score = idx===picks.length-1 ? remaining : +(Math.random()*remaining*0.6+0.05).toFixed(3); remaining = +(remaining - score).toFixed(3); return { category:f.name, score:score }; }); const total=results.reduce((s,r)=>s+r.score,0)||1; return results.map(r=>({ ...r, score:+(r.score/total).toFixed(4) })).sort((a,b)=>b.score-a.score); } catch { console.warn('classifyDocument mock fallback'); return []; } }
  async getClassificationForms() { return loadForms(); }
  async createClassificationForm(name) { const list=loadForms(); const id=Date.now(); list.push({ id, name, enabled:true }); saveForms(list); return { id, name }; }
  async updateClassificationForm(id, patch) { const list=loadForms(); const idx=list.findIndex(i=>i.id===id); if (idx>-1) { list[idx]={ ...list[idx], ...patch }; saveForms(list); return list[idx]; } throw new Error('Not found'); }
  async deleteClassificationForm(id) { const list=loadForms().filter(i=>i.id!==id); saveForms(list); return true; }
  generateMockDataFromFormStructure(formStructure, fileId) { const mockData = {}; if (!formStructure.fields) return {}; formStructure.fields.forEach(field => { if (field.type === 'object' && field.fields) { mockData[field.name] = {}; field.fields.forEach(subField => { mockData[field.name][subField.name] = this.generateFieldValue(subField, fileId); }); } else if (field.type === 'array' && field.fields) { const itemCount = Math.floor(Math.random() * 3) + 1; mockData[field.name] = []; for (let i = 0; i < itemCount; i++) { const item = {}; field.fields.forEach(subField => { item[subField.name] = this.generateFieldValue(subField, fileId, i); }); mockData[field.name].push(item); } } else { mockData[field.name] = this.generateFieldValue(field, fileId); } }); return mockData; }
  generateFieldValue(field, fileId, index = 0) { if (field.example !== undefined && field.example !== null) { if (field.type === 'number') { return typeof field.example === 'number' ? field.example + Math.floor(Math.random() * 1000) : parseFloat(field.example) || 0; } else if (field.type === 'text') { return typeof field.example === 'string' ? field.example + (index > 0 ? ` ${index + 1}` : '') : '示例文本'; } else if (field.type === 'date') { return field.example || '2024-01-15'; } else if (field.type === 'boolean') { return Math.random() > 0.5; } } const lowerName = field.name.toLowerCase(); if (field.type === 'number') { if (lowerName.includes('价格') || lowerName.includes('金额') || lowerName.includes('总价')) { return Math.floor(Math.random() * 100000) + 1000; } else if (lowerName.includes('数量')) { return Math.floor(Math.random() * 100) + 1; } else if (lowerName.includes('税率')) { return 0.13; } return Math.floor(Math.random() * 1000) + 1; } else if (field.type === 'date') { const dates = ['2024-01-15', '2024-01-20', '2024-01-25', '2024-02-01']; return dates[Math.floor(Math.random() * dates.length)]; } else if (field.type === 'boolean') { return Math.random() > 0.5; } else { if (lowerName.includes('公司') || lowerName.includes('company')) { const companies = ['示例科技有限公司', 'ABC软件公司', 'XYZ技术公司', '创新科技集团']; return companies[Math.floor(Math.random() * companies.length)]; } else if (lowerName.includes('姓名') || lowerName.includes('负责人') || lowerName.includes('name')) { const names = ['张三', '李四', '王五', '赵六', '钱七']; return names[Math.floor(Math.random() * names.length)]; } else if (lowerName.includes('电话') || lowerName.includes('联系') || lowerName.includes('phone')) { return '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'); } else if (lowerName.includes('邮箱') || lowerName.includes('email')) { return 'example@company.com'; } else if (lowerName.includes('地址') || lowerName.includes('address')) { return '北京市朝阳区示例大街123号'; } else if (lowerName.includes('产品') || lowerName.includes('项目')) { const products = ['云服务器', '数据库服务', '技术支持', '软件开发', '系统集成']; return products[Math.floor(Math.random() * products.length)] + (index > 0 ? ` ${index + 1}` : ''); } else if (lowerName.includes('号码') || lowerName.includes('编号')) { return 'NO-2024-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'); } return field.example || `示例${field.name}`; } }
  generateGenericMockData(formStructure) { return { message: '无法生成符合表单结构的数据', formName: formStructure?.formName || '未知表单' }; }
}

export const aiService = new AIService();