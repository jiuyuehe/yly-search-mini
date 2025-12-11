import api from './api';
import { fetchEventSource } from '@microsoft/fetch-event-source';

// AI 接口允许耗时较长，单独超时时间 (ms)
const AI_REQUEST_TIMEOUT = 180000; // 3 分钟，可按需再调大


const CLASSIFICATION_KEY = 'ai_doc_classification_forms_v1';
const DEFAULT_CLASSIFICATION_FORMS = ['计划', '总结', '通知', '公告', '合同', '发票', '报价单', '采购单', '请示', '批复', '会议纪要', '简报', '报告', '方案', '预算', '财务报表', '工作日志', '周报', '月报', '年报', '招聘简章', '培训材料', '流程文档', '规范', '需求文档', '设计文档', '测试用例', '用户手册', '技术白皮书', '市场分析'].map((n, i) => ({
    id: i + 1,
    name: n,
    enabled: true
}));

function loadForms() {
    let raw = null;
    try {
        raw = JSON.parse(localStorage.getItem(CLASSIFICATION_KEY) || 'null');
    } catch { /* ignore parse error */
    }
    if (Array.isArray(raw) && raw.length) return raw;
    localStorage.setItem(CLASSIFICATION_KEY, JSON.stringify(DEFAULT_CLASSIFICATION_FORMS));
    return [...DEFAULT_CLASSIFICATION_FORMS];
}

function saveForms(list) {
    try {
        localStorage.setItem(CLASSIFICATION_KEY, JSON.stringify(list));
    } catch { /* ignore save */
    }
}

