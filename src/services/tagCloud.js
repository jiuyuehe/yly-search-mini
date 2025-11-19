import api from './api';

class TagCloudService {
  async getKeywordsCloud() {
    try {
      const res = await api.get('/admin-api/rag/tag-cloud/getKeywordsCloud');
      let data = [];
      if (res && typeof res === 'object' && 'code' in res) { data = res.data || []; }
      else if (Array.isArray(res)) data = res; else if (typeof res === 'string') {
        const str = res.trim();
        try { const parsed = JSON.parse(str); if (Array.isArray(parsed)) data = parsed; } catch { /* ignore */ }
        if (!data.length) { data = str.split(/\n+/).map(l => l.trim()).filter(Boolean); }
      }
      const list = [];
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (!item) return;
          if (typeof item === 'string') {
            const m = item.match(/^(.*?)[\s:，,]+(\d+(?:\.\d+)?)/);
            if (m) list.push({ tag: m[1].trim(), weight: Number(m[2]) }); else list.push({ tag: item.trim(), weight: 1 });
          } else if (typeof item === 'object') {
            const tag = item.tag || item.keyword || item.word || item.name || item.key || '';
            if (!tag) return;
            let weight = item.weight || item.count || item.score || item.value || 1; weight = Number(weight) || 1;
            list.push({ tag, weight });
          }
        });
      }
      const map = new Map();
      list.forEach(t => { if (!map.has(t.tag) || map.get(t.tag).weight < t.weight) map.set(t.tag, t); });
      return Array.from(map.values()).sort((a, b) => b.weight - a.weight);
    } catch (e) { console.warn('[TagCloudService] getKeywordsCloud failed', e); return []; }
  }
  async updateKeywordsCloud() { try { await api.get('/admin-api/rag/tag-cloud/updateKeywordsCloud'); } catch (e) { console.warn('[TagCloudService] updateKeywordsCloud failed', e); } }
  async filesByTags({ tags = [], page = 1, pageSize = 10, matchMode = '', weightMode = '', minimumShouldMatch } = {}) {
    try {
      const body = { tags, page: page < 1 ? 1 : page, pageSize, matchMode, weightMode };
      if (minimumShouldMatch != null) body.minimumShouldMatch = minimumShouldMatch;
      const res = await api.post('/admin-api/rag/tag-cloud/files/by-tags', body, { headers: { 'Content-Type': 'application/json' } });
      if (res?.code !== 0) return { list: [], total: 0 };
      const data = res.data || {}; const list = Array.isArray(data.list) ? data.list : [];
      return { list, total: data.total || list.length };
    } catch (e) { console.warn('[TagCloudService] filesByTags failed', e); return { list: [], total: 0 }; }
  }
}

export const tagCloudService = new TagCloudService();