class AIService {
    /**
     * OCR识别接口
     * @param {string} esId
     * @returns {Promise<string>} 识别到的文本内容
     */
    async ocrRecognize(esId) {
        if (!esId) throw new Error('缺少 esId');
        try {
            // 使用 application/x-www-form-urlencoded 形式提交 esId，兼容后端期待的表单格式
            const form = new URLSearchParams();
            form.append('esId', esId);
            // Send as URL-encoded form string and include Accept header to match curl example
            const path = '/admin-api/rag/ocr/recognize';
            const bodyStr = form.toString();

            const res = await api.post(path, bodyStr, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': '*/*'
                }, timeout: AI_REQUEST_TIMEOUT
            });

            // 兼容后端返回格式
            if (res && typeof res === 'object') {
                // 支持多种后端返回格式：
                // 1) { code:0, data: '...' } 返回字符串
                // 2) { code:0, data: { text: '...' } } 或 { data: { result: '...' }}
                const rawData = res.data;
                if (typeof rawData === 'string') return rawData || '';
                const data = rawData || res.result || {};
                return data.text || data.result || data.content || '';
            }
            return '';
        } catch (e) {
            console.warn('[AIService] ocrRecognize failed', e);
            throw e;
        }
    }

    _getUserId(userId) {
        if (userId !== undefined && userId !== null && userId !== '') return userId;
        try {
            const raw = localStorage.getItem('userInfo');
            if (raw) {
                const obj = JSON.parse(raw);
                const uid = obj?.userId || obj?.id || obj?.uid || obj?.userID || '';
                if (uid !== undefined && uid !== null && uid !== '') return uid;
            }
        } catch { /* ignore parse */
        }
        return '';
    }

    _resolveApiPath(path) {
        // 在开发服务器(端口3000)时需通过 /api 触发 vite 代理；生产环境保持原样
        try {
            const isDev = typeof window !== 'undefined' && (window.location.port === '3000' || window.location.hostname === 'localhost');
            if (isDev && path.startsWith('/admin-api/')) return '/rag' + path; // 触发代理 /api -> backend
            return path;
        } catch {
            return path;
        }
    }

    async getSummary(fileId, targetLanguage = '', length = 200, onChunk, fileData) {
        if (typeof targetLanguage === 'function') {
            fileData = onChunk;
            onChunk = targetLanguage;
            targetLanguage = 'zh';
        }
        // const text = this.buildTextFromFileData(fileData) || '';
        const esId = fileData?.esId || fileData?.esid || fileData?._raw?.esId || fileData?._raw?.esid || null;
        const normalizeToUi = (lang) => {
            if (!lang) return '';
            if (targetLanguage === 'zh') return '中文';
            if (targetLanguage === 'en') return '英文';
            const low = String(lang).toLowerCase();
            const map = {
                '中文': 'zh',
                'zh': 'zh',
                'cn': 'zh',
                'chs': 'zh',
                '简体中文': 'zh',
                'zh-cn': 'zh',
                'zh_cn': 'zh',
                '英文': 'en',
                'english': 'en',
                'en': 'en',
                '日文': 'ja',
                '日本語': 'ja',
                'ja': 'ja',
                'jp': 'ja',
                '韩文': 'ko',
                '韓文': 'ko',
                'ko': 'ko',
                'kor': 'ko'
            };
            return map[low] || low;
        };
        const apiLang = normalizeToUi(targetLanguage);
        const body = { targetLang: apiLang, outputFormat: 'plain', size: length };
        if (esId) {
            body.esId = esId;
        }
        try {
            const res = await api.post('/admin-api/rag/ai/text/summary', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: AI_REQUEST_TIMEOUT
            }).catch(e => {
                throw e;
            });
            const parseMaybeJson = (str) => {
                if (str == null) return { summary: '' };
                if (typeof str !== 'string') return {
                    summary: str?.summary || '',
                    key_points: str?.key_points || str?.keyPoints || str?.points
                };
                let cleaned = str.trim();
                // strip surrounding quotes if it looks like a quoted JSON block
                if ((cleaned.startsWith('"{"') && cleaned.endsWith('}""')) || (cleaned.startsWith('"{') && cleaned.endsWith('}"'))) {
                    try {
                        cleaned = cleaned.slice(1, -1);
                    } catch { /* ignore */
                    }
                }
                // remove markdown code fences ```json ... ```
                if (cleaned.startsWith('```')) {
                    cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\n?/, '');
                    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
                    cleaned = cleaned.trim();
                }
                const tryJson = (txt) => {
                    try {
                        const o = JSON.parse(txt);
                        if (o && typeof o === 'object') return o;
                    } catch { /* ignore */
                    }
                    return null;
                };
                if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
                    const obj = tryJson(cleaned);
                    if (obj) return obj;
                }
                return { summary: cleaned };
            };
            if (res && typeof res === 'object') {
                const data = res.data || res.result || {};
                // 新结构： summarySource / summaryTarget / summary
                const targetRaw = data.summaryTarget || data.summary || data.target || '';
                const targetObj = parseMaybeJson(targetRaw);
                let targetSummary = String(targetObj.summary || targetRaw || '');
                // 取消长度截断，完整展示摘要内容（原逻辑: if (length && targetSummary && targetSummary.length > length) targetSummary = targetSummary.slice(0, length) + '...';）
                // Streaming only for target summary
                if (onChunk && targetSummary) {
                    const chars = targetSummary.split('');
                    for (let i = 0; i < chars.length; i++) {
                        await new Promise(r => setTimeout(r, 8));
                        try {
                            onChunk(chars.slice(0, i + 1).join(''));
                        } catch { /* ignore chunk error */
                        }
                    }
                }
                return {
                    summary: targetSummary,
                    targetObj,
                    targetLang: normalizeToUi(data.targetLang || apiLang),
                    esId: esId || body.esId || null
                };
            }
            return { summary: '', targetObj: {}, sourceObj: {}, targetLang: normalizeToUi(apiLang), sourceLang: '', esId: esId || null };
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
                if (str == null) return { summary: '' };
                if (typeof str !== 'string') return {
                    summary: str?.summary || '',
                    key_points: str?.key_points || str?.keyPoints || str?.points
                };
                let cleaned = str.trim();
                if (cleaned.startsWith('```')) {
                    cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\n?/, '');
                    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
                    cleaned = cleaned.trim();
                }
                if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
                    try {
                        const o = JSON.parse(cleaned);
                        if (o) return o;
                    } catch { /* ignore */
                    }
                }
                return { summary: cleaned };
            };
            const targetRaw = data.summaryTarget || '';
            const sourceRaw = data.summary || '';
            const targetObj = parseMaybeJson(targetRaw);
            const sourceObj = parseMaybeJson(sourceRaw);
            const normalizeToUi = (lang) => {
                if (!lang) return 'zh';
                const low = String(lang).toLowerCase();
                const map = {
                    '中文': 'zh',
                    'zh': 'zh',
                    'cn': 'zh',
                    'chs': 'zh',
                    '简体中文': 'zh',
                    'zh-cn': 'zh',
                    'zh_cn': 'zh',
                    '英文': 'en',
                    'english': 'en',
                    'en': 'en',
                    '日文': 'ja',
                    '日本語': 'ja',
                    'ja': 'ja',
                    'jp': 'ja',
                    '韩文': 'ko',
                    '韓文': 'ko',
                    'ko': 'ko',
                    'kor': 'ko'
                };
                return map[low] || low;
            };
            return {
                targetSummary: String(targetObj.summary || targetRaw || ''),
                sourceSummary: String(sourceObj.summary || sourceRaw || ''),
                targetObj,
                sourceObj,
                targetLang: normalizeToUi(data.targetLang || data.lang || ''),
                sourceLang: data.sourceLang || '',
                esId
            };
        } catch (e) {
            console.warn('[AIService] fetchCachedSummary failed', e);
            return null;
        }
    }

    async saveSummary(esId, { sourceSummary, targetSummary, sourceLang: _sourceLang, targetLang: _targetLang }) {
        if (!esId) throw new Error('缺少 esId');
        const normalizeToUi = (lang) => {
            if (!lang) return 'zh';
            const low = String(lang).toLowerCase();
            const map = {
                '中文': 'zh',
                'zh': 'zh',
                'cn': 'zh',
                'chs': 'zh',
                '简体中文': 'zh',
                'zh-cn': 'zh',
                'zh_cn': 'zh',
                '英文': 'en',
                'english': 'en',
                'en': 'en',
                '日文': 'ja',
                '日本語': 'ja',
                'ja': 'ja',
                'jp': 'ja',
                '韩文': 'ko',
                '韓文': 'ko',
                'ko': 'ko',
                'kor': 'ko'
            };
            return map[low] || low;
        };
        const uiLang = normalizeToUi(_targetLang);
        const apiLang = uiLang === 'zh' ? 'cn' : uiLang;
        const body = {
            esId,
            summarySource: sourceSummary || '',
            summary: targetSummary || '',
            summaryTarget: targetSummary || '',
            targetLang: apiLang
        };
        try {
            const res = await api.post('/admin-api/rag/ai/text/summary/update', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            });
            if (res && typeof res === 'object') {
                if (res.code === 0) return { success: true };
            }
            return { success: false, message: res?.msg || '保存失败' };
        } catch (e) {
            console.warn('[AIService] saveSummary failed', e);
            throw e;
        }
    }

    async getTags(fileId, fileData) {
        // const text = this.buildTextFromFileData(fileData) || '';
        const esId = fileData?.esId || fileData?.esid || fileData?._raw?.esId || fileData?._raw?.esid || null;
        const body = { outputFormat: 'tag_list' };
        if (esId) {
            body.esId = esId;
        }
        try {
            const res = await api.post('/admin-api/rag/ai/text/tags', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: AI_REQUEST_TIMEOUT
            }).catch(e => {
                throw e;
            });
            const out = [];
            if (res && typeof res === 'object') {
                const data = res.data || res.result || {};
                let kw = data.keywords || data.TagItem || data.list || data;
                // 若是关键字数组对象: [{weight, tag}...]
                if (Array.isArray(kw)) {
                    kw.forEach(it => {
                        if (!it) return;
                        if (typeof it === 'string') {
                            out.push({ tag: it, weight: 0 });
                            return;
                        }
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
                            parsed.keywords.forEach(k => {
                                if (k?.tag) out.push({ tag: k.tag, weight: Number(k.weight || 0) });
                            });
                        } else {
                            str.split(/[;,，、\s]+/).filter(Boolean).forEach(t => out.push({ tag: t, weight: 0 }));
                        }
                    } catch {
                        str.split(/[;,，、\s]+/).filter(Boolean).forEach(t => out.push({ tag: t, weight: 0 }));
                    }
                } else if (kw && typeof kw === 'object') {
                    // 可能是 { tag: weight } map
                    Object.entries(kw).forEach(([k, v]) => {
                        if (typeof v === 'number') out.push({ tag: k, weight: v });
                    });
                }
            }
            // --------- Fragmented JSON reconstruction (新版解析) ---------
            const fragmented = out.some(o => /```/.test(o.tag)) && out.some(o => /"keywords"/.test(o.tag));
            if (fragmented) {
                try {
                    const frags = out.map(o => ({ raw: o.tag, w: o.weight }));
                    const tagEntries = [];
                    const weightVals = [];
                    const isWeightToken = (s) => /^\d+(?:\.\d+)?}?$/.test(s.replace(/^[^{0-9.]*/, ''));
                    // First pass: collect quoted phrases and weight tokens order
                    for (let i = 0; i < frags.length; i++) {
                        let tok = frags[i].raw.trim();
                        if (!tok) continue;
                        if (/^```/.test(tok) || tok === '{"tag":' || tok === '{"tag":' || tok === '{') continue;
                        if (/"keywords":/.test(tok)) continue;
                        if (tok === '"weight":' || tok === '"weight":') continue;
                        if (tok.includes('"weight":')) continue;
                        // weight token
                        if (isWeightToken(tok)) {
                            const num = parseFloat(tok.replace(/[^0-9.]/g, ''));
                            if (Number.isFinite(num)) weightVals.push(num);
                            continue;
                        }
                        // remove leading {"tag": if still present
                        tok = tok.replace(/^{?"tag":?/, '').trim();
                        // Quote-based phrase assembly
                        if (tok.startsWith('"')) {
                            let phrase = tok;
                            while (!/"$/.test(phrase) && i < frags.length - 1) {
                                i++;
                                phrase += ' ' + frags[i].raw.trim();
                            }
                            // Clean quotes
                            phrase = phrase.replace(/^"|"$/g, '').trim();
                            if (phrase) {
                                tagEntries.push({ tag: phrase, weight: 0 });
                            }
                            continue;
                        }
                    }
                    // Fallback: some single-token quoted full tags like "Military"
                    if (!tagEntries.length) {
                        frags.forEach(f => {
                            const m = f.raw.match(/^"([^"]+)"$/);
                            if (m) tagEntries.push({ tag: m[1], weight: 0 });
                        });
                    }
                    // Assign weights in order
                    for (let i = 0; i < tagEntries.length; i++) {
                        if (weightVals[i] !== undefined) tagEntries[i].weight = weightVals[i];
                    }
                    // If still empty, skip; else replace out
                    if (tagEntries.length) {
                        // Merge multi-word duplicates (e.g., Military vs Military Parade keep higher weight)
                        const ded = new Map();
                        tagEntries.forEach(e => {
                            const key = e.tag.toLowerCase();
                            const ex = ded.get(key);
                            if (!ex || e.weight > ex.weight) ded.set(key, e);
                        });
                        const rebuilt = Array.from(ded.values())
                            .filter(e => !/^(?:keywords|tag|weight)$/i.test(e.tag))
                            .filter(e => e.tag.length > 1)
                            .sort((a, b) => b.weight - a.weight);
                        if (rebuilt.length) {
                            out.length = 0;
                            rebuilt.forEach(r => out.push(r));
                        }
                    }
                } catch (err) {
                    console.warn('[AIService] fragmented tag reparse failed', err);
                }
            }
            // 进一步清洗单条
            const cleanedFinal = out
                .map(o => ({
                    tag: (o.tag || '')
                        .replace(/^`+|`+$/g, '')
                        .replace(/^["'{[]+/, '')
                        .replace(/["'}\]]+$/, '')
                        .replace(/\\n/g, ' ')
                        .trim(),
                    weight: o.weight
                }))
                .filter(o => o.tag && !/^[{}:,]+$/.test(o.tag) && !/^0?\.\d+$/.test(o.tag))
                .filter(o => !/^tag$/i.test(o.tag) && !/^weight$/i.test(o.tag) && !/^keywords$/i.test(o.tag));
            // 重新去重
            const dedup = new Map();
            cleanedFinal.forEach(it => {
                const key = it.tag.toLowerCase();
                const prev = dedup.get(key);
                if (!prev || it.weight > prev.weight) dedup.set(key, it);
            });
            const finalList = Array.from(dedup.values()).sort((a, b) => b.weight - a.weight);
            return finalList.slice(0, 100);
        } catch (e) {
            console.warn('[AIService] tags failed', e);
            throw e;
        }
    }

    async saveTags(esId, _tagsWithWeights = []) {
        if (!esId) return { success: false, message: '缺少 esId' };
        const keywords = _tagsWithWeights.map(t => ({ tag: t.tag, weight: Number(t.weight || 0) })).filter(t => t.tag);
        try {
            const res = await api.post('/admin-api/rag/ai/text/tags/update', {
                esId,
                keywords
            }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
            if (res && typeof res === 'object' && res.code === 0) return { success: true };
            return { success: false, message: res?.msg || '保存失败' };
        } catch (e) {
            console.warn('[AIService] saveTags failed', e);
            return { success: false, message: e.message };
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
                kw.forEach(it => {
                    if (!it) return;
                    if (typeof it === 'string') {
                        out.push({ tag: it, weight: 0 });
                        return;
                    }
                    const tag = it.tag || it.keyword || it.key || it.name || '';
                    const weight = Number(it.weight ?? it.score ?? 0) || 0;
                    if (tag) out.push({ tag, weight });
                });
            } else if (kw && typeof kw === 'object') {
                Object.entries(kw).forEach(([k, v]) => {
                    if (typeof v === 'number') out.push({ tag: k, weight: v });
                });
            }
            return out.length ? out.slice(0, 100) : null;
        } catch (e) {
            console.warn('[AIService] fetchCachedTags failed', e);
            return null;
        }
    }

    async getNEREntities(fileId, fileData) {
        // fileId may be provided as esId when fileData is null
        // const text = this.buildTextFromFileData(fileData) || '';
        let esId = fileData?.esId || fileData?.esid || fileData?._raw?.esId || fileData?._raw?.esid || null;
        if (!esId && fileId) esId = String(fileId || '').trim() || null;
        const body = { outputFormat: 'json' };
        if (esId) {
            body.esId = esId;
            body.esid = esId;
        }
        try {
            const res = await api.post('/admin-api/rag/ai/text/ner', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: AI_REQUEST_TIMEOUT
            }).catch(e => {
                throw e;
            });
            const grouped = { persons: [], organizations: [], locations: [], dates: [], events: [], others: [] };
            if (res && typeof res === 'object') {
                // Unwrap common wrappers: { code, data } or { data: { data: [...] } }
                let data = res.data ?? res.result ?? res;
                if (data && typeof data === 'object' && 'code' in data && data.data !== undefined) data = data.data;
                // if data itself is wrapped: { data: [...] }
                if (data && typeof data === 'object' && data.data !== undefined) data = data.data;
                // Case A: data is an array whose first element is an object with uppercase keys
                if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object' && !Array.isArray(data[0])) {
                    const obj = data[0];
                    const pushArr = (val, key) => {
                        if (Array.isArray(val)) {
                            val.forEach(v => {
                                if (v !== null && v !== undefined) grouped[key].push(String(v).trim());
                            });
                        } else if (val !== null && val !== undefined) {
                            grouped[key].push(String(val).trim());
                        }
                    };
                    pushArr(obj.PERSON ?? obj.PER ?? obj.PEOPLE, 'persons');
                    pushArr(obj.ORG ?? obj.ORGANIZATION, 'organizations');
                    pushArr(obj.ADDR ?? obj.LOCATION ?? obj.PLACE, 'locations');
                    pushArr(obj.TIME ?? obj.DATE, 'dates');
                    pushArr(obj.EVENT ?? obj.EVENTS, 'events');
                    // collect any other fields (strings or arrays)
                    Object.keys(obj).forEach(k => {
                        const upper = String(k).toUpperCase();
                        if (!['PERSON', 'PER', 'PEOPLE', 'ORG', 'ORGANIZATION', 'ADDR', 'LOCATION', 'PLACE', 'TIME', 'DATE', 'EVENT', 'EVENTS'].includes(upper)) {
                            const v = obj[k];
                            if (Array.isArray(v)) v.forEach(x => {
                                if (x !== null && x !== undefined) grouped.others.push(String(x).trim());
                            });
                            else if (v !== null && v !== undefined) grouped.others.push(String(v).trim());
                        }
                    });
                } else if (data && typeof data === 'object' && !Array.isArray(data)) {
                    // Case B: backend returns a single object { PERSON: [...], ... } or already grouped
                    const obj = data;
                    const pushArr = (val, key) => {
                        if (Array.isArray(val)) val.forEach(v => {
                            if (v !== null && v !== undefined) grouped[key].push(String(v).trim());
                        });
                        else if (val !== null && val !== undefined) grouped[key].push(String(val).trim());
                    };
                    // uppercase-style
                    pushArr(obj.PERSON ?? obj.PER ?? obj.PEOPLE, 'persons');
                    pushArr(obj.ORG ?? obj.ORGANIZATION, 'organizations');
                    pushArr(obj.ADDR ?? obj.LOCATION ?? obj.PLACE, 'locations');
                    pushArr(obj.TIME ?? obj.DATE, 'dates');
                    pushArr(obj.EVENT ?? obj.EVENTS, 'events');
                    // also accept already-normalized lowercase keys
                    ['persons', 'organizations', 'locations', 'dates', 'events', 'others'].forEach(k => {
                        if (Array.isArray(obj[k])) grouped[k] = grouped[k].concat(obj[k].map(x => String(x).trim()));
                    });
                } else if (Array.isArray(data)) {
                    // Case C: older format [{type:'PERSON', value:'张三'}, ...]
                    data.forEach(it => {
                        if (!it) return;
                        try {
                            const t = (it.type || '').toLowerCase();
                            const val = it.value || it.text || it.name || '';
                            if (!val) return;
                            if (['person', 'per', 'persons'].includes(t)) grouped.persons.push(String(val).trim());
                            else if (['org', 'organization', 'orgs'].includes(t)) grouped.organizations.push(String(val).trim());
                            else if (['loc', 'location', 'place'].includes(t)) grouped.locations.push(String(val).trim());
                            else if (['date', 'time'].includes(t)) grouped.dates.push(String(val).trim());
                            else grouped.others.push(String(val).trim());
                        } catch { /* ignore item */
                        }
                    });
                }
            }
            // normalize and dedupe
            const normalizeUnique = arr => Array.from(new Set((arr || []).map(s => String(s).trim()).filter(Boolean)));
            grouped.persons = normalizeUnique(grouped.persons);
            grouped.organizations = normalizeUnique(grouped.organizations);
            grouped.locations = normalizeUnique(grouped.locations);
            grouped.dates = normalizeUnique(grouped.dates);
            grouped.events = normalizeUnique(grouped.events);
            grouped.others = normalizeUnique(grouped.others);
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
            let data = res.data || res.result || res;
            if (data && typeof data === 'object' && 'code' in data && data.data !== undefined) data = data.data;
            if (data && typeof data === 'object' && data.data !== undefined) data = data.data;
            // normalize return into grouped { persons, organizations, locations, dates, events, others }
            const grouped = { persons: [], organizations: [], locations: [], dates: [], events: [], others: [] };
            // Case A: data is an array whose first element is an object with uppercase keys
            if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object' && !Array.isArray(data[0])) {
                const obj = data[0];
                const pushArr = (val, key) => {
                    if (Array.isArray(val)) val.forEach(v => {
                        if (v !== null && v !== undefined) grouped[key].push(String(v).trim());
                    });
                    else if (val !== null && val !== undefined) grouped[key].push(String(val).trim());
                };
                pushArr(obj.PERSON ?? obj.PER ?? obj.PEOPLE, 'persons');
                pushArr(obj.ORG ?? obj.ORGANIZATION, 'organizations');
                pushArr(obj.ADDR ?? obj.LOCATION ?? obj.PLACE, 'locations');
                pushArr(obj.TIME ?? obj.DATE, 'dates');
                pushArr(obj.EVENT ?? obj.EVENTS, 'events');
                // collect any other fields
                Object.keys(obj).forEach(k => {
                    const upper = String(k).toUpperCase();
                    if (!['PERSON', 'PER', 'PEOPLE', 'ORG', 'ORGANIZATION', 'ADDR', 'LOCATION', 'PLACE', 'TIME', 'DATE', 'EVENT', 'EVENTS'].includes(upper)) {
                        const v = obj[k];
                        if (Array.isArray(v)) v.forEach(x => {
                            if (x !== null && x !== undefined) grouped.others.push(String(x).trim());
                        });
                        else if (v !== null && v !== undefined) grouped.others.push(String(v).trim());
                    }
                });
            } else if (data && typeof data === 'object' && !Array.isArray(data)) {
                // Case B: maybe already grouped object { PERSON: [...], ORG: [...] } or { persons:[], organizations:[] }
                const pushArr = (val, key) => {
                    if (Array.isArray(val)) val.forEach(v => {
                        if (v !== null && v !== undefined) grouped[key].push(String(v).trim());
                    });
                    else if (val !== null && val !== undefined) grouped[key].push(String(val).trim());
                };
                // uppercase-style
                pushArr(data.PERSON ?? data.PER ?? data.PEOPLE, 'persons');
                pushArr(data.ORG ?? data.ORGANIZATION, 'organizations');
                pushArr(data.ADDR ?? data.LOCATION ?? data.PLACE, 'locations');
                pushArr(data.TIME ?? data.DATE, 'dates');
                pushArr(data.EVENT ?? data.EVENTS, 'events');
                // also accept already-normalized lowercase keys
                ['persons', 'organizations', 'locations', 'dates', 'events', 'others'].forEach(k => {
                    if (Array.isArray(data[k])) grouped[k] = grouped[k].concat(data[k].map(x => String(x).trim()));
                });
            } else if (Array.isArray(data)) {
                // Case C: older format [{ type:'PERSON', value:'张三' }, ...]
                data.forEach(it => {
                    try {
                        if (!it) return;
                        const t = (it.type || '').toLowerCase();
                        const val = it.value || it.text || it.name || '';
                        if (!val) return;
                        if (['person', 'per', 'persons'].includes(t)) grouped.persons.push(String(val).trim()); else if (['org', 'organization', 'orgs'].includes(t)) grouped.organizations.push(String(val).trim()); else if (['loc', 'location', 'place'].includes(t)) grouped.locations.push(String(val).trim()); else if (['date', 'time'].includes(t)) grouped.dates.push(String(val).trim()); else grouped.others.push(String(val).trim());
                    } catch { /* ignore */
                    }
                });
            }
            // dedupe & normalize
            const normalizeUnique = arr => Array.from(new Set((arr || []).map(s => String(s).trim()).filter(Boolean)));
            grouped.persons = normalizeUnique(grouped.persons);
            grouped.organizations = normalizeUnique(grouped.organizations);
            grouped.locations = normalizeUnique(grouped.locations);
            grouped.dates = normalizeUnique(grouped.dates);
            grouped.events = normalizeUnique(grouped.events);
            grouped.others = normalizeUnique(grouped.others);
            const hasAny = Object.values(grouped).some(a => a.length);
            return hasAny ? grouped : null;
        } catch (e) {
            console.warn('[AIService] fetchCachedNER failed', e);
            return null;
        }
    }

    async saveNER(esId, nerGrouped) {
        if (!esId) return { success: false, message: '缺少 esId' };
        // 构造后端期望的单对象大写键数组结构
        try {
            const makeArray = (arr) => Array.isArray(arr) ? arr.map(x => String(x).trim()).filter(Boolean) : [];
            const personsArr = makeArray(nerGrouped?.persons);
            const orgArr = makeArray(nerGrouped?.organizations);
            const locArr = makeArray(nerGrouped?.locations);
            const timeArr = makeArray(nerGrouped?.dates);
            // merge events and others (some callers use 'others' for miscellaneous entities)
            const eventsArr = makeArray(nerGrouped?.events);
            const othersArr = makeArray(nerGrouped?.others);

            const obj = {
                PERSON: personsArr.length ? personsArr : null,
                ADDR: locArr.length ? locArr : null,
                TIME: timeArr,
                ORG: orgArr,
                EVENT: eventsArr.length ? eventsArr : null,
                OTHERS: othersArr.length ? othersArr : null
            };
            const payload = [obj];
            const res = await api.post('/admin-api/rag/ai/text/ner/update', {
                esId,
                esid: esId,
                ner: payload
            }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
            if (res && typeof res === 'object' && (res.code === 0 || res.success === true)) return { success: true };
            return { success: false, message: res?.msg || '保存失败' };
        } catch (e) {
            console.warn('[AIService] saveNER failed', e);
            return { success: false, message: e.message };
        }
    }

    async extractCustomInfo(fileId, template) {
        try {
            await new Promise(r => setTimeout(r, 600));
            const mockResults = {
                contract: {
                    parties: ['甲方：XX公司', '乙方：YY公司'],
                    amount: '100万元',
                    date: '2024-01-15',
                    duration: '12个月'
                }, invoice: { number: 'INV-2024-001', amount: '50000元', date: '2024-01-15', vendor: 'ABC供应商' }
            };
            return mockResults[template.type] || {};
        } catch {
            console.warn('AI Extract API fallback');
            return {};
        }
    }


    async askQuestion(fileId, question, onChunk) {
        try {
            const answers = ['根据文档内容，这个问题的答案是：', '首先，我们需要分析文档中的相关信息。', '通过对文档的理解，可以得出以下结论：', `关于"${question}"这个问题，文档中提到了相关的内容和解决方案。`];
            const answer = answers[Math.random() * answers.length | 0] + ' 这是一个基于文档内容生成的模拟回答，展示了AI问答功能的工作方式。';
            if (onChunk) {
                const words = answer.split('');
                for (let i = 0; i < words.length; i++) {
                    await new Promise(r => setTimeout(r, 80));
                    onChunk(words.slice(0, i + 1).join(''));
                }
            }
            return answer;
        } catch {
            console.warn('AI QA API fallback');
            return '这是一个模拟的问答回复。';
        }
    }

    async translateText(text, targetLanguage, onChunk, esId = null) {
        try {
            const body = { text, targetLang: targetLanguage, esId: esId || undefined, outputFormat: 'plain' };
            const res = await api.post('/admin-api/rag/ai/text/translate', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: AI_REQUEST_TIMEOUT
            });
            // 兼容统一包装格式 { code, data:{ translated }, msg }
            let translated = res?.data?.data?.translated || res?.data?.translated || res?.data?.data?.translation || res?.data?.translation || res?.data?.data?.text || res?.data?.text || res?.data?.result || '';
            if (translated && typeof translated === 'object') {
                // 避免把对象直接当字符串
                translated = translated.translated || translated.translation || translated.text || '';
            }
            if (typeof translated === 'object') translated = translated.translated || translated.translation || '';
            if (!translated) translated = `[${targetLanguage}] ${text}`;
            if (onChunk) {
                const chars = translated.split('');
                for (let i = 0; i < chars.length; i++) {
                    await new Promise(r => setTimeout(r, 6));
                    try {
                        onChunk(chars.slice(0, i + 1).join(''));
                    } catch {/* ignore */
                    }
                }
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
        const type = (sourceLang || '') + (targetLang || '');
        const body = {
            content: fullText,
            sourceLanguage: sourceLang || 'auto',
            targetLanguage: targetLang === 'zh' ? 'cn' : targetLang, // 若后端需要 cn 表示中文
            type,
            trans_uid: 6,
            userId: ''
        };
        try {
            const res = await api.post('/Itrans/onlinetrans/tourist', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: AI_REQUEST_TIMEOUT
            });
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
            const root = res?.data || res?.result || res || {};
            const data = root?.data !== undefined ? root.data : root; // 兼容 { code, data } 包装
            if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;

            // 后端可能返回完整任务结构：sourceLanguage/targetLanguage/targetList/translatedPairs/concatTarget/translated/translate{...}
            const translateNode = data.translate || data.statusNode || null;
            const translation = data.concatTarget || data.translated || data.translation || data.text || data.content || '';

            // 标准化返回：始终返回 { translation, ...data, translate }
            const out = {
                translation: String(translation || ''),
                ...data
            };
            if (translateNode && typeof translateNode === 'object') {
                const total = Number(translateNode.total ?? 0) || 0;
                const done = Number(translateNode.done ?? 0) || 0;
                const rawStatus = String(translateNode.status || '').toLowerCase();
                const rawComplete = !!translateNode.complete;
                const err = translateNode.error || data.error || null;
                // 统一计算进度
                let progress = Number(translateNode.progress);
                if (!Number.isFinite(progress)) {
                    progress = total > 0 ? Math.round((done / total) * 100) : 0;
                }
                // 规范化完成与状态判断：若 done < total，则不视为完成（即使后端标记 completed）
                let complete = rawComplete;
                if (total > 0 && done < total) complete = false;
                // 将状态映射为 running/done/error 三态
                let status = rawStatus;

                out.translate = {
                    status,
                    total,
                    done,
                    complete,
                    progress,
                    error: err,
                    taskId: translateNode.taskId || translateNode.id || null,
                    updatedAt: translateNode.updatedAt || translateNode.updateTime || translateNode.timestamp || null
                };
            }
            return out;
        } catch (e) {
            console.warn('[AIService] fetchCachedTranslation failed', e);
            return null;
        }
    }

    async saveTranslation(esId, translation) {
        if (!esId) return { success: false, message: '缺少 esId' };
        try {
            const body = { esId, translated: translation };
            const res = await api.post('/admin-api/rag/ai/text/translate/update', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            });
            if (res && typeof res === 'object' && res.code === 0) return { success: true };
            return { success: false, message: res?.msg || '保存失败' };
        } catch (e) {
            console.warn('[AIService] saveTranslation failed', e);
            return { success: false, message: e.message };
        }
    }

    // 启动整篇翻译的任务（不传 text，由后端基于 esId 的内容自行翻译）
    async startTranslateTask({ esId, sourceLang = 'auto', targetLang = 'zh', options = {} } = {}) {
        if (!esId) return { success: false, message: '缺少 esId' };
        try {
            const body = {
                esId,
                sourceLang: sourceLang || 'auto',
                targetLang,
                // 为了明确意图，可带一个启动标识，后端可忽略
                start: true,
                ...options
            };
            const res = await api.post('/admin-api/rag/ai/text/translate', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: AI_REQUEST_TIMEOUT
            });
            const root = (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {});
            const data = root?.data !== undefined ? root.data : root;
            const taskId = data?.taskId || data?.translate?.taskId || null;
            return { success: true, taskId, data };
        } catch (e) {
            console.warn('[AIService] startTranslateTask failed', e);
            return { success: false, message: e.message };
        }
    }

    // 保存原文内容（与译文保存接口区分，后端若已有统一接口可复用）
    async saveSourceContent(esId, fileContents) {
        if (!esId) return { success: false, message: '缺少 esId' };
        try {
            const body = {
                esId: esId,
                docs: [{ fileContents: fileContents }]
            };
            const res = await api.post('/admin-api/rag/documents/indexes/update-fields', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            });
            if (res && typeof res === 'object' && res.code === 0) return { success: true };
            return { success: false, message: res?.msg || '保存失败' };
        } catch (e) {
            console.warn('[AIService] saveSourceContent failed', e);
            return { success: false, message: e.message };
        }
    }

    async extractText(fileId) {
        try {
            await new Promise(r => setTimeout(r, 500));
            const mockTexts = {
                1: '这是从PDF文件中提取的文本内容。包含了项目需求的详细描述，技术规范，以及实施方案等重要信息。\n\n主要章节包括：\n1. 项目概述\n2. 功能需求\n3. 技术架构\n4. 实施计划\n\n这些内容为项目的顺利进行提供了重要的参考依据。',
                2: '从图片中识别的文字内容：设计标准、UI规范、图标库等相关设计要素。',
                3: '音频转文字：会议主要讨论了项目进度、技术难点和解决方案等议题。'
            };
            return mockTexts[fileId] || '暂无可提取的文本内容';
        } catch {
            console.warn('Text extraction API fallback');
            return '模拟提取的文本内容';
        }
    }

    async classifyDocument(fileId, _contentHint = '') {
        try {
            await new Promise(r => setTimeout(r, 600));
            const forms = loadForms().filter(f => f.enabled);
            if (!forms.length) return [];
            const picks = forms.sort(() => Math.random() - 0.5).slice(0, Math.min(5, forms.length));
            let remaining = 1.0;
            const results = picks.map((f, idx) => {
                const score = idx === picks.length - 1 ? remaining : +(Math.random() * remaining * 0.6 + 0.05).toFixed(3);
                remaining = +(remaining - score).toFixed(3);
                return { category: f.name, score: score };
            });
            const total = results.reduce((s, r) => s + r.score, 0) || 1;
            return results.map(r => ({ ...r, score: +(r.score / total).toFixed(4) })).sort((a, b) => b.score - a.score);
        } catch {
            console.warn('classifyDocument mock fallback');
            return [];
        }
    }

    async getRelatedDocuments({ esId, query = '', page = 1, pageSize = 10, useLLM = false, forceRefresh = false } = {}) {
        if (!esId) return { list: [], total: 0 };
        const offset = (page - 1) * pageSize;
        try {
            // 按接口文档: GET /admin-api/rag/ai/recommend/related?esId=&keyword=&offset=&limit=
            const params = { esId, useLLM: !!useLLM, keyword: query || undefined, offset, limit: pageSize };
            if (forceRefresh) params.forceRefresh = true;
            const res = await api.get('/admin-api/rag/ai/recommend/related', { params, timeout: 60000 });
            const root = res?.data || res || {};
            const data = root.data || root.result || root;
            // 兼容 list / fileList / data 数组
            const listRaw = Array.isArray(data.list) ? data.list : (Array.isArray(data.fileList) ? data.fileList : (Array.isArray(data) ? data : []));
            const list = listRaw.map((it, idx) => {
                if (!it || typeof it !== 'object') return null;
                // creator: prefer operator or known creator fields
                const creator = it.operator || it.createUserName || it.createrName || it.creatorName || it.creator || it.createUser || it.owner || '';
                // tags: backend may return tags under different shapes; prefer array-like fields or metaTag when array
                let tagsArr = [];
                if (Array.isArray(it.metaTag)) tagsArr = it.metaTag;
                else if (Array.isArray(it.tags)) tagsArr = it.tags;
                else if (Array.isArray(it.fileTags)) tagsArr = it.fileTags;
                else if (Array.isArray(it.tagList)) tagsArr = it.tagList;
                else if (Array.isArray(it.labels)) tagsArr = it.labels;
                // Also accept comma-separated string
                else if (it.metaTag && typeof it.metaTag === 'string' && it.metaTag.includes(',')) tagsArr = it.metaTag.split(',').map(s => s.trim()).filter(Boolean);

                const scoreVal = Number(it.finalScore ?? it.totalScore ?? it.llmScore ?? it.contentScore ?? it.metaScore ?? it.score ?? it.similarity ?? 0);
                return {
                    id: it.esId || it.esid || it.id || it.fileId || `rel_${idx}`,
                    esId: it.esId || it.esid || it.id || it.fileId,
                    name: it.fileName || it.name || it.title || it.filename || `文档${idx + 1}`,
                    score: scoreVal,
                    snippet: it.snippet || it.summary || it.fileSummary || it.highlight || '',
                    creator,
                    tags: Array.isArray(tagsArr) ? tagsArr : [],
                    updateTime: it.updateTime || it.update_at || it.createTime || it.updateTime,
                    fileExt: it.fileExt || it.ext || it.fileExtName || '',
                    usedFallback: !!it.usedFallback,
                    raw: it
                };
            }).filter(Boolean);
            const total = Number(data.total ?? data.count ?? data.totalCount ?? list.length);
            return { list, total };
        } catch (e) {
            console.warn('[AIService] getRelatedDocuments failed, fallback mock', e);
            const mock = Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => ({
                id: `mock_${page}_${i}`,
                esId: `mock_${page}_${i}`,
                name: `相关文档示例 ${i + 1 + (page - 1) * pageSize}`,
                score: +(Math.random() * 0.5 + 0.5).toFixed(3),
                snippet: '这是一个模拟的相关内容片段，用于展示关联推荐效果。'
            }));
            return { list: mock, total: mock.length };
        }
    }

    // ===== Theme Classification (document themes & labels) =====
    async listThemes({ userId } = {}) {
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.get('/admin-api/rag/ai/theme/list', { headers, timeout: 20000 });
            const root = this._normalizeWrapper(res);
            const data = root.data || root.list || [];
            return Array.isArray(data) ? data.map(t => ({
                id: t.id || t.themeId || t.code,
                name: t.name || t.themeName || t.title || t.label || '未命名',
                description: t.description || t.desc || '',
                enabled: t.enabled !== false,
                raw: t
            })) : [];
        } catch (e) {
            console.warn('[AIService] listThemes failed', e);
            return [];
        }
    }

    async listThemesPage({ pageNo = 1, pageSize = 10, userId } = {}) {
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.get('/admin-api/rag/ai/theme/page', {
                params: { pageNo, pageSize },
                headers,
                timeout: 20000
            });
            const root = this._normalizeWrapper(res);
            const dataNode = root.data || root;
            const listRaw = dataNode.list || dataNode.rows || dataNode.data || [];
            const total = Number(dataNode.total || dataNode.count || dataNode.totalCount || listRaw.length || 0);
            const list = Array.isArray(listRaw) ? listRaw.map(t => {
                const labelArray = t.labels || t.labelList || t.tags || t.tagList || t.children || [];
                const themeIdVal = t.id || t.themeId || t.code;
                const labels = Array.isArray(labelArray) ? labelArray.map(l => {
                    const name = l.keyword || l.name || l.label || l.title || '';
                    return {
                        id: l.id || l.labelId || l.code,
                        themeId: themeIdVal,
                        name: name || '未命名',
                        description: l.description || l.desc || l.synonyms || '',
                        enabled: l.enabled !== false,
                        weight: (l.weight !== undefined && l.weight !== null) ? Number(l.weight) : undefined,
                        synonyms: l.synonyms || '',
                        raw: l
                    };
                }) : [];
                return {
                    id: themeIdVal,
                    name: t.name || t.themeName || t.title || t.label || '未命名',
                    description: t.description || t.desc || '',
                    enabled: t.enabled !== false,
                    labels,
                    raw: t
                };
            }) : [];
            return { list, total };
        } catch (e) {
            console.warn('[AIService] listThemesPage failed', e);
            return { list: [], total: 0 };
        }
    }

    async createTheme({ name, description = '', userId } = {}) {
        try {
            const headers = { 'Content-Type': 'application/json' };
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const body = { name, description };
            const res = await api.post('/admin-api/rag/ai/theme/create', body, { headers, timeout: 20000 });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0, id: root.data?.id || root.data || null, raw: root.data };
        } catch (e) {
            console.warn('[AIService] createTheme failed', e);
            return { success: false, message: e.message };
        }
    }

    async updateTheme({ id, name, description, enabled, userId } = {}) {
        if (!id) return { success: false, message: '缺少 id' };
        try {
            const headers = { 'Content-Type': 'application/json' };
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const body = { id, name, description, enabled };
            Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
            const res = await api.post('/admin-api/rag/ai/theme/update', body, { headers, timeout: 20000 });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0 };
        } catch (e) {
            console.warn('[AIService] updateTheme failed', e);
            return { success: false, message: e.message };
        }
    }

    async deleteTheme(id, userId) {
        if (!id) return { success: false };
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.delete('/admin-api/rag/ai/theme/delete', { params: { id }, headers, timeout: 15000 });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0 };
        } catch (e) {
            console.warn('[AIService] deleteTheme failed', e);
            return { success: false, message: e.message };
        }
    }

    async listThemeLabels(themeId, userId) {
        if (!themeId) return [];
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.get('/admin-api/rag/ai/theme/label/list', {
                params: { themeId },
                headers,
                timeout: 20000
            });
            const root = this._normalizeWrapper(res);
            const data = root.data || root.list || root.labels || [];
            return Array.isArray(data) ? data.map(l => {
                const name = l.keyword || l.name || l.label || l.title || '';
                return {
                    id: l.id || l.labelId || l.code,
                    themeId,
                    name: name || '未命名',
                    description: l.description || l.desc || l.synonyms || '',
                    enabled: l.enabled !== false,
                    weight: (l.weight !== undefined && l.weight !== null) ? Number(l.weight) : undefined,
                    synonyms: l.synonyms || '',
                    raw: l
                };
            }) : [];
        } catch (e) {
            console.warn('[AIService] listThemeLabels failed', e);
            return [];
        }
    }

    async createThemeLabel({ themeId, name, description = '', userId } = {}) {
        if (!themeId) return { success: false, message: '缺少 themeId' };
        try {
            const headers = { 'Content-Type': 'application/json' };
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const body = { themeId, name, description };
            const res = await api.post('/admin-api/rag/ai/theme/label/create', body, { headers, timeout: 20000 });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0, id: root.data?.id || root.data || null };
        } catch (e) {
            console.warn('[AIService] createThemeLabel failed', e);
            return { success: false, message: e.message };
        }
    }

    async updateThemeLabel({ id, themeId, name, description, enabled, userId } = {}) {
        if (!id) return { success: false, message: '缺少 id' };
        try {
            const headers = { 'Content-Type': 'application/json' };
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const body = { id, themeId, name, description, enabled };
            Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
            const res = await api.post('/admin-api/rag/ai/theme/label/update', body, { headers, timeout: 20000 });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0 };
        } catch (e) {
            console.warn('[AIService] updateThemeLabel failed', e);
            return { success: false, message: e.message };
        }
    }

    async deleteThemeLabel(id, userId) {
        if (!id) return { success: false };
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.delete('/admin-api/rag/ai/theme/label/delete', {
                params: { id },
                headers,
                timeout: 15000
            });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0 };
        } catch (e) {
            console.warn('[AIService] deleteThemeLabel failed', e);
            return { success: false, message: e.message };
        }
    }

    async classifyByTheme({ esId, themeId, text, topN, userId } = {}) {
        try {
            const uid = this._getUserId(userId);
            const baseHeaders = {};
            if (uid !== '') baseHeaders['X-User-Id'] = uid;
            // 分支1: 有 esId -> 按文档 GET 查询
            if (esId) {
                const params = { esId };
                if (themeId) params.themeId = themeId;
                if (topN) params.topN = topN;
                const res = await api.get('/admin-api/rag/ai/theme/classify', {
                    params,
                    headers: baseHeaders,
                    timeout: 60000
                });
                const root = this._normalizeWrapper(res);
                const dataArr = Array.isArray(root.data) ? root.data : (Array.isArray(root.data?.list) ? root.data.list : (root.data?.results || []));
                return Array.isArray(dataArr) ? dataArr.map((r, i) => this._mapThemeClassifyResp(r, i, themeId)) : [];
            }
            // 分支2: 无 esId 但有文本 -> 尝试 POST (兼容之前写法, 后端若只支持 esId 会返回错误)
            if (text && text.trim()) {
                const body = { text: text.trim() };
                if (themeId) body.themeId = themeId;
                if (topN) body.topN = topN;
                const headers = { ...baseHeaders, 'Content-Type': 'application/json' };
                try {
                    const res = await api.post('/admin-api/rag/ai/theme/classify', body, { headers, timeout: 60000 });
                    const root = this._normalizeWrapper(res);
                    // 兼容 data 为数组或对象包装
                    const node = root.data !== undefined ? root.data : root;
                    const arr = Array.isArray(node) ? node : (Array.isArray(node?.list) ? node.list : (Array.isArray(node?.results) ? node.results : []));
                    return Array.isArray(arr) ? arr.map((r, i) => this._mapThemeClassifyResp(r, i, themeId)) : [];
                } catch (postErr) {
                    console.warn('[AIService] POST classify fallback failed (可能后端不支持纯文本分类)', postErr);
                    return [];
                }
            }
            console.warn('[AIService] classifyByTheme 缺少 esId 与 text，无法分类');
            return [];
        } catch (e) {
            console.warn('[AIService] classifyByTheme failed', e);
            return [];
        }
    }

    async confirmTheme({ esId, themeId, row, payload, userId } = {}) {
        if (!esId) return { success: false, message: '缺少参数' };
        try {
            const uid = this._getUserId(userId);
            // New API: accept full row/payload JSON body
            if (row || payload) {
                const body = Object.assign({}, { theme: row || payload });
                // ensure esId present
                body.esId = body.esId || esId;
                const headers = { 'Content-Type': 'application/json' };
                if (uid !== '') headers['X-User-Id'] = uid;
                const res = await api.post('/admin-api/rag/ai/theme/confirm', body, { headers, timeout: 20000 });
                const root = this._normalizeWrapper(res);
                return { success: root.code === 0 || root.data === true, message: root.msg || '' };
            }
            // Backwards-compatible: form-encoded with esId + themeId
            if (!themeId) return { success: false, message: '缺少 themeId' };
            const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            if (uid !== '') headers['X-User-Id'] = uid;
            const bodyParams = new URLSearchParams();
            bodyParams.append('esId', String(esId));
            bodyParams.append('themeId', String(themeId));
            const res = await api.post('/admin-api/rag/ai/theme/confirm', bodyParams.toString(), {
                headers,
                timeout: 20000
            });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0 || root.data === true, message: root.msg || '' };
        } catch (e) {
            console.warn('[AIService] confirmTheme failed', e);
            return { success: false, message: e.message };
        }
    }

    async unconfirmTheme({ esId, themeId, userId } = {}) {
        if (!esId) return { success: false, message: '缺少参数' };
        try {
            const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const bodyParams = new URLSearchParams();
            bodyParams.append('esId', String(esId));
            bodyParams.append('themeId', String(themeId));
            const res = await api.post('/admin-api/rag/ai/theme/confirm/unconfirm', bodyParams.toString(), {
                headers,
                timeout: 20000
            });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0 || root.data === true, message: root.msg || '' };
        } catch (e) {
            console.warn('[AIService] unconfirmTheme failed', e);
            return { success: false, message: e.message };
        }
    }

    async getThemeMatches(esId, userId) {
        if (!esId) return null;
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.get(`/admin-api/rag/ai/theme/matches/${encodeURIComponent(esId)}`, {
                headers,
                timeout: 20000
            });
            const root = this._normalizeWrapper(res);
            return root.data || null;
        } catch (e) {
            console.warn('[AIService] getThemeMatches failed', e);
            return null;
        }
    }

    _mapThemeClassifyResp(r, i, fallbackThemeId) {
        if (!r) return { id: `rec_${i}`, label: '', themeId: fallbackThemeId || null, rawScore: 0, scorePercent: 0 };
        // 兼容不同字段:
        // 1. 若提供 rawScore(0-1) 与 scorePercent(0-100)
        // 2. 若只有 score(<=1 视为 rawScore, >1 视为百分比)
        let rawScore = undefined;
        if (r.rawScore !== undefined) rawScore = Number(r.rawScore);
        else if (r.score !== undefined) {
            const s = Number(r.score);
            rawScore = (s > 1.00001) ? (s / 100) : s; // 如果 >1 认为是百分值
        } else if (r.prob !== undefined) rawScore = Number(r.prob);
        else if (r.probability !== undefined) rawScore = Number(r.probability);
        if (!Number.isFinite(rawScore)) rawScore = 0;
        let scorePercent = r.scorePercent !== undefined ? Number(r.scorePercent) : (rawScore * 100);
        if (!Number.isFinite(scorePercent)) scorePercent = rawScore * 100;
        const id = r.id || r.labelId || r.themeId || `rec_${i}`;
        return {
            id,
            label: r.label || r.name || r.category || r.themeName || r.themeLabel || '',
            themeId: r.themeId || fallbackThemeId || null,
            themeName: r.themeName || r.name || '',
            rawScore,
            scorePercent,
            matchedKeywords: r.matchedKeywords || r.keywords || [],
            reason: r.reason || r.explain || r.description || ''
        };
    }

    // ===== File Chat (Document QA) =====
    _normalizeWrapper(res) {
        return (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {});
    }

    _extractSessionId(obj) {
        if (!obj) return null;
        if (typeof obj === 'number') return obj;
        return obj.id || obj.sessionId || null;
    }

    async createFileChatSession({
        esId,
        title = '',
        roleId,
        modelId,
        temperature,
        maxTokens,
        maxContexts,
        userPrompt,
        userId
    } = {}) {
        try {
            const body = { title, esId, roleId, modelId, temperature, maxTokens, maxContexts, userPrompt };
            Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
            const headers = { 'Content-Type': 'application/json' };
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.post('/admin-api/rag/ai/text/file-chat/session/create', body, {
                headers,
                timeout: 30000
            });
            const root = this._normalizeWrapper(res);
            const data = root.data !== undefined ? root.data : root; // may be id or object
            const sessionId = this._extractSessionId(data);
            return { success: root.code === 0 && !!sessionId, sessionId, raw: data };
        } catch (e) {
            console.warn('[AIService] createFileChatSession failed', e);
            return { success: false, message: e.message };
        }
    }

    async getLatestFileChatSession({ esId, returnHistory = true, userId } = {}) {
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.get('/admin-api/rag/ai/text/file-chat/session/latest', {
                params: { esId, returnHistory },
                headers,
                timeout: 30000
            });
            const root = this._normalizeWrapper(res);
            if (root.code !== 0) return { success: false };
            const data = root.data; // expected structure from backend sample
            if (!data) return { success: true, session: null, messages: [] };
            const sessionId = this._extractSessionId(data);
            const history = Array.isArray(data.history) ? data.history : (data.messages || []);
            return {
                success: true,
                session: { id: sessionId, esId: data.esId || esId, title: data.title || '', raw: data },
                messages: this._mapChatMessages(history, sessionId)
            };
        } catch (e) {
            console.warn('[AIService] getLatestFileChatSession failed', e);
            return { success: false, session: null, messages: [] };
        }
    }

    async listFileChatSessions({ esId, pageNo = 1, pageSize = 20, userId } = {}) {
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.get('/admin-api/rag/ai/text/file-chat/session/page', {
                params: {
                    esId,
                    pageNo,
                    pageSize
                }, headers, timeout: 30000
            });
            const root = this._normalizeWrapper(res);
            if (root.code !== 0) return { list: [], total: 0 };
            const data = root.data || {};
            const listRaw = data.list || data.sessions || (Array.isArray(data) ? data : []);
            const list = (listRaw || []).map(s => ({
                id: this._extractSessionId(s),
                esId: s.esId || esId,
                title: s.title || '',
                raw: s
            })).filter(s => s.id);
            const total = data.total || list.length;
            return { list, total };
        } catch (e) {
            console.warn('[AIService] listFileChatSessions failed', e);
            return { list: [], total: 0 };
        }
    }

    // 获取指定会话详情（含历史）。如果后端没有提供 sessionId 直查接口，将回退到按 esId 查询最新并比对。
    async getFileChatSessionDetail({ sessionId, esId, returnHistory = true, userId } = {}) {
        if (!sessionId && !esId) return { success: false, session: null, messages: [] };
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            // 优先尝试可能存在的 detail 接口；若 404/非 200 则进入 fallback
            let session = null, history = [];
            try {
                if (sessionId) {
                    // 预留：若后端存在 /session/detail 接口
                    const res = await api.get('/admin-api/rag/ai/text/file-chat/session/detail', { params: { sessionId, returnHistory }, headers, timeout: 30000 });
                    const root = this._normalizeWrapper(res);
                    if (root && root.code === 0) {
                        const data = root.data || {};
                        const sid = this._extractSessionId(data);
                        session = sid ? { id: sid, esId: data.esId || esId, title: data.title || '', raw: data } : null;
                        const msgs = Array.isArray(data.history) ? data.history : (data.messages || []);
                        history = this._mapChatMessages(msgs, sid);
                        // direct detail path succeeded
                    }
                }
            } catch {
                // ignore and fallback
            }
            if (!session && (esId || sessionId)) {
                // fallback: 使用 esId 的 latest；没有 esId 时无法保证该 session 的消息
                const targetEs = esId || null;
                if (targetEs) {
                    const r = await this.getLatestFileChatSession({ esId: targetEs, returnHistory, userId });
                    if (r.success && r.session) {
                        session = r.session;
                        history = r.messages || [];
                    }
                }
            }
            return { success: !!session, session, messages: history };
        } catch (e) {
            console.warn('[AIService] getFileChatSessionDetail failed', e);
            return { success: false, session: null, messages: [] };
        }
    }

    async deleteFileChatSession(sessionId, userId) {
        if (!sessionId) return { success: false };
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.delete('/admin-api/rag/ai/text/file-chat/session/delete', {
                params: { sessionId },
                headers,
                timeout: 20000
            });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0 };
        } catch (e) {
            console.warn('[AIService] deleteFileChatSession failed', e);
            return { success: false, message: e.message };
        }
    }

    async deleteFileChatMessage(messageId, userId) {
        if (!messageId) return { success: false };
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.delete('/admin-api/rag/ai/text/file-chat/message/delete', {
                params: { messageId },
                headers,
                timeout: 20000
            });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0, data: root.data };
        } catch (e) {
            console.warn('[AIService] deleteFileChatMessage failed', e);
            return { success: false, message: e.message };
        }
    }

    async clearFileChatSessions(esId, userId) {
        if (!esId) return { success: false };
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.delete('/admin-api/rag/ai/text/file-chat/session/clear', {
                params: { esId },
                headers,
                timeout: 30000
            });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0 };
        } catch (e) {
            console.warn('[AIService] clearFileChatSessions failed', e);
            return { success: false, message: e.message };
        }
    }

    async clearFileChatSessionHistory(sessionId, userId) {
        if (!sessionId) return { success: false };
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const res = await api.delete('/admin-api/rag/ai/text/file-chat/session/clear-history', {
                params: { sessionId },
                headers,
                timeout: 20000
            });
            const root = this._normalizeWrapper(res);
            return { success: root.code === 0, data: root.data };
        } catch (e) {
            console.warn('[AIService] clearFileChatSessionHistory failed', e);
            return { success: false, message: e.message };
        }
    }

    async updateFileChatSession({ sessionId, modelId, temperature, maxTokens, maxContexts, userPrompt, userId } = {}) {
        if (!sessionId) return { success: false, message: '缺少 sessionId' };
        try {
            const headers = { 'Content-Type': 'application/json' };
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            // 假设后端提供此更新接口 (如无请调整路径或方法)
            const body = { sessionId, modelId, temperature, maxTokens, maxContexts, userPrompt };
            Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
            const res = await api.post('/admin-api/rag/ai/text/file-chat/session/update', body, {
                headers,
                timeout: 30000
            });
            const root = this._normalizeWrapper(res);
            const success = root.code === 0;
            return { success, data: root.data || null };
        } catch (e) {
            console.warn('[AIService] updateFileChatSession failed', e);
            return { success: false, message: e.message };
        }
    }

    async updateFileChatUserPrompt({ sessionId, userPrompt, userId } = {}) {
        if (!sessionId) return { success: false, message: '缺少 sessionId' };
        try {
            const headers = { 'Content-Type': 'application/json' };
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            const body = { sessionId, userPrompt };
            Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
            const res = await api.post('/admin-api/rag/ai/text/file-chat/session/update-user-prompt', body, {
                headers,
                timeout: 30000
            });
            const root = this._normalizeWrapper(res);
            const success = root.code === 0;
            return { success };
        } catch (e) {
            console.warn('[AIService] updateFileChatUserPrompt failed', e);
            return { success: false, message: e.message };
        }
    }

    // 获取当前后台模型里被支持模型；
    async getChatModels({ userId, type = 1 } = {}) {
        try {
            const headers = {};
            const uid = this._getUserId(userId);
            if (uid !== '') headers['X-User-Id'] = uid;
            // 假设后端简易列表接口；若不同请调整路径或参数
            const res = await api.get('/admin-api/rag/ai/model/simple-list', { params: { type }, headers, timeout: 30000 });
            const root = this._normalizeWrapper(res);
            const data = root.data || [];
            const list = Array.isArray(data) ? data.map(m => ({
                id: m.id,
                name: m.name 
            })) : [];
            return list;
        } catch (e) {
            console.warn('[AIService] getChatModels failed', e);
            return [];
        }
    }

    _mapChatMessages(msgs, sessionId) {
        if (!Array.isArray(msgs)) return [];
        return msgs.map(m => {
            // Determine role: backend may send 'type' instead of 'role'
            const rawType = m.role || m.type || m.partRole || m.partType;
            const role = rawType === 'user' ? 'user' : 'assistant';
            const content = m.content || m.text || '';
            // Parse segmentRefs or references if provided as JSON string
            let refs = m.references || m.segmentRefs || m.segmentRefList || null;
            if (typeof refs === 'string') {
                try {
                    const parsed = JSON.parse(refs);
                    if (Array.isArray(parsed)) refs = parsed; else refs = [];
                } catch {
                    refs = [];
                }
            }
            if (!Array.isArray(refs)) refs = [];
            const createdAt = m.createTime || m.createdAt || Date.now();
            return {
                id: m.id || m.messageId || `${Date.now()}_${Math.random()}`,
                sessionId,
                role,
                content,
                parts: [content],
                status: 'done',
                createdAt,
                useContext: !!m.useContext,
                references: refs
            };
        });
    }

    async streamFileChatMessage({
        sessionId,
        esId,
        content,
        useContext = true,
        topK = 3,
        maxContextChars = 8000,
        url,
        signal,
        onDelta,
        onDone,
        onError,
        userId,
        disableReconnect = true
    }) {
        const endpoint = this._resolveApiPath(url || '/admin-api/rag/ai/text/file-chat/stream');
        const body = { sessionId, esId, content, useContext, topK, maxContextChars };
        const headers = { 'Content-Type': 'application/json' };
        const uid = this._getUserId(userId);
        if (uid !== '') headers['X-User-Id'] = uid;
        const ctrl = signal ? { signal } : new AbortController();
        const abortSignal = signal || ctrl.signal;
        try {
            await fetchEventSource(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: abortSignal,
                openWhenHidden: true,
                onopen: async (resp) => {
                    if (!resp.ok) {
                        throw new Error('HTTP ' + resp.status);
                    }
                },
                onmessage: (ev) => {
                    const payload = ev.data;
                    if (payload === '[DONE]') {
                        onDone && onDone();
                        return;
                    }
                    try {
                        const json = JSON.parse(payload);
                        if (json.partType === 'end') {
                            onDone && onDone();
                            return;
                        }
                        const seg = json.content || json.delta || json.text;
                        if (seg) onDelta && onDelta(seg);
                    } catch {
                        if (payload) onDelta && onDelta(payload);
                    }
                },
                onclose: () => {
                    onDone && onDone();
                },
                onerror: (err) => {
                    if (err?.name === 'AbortError') {
                        onError && onError('aborted');
                        throw err;
                    }
                    console.warn('[AIService] SSE error', err);
                    onError && onError(err.message || 'stream error');
                    // 禁止自动重连：abort + 抛出终止
                    try {
                        if (!abortSignal.aborted) {
                            if (ctrl.signal && ctrl.signal.abort) ctrl.signal.abort(); else if (ctrl.abort) ctrl.abort();
                        }
                    } catch { /* ignore */
                    }
                    if (disableReconnect) {
                        throw err instanceof Error ? err : new Error('stream error');
                    }
                }
            });
        } catch (e) {
            if (e.name === 'AbortError') {
                onError && onError('aborted');
            } else {
                console.warn('[AIService] streamFileChatMessage failed', e);
                onError && onError(e.message);
            }
        }
    }

    // === Glossary (术语库) ===
    async getGlossaryPage({ pageNo = 1, pageSize = 20, type = '', originalText = '', language = 'zh' } = {}) {
        try {
            const params = { pageNo, pageSize };
            if (type) params.type = type;
            if (originalText) params.originalText = originalText;
            if (language) params.language = language;
            const res = await api.get('/admin-api/rag/ai/translate/glossary/page', { params, timeout: 20000 });
            const root = (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {});
            const dataNode = (root && typeof root.data === 'object' && !Array.isArray(root.data)) ? root.data : root;
            return {
                list: Array.isArray(dataNode.list) ? dataNode.list : (Array.isArray(root.list) ? root.list : []),
                total: Number(dataNode.total || root.total || 0)
            };
        } catch (e) {
            console.warn('[AIService] getGlossaryPage failed', e);
            return { list: [], total: 0 };
        }
    }

    async createGlossaryEntry(entry) {
        try {
            const body = { ...entry };
            const res = await api.post('/admin-api/rag/ai/translate/glossary/create', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            });
            const root = (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {});
            return { success: root.code === 0, id: root.data };
        } catch (e) {
            console.warn('[AIService] createGlossaryEntry failed', e);
            return { success: false, message: e.message };
        }
    }

    async updateGlossaryEntry(entry) {
        try {
            const body = { ...entry };
            const res = await api.put('/admin-api/rag/ai/translate/glossary/update', body, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            });
            const root = (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {});
            return { success: root.code === 0 };
        } catch (e) {
            console.warn('[AIService] updateGlossaryEntry failed', e);
            return { success: false, message: e.message };
        }
    }

    async deleteGlossaryEntry(id) {
        try {
            const res = await api.delete('/admin-api/rag/ai/translate/glossary/delete', { params: { id }, timeout: 20000 });
            const root = (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {});
            return { success: root.code === 0 };
        } catch (e) {
            console.warn('[AIService] deleteGlossaryEntry failed', e);
            return { success: false, message: e.message };
        }
    }

    async getClassificationForms() {
        return loadForms();
    }

    async createClassificationForm(name) {
        const list = loadForms();
        const id = Date.now();
        list.push({ id, name, enabled: true });
        saveForms(list);
        return { id, name };
    }

    async updateClassificationForm(id, patch) {
        const list = loadForms();
        const idx = list.findIndex(i => i.id === id);
        if (idx > -1) {
            list[idx] = { ...list[idx], ...patch };
            saveForms(list);
            return list[idx];
        }
        throw new Error('Not found');
    }

    async deleteClassificationForm(id) {
        const list = loadForms().filter(i => i.id !== id);
        saveForms(list);
        return true;
    }

}


export const aiService = new AIService();
export const getRelatedDocuments = (options) => aiService.getRelatedDocuments(options);