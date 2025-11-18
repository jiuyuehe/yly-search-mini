import { defineStore } from 'pinia';
import { searchService } from '../services/search';
import { imageSearchService } from '../services/imageSearch';
import { tabToDocTypeParam } from '../constants/fileTypes';
import { ElMessage } from 'element-plus';

// Utility: robustly parse AI tag payloads into an array of keyword strings (max 10)
function parseAiKeywords(aiTag) {
  if (!aiTag && aiTag !== 0) return [];
  try {
    if (typeof aiTag === 'object' && aiTag) {
      const list = Array.isArray(aiTag.keywords) ? aiTag.keywords : [];
      return list.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
    }
    let txt = String(aiTag).trim();
    if (!txt) return [];
   
      const obj = JSON.parse(txt);
      if (obj && Array.isArray(obj.keywords)) {
        return obj.keywords.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
      }

  
      const unwrapped = JSON.parse(txt);
      if (unwrapped && typeof unwrapped === 'string') {
        const obj2 = JSON.parse(unwrapped);
        if (obj2 && Array.isArray(obj2.keywords)) {
          return obj2.keywords.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
        }
      } else if (unwrapped && typeof unwrapped === 'object' && Array.isArray(unwrapped.keywords)) {
        return unwrapped.keywords.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
      }

   
      const stripped = txt.replace(/^"|"$/g, '');
      const normalized = stripped.replace(/\\"/g, '"').replace(/\\n/g, '');
      const obj3 = JSON.parse(normalized);
      if (obj3 && Array.isArray(obj3.keywords)) {
        return obj3.keywords.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
      }
 
    const matches = [];
    const re = /"keyword"\s*:\s*"([^\\"]+)"/g;
    let m;
    while ((m = re.exec(txt)) && matches.length < 10) { matches.push(m[1]); }
    return matches;
  } catch {
    return [];
  }
}

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    searchType: 'fullText',
  // cache search results per type so switching away/back restores UI without extra network
  resultsCache: {},
    precision: 0.9, // 固定默认精准度（UI 已移除滑块）
  precisionMode: 3, // 1:全文 2:精准 3:混合 (默认改为 3，并由 SearchBox 同步)
    filters: {
      fileCategory: [],
      fileSpace: [],
      creators: [],
      tags: [],
      formats: [],
      timeRange: 'all',
      customTimeRange: null,
      fileSize: [],
      hasHistory: false, // 是否包含历史版本
      folder: false,     // 是否包含文件夹
      fileAiTag: '',
      fileSysTag: '',
      extname: ''
    },
  results: [], loading: false, error: null,
  // persistent map of stableKey -> full file object for selections across pages
  selectedMap: {},
    pagination: { currentPage: 1, pageSize: 10, total: 0 },
    tabCounts: { all: 0, document: 0, image: 0, multimedia: 0, archive: 0, other: 0 },
    filterOptions: { fileSpaces: [], creators: [], tags: [], formats: [] },
  // last search response time in milliseconds (from backend)
  searchTime: 0,
    activeTab: 'all',
  // Tag cloud
  tagCloud: [],
  tagSearchActive: false,
  tagSearchTags: [],
    _reqSeq: 0 // 并发请求序列号
  }),
  getters: {
    getFilteredResults: (state) => (tab) => { if (tab === 'all') return state.results; return state.results.filter(i => i.type === tab); },
  getSelectedObjects: (s) => Object.keys(s.selectedMap || {}).map(k => s.selectedMap[k]),
  getSelectedCount: (s) => Object.keys(s.selectedMap || {}).length,
    getTotalCount: (s) => s.pagination.total,
    getTabCounts: (s) => s.tabCounts,
    getFilterOptions: (s) => s.filterOptions,
    isImageSearch: (s) => s.searchType === 'image',
    // 供导出/弹窗快速按 id 访问
    itemsById: (s) => {
      const map = {};
      for (const r of s.results) { if (r && r.id != null) map[r.id] = r; }
      return map;
    }
  },
  actions: {
  // loadInitialData: fetch filter options and optionally run an initial (empty) search.
  // runSearch: boolean (default true) — when false, only fetches filter options.
  async loadInitialData(runSearch = true) {
    try {
      const fo = await searchService.getFilterOptions();
      this.filterOptions = fo; // preserve current searchType if set (e.g., returning from preview)
      const initialType = this.searchType || 'fullText';
      if (runSearch) {
        await this.search('', initialType);
      }
    } catch (e) { this.error = e.message; }
  },
  async fetchTagCloud(force=false){ if(!force && this.tagCloud && this.tagCloud.length) return this.tagCloud; const { tagCloudService } = await import('../services/tagCloud'); this.tagCloud = await tagCloudService.getKeywordsCloud(); return this.tagCloud; },
  async refreshTagCloud(){ const { tagCloudService } = await import('../services/tagCloud'); await tagCloudService.updateKeywordsCloud(); this.tagCloud = await tagCloudService.getKeywordsCloud(); },
  buildParams(query, searchType) {
      const f = this.filters; const page = this.pagination.currentPage; const pageSize = this.pagination.pageSize; const offset = (page - 1) * pageSize;
      // 时间
      let timeDis, startDate, endDate;
      if (f.timeRange && f.timeRange !== 'all') {
        if (f.timeRange === 'custom' && Array.isArray(f.customTimeRange) && f.customTimeRange.length === 2) { startDate = f.customTimeRange[0]; endDate = f.customTimeRange[1]; } else { timeDis = f.timeRange; }
      }
      // 文件大小区间
      let minSize, maxSize; let fileSizeStr = '';
      if (Array.isArray(f.fileSize) && f.fileSize.length === 1) {
        fileSizeStr = f.fileSize[0];
        const m = fileSizeStr.split('-');
        if (m.length === 2) {
          const toBytes = (v) => { if (v === '0' || v === '' || v == null) return 0; const num = parseFloat(v.replace(/([MG])$/i,'')); if (/M$/i.test(v)) return num * 1024 * 1024; if (/G$/i.test(v)) return num * 1024 * 1024 * 1024; return num; };
          const rawMin = m[0]; const rawMax = m[1];
            const minBytes = rawMin === '0' ? 0 : toBytes(rawMin);
            const maxBytes = rawMax === '0' ? undefined : toBytes(rawMax);
            if (minBytes) minSize = Math.round(minBytes);
            if (maxBytes) maxSize = Math.round(maxBytes);
        }
      }
      const extname = f.formats?.length ? f.formats.join(',') : '';
      let createrId; if (f.creators?.length === 1) createrId = f.creators[0]; else if (f.creators?.length > 1) createrId = f.creators.join(',');
      const fileSysTag = f.tags?.length ? f.tags.join(',') : '';
      const fileCategory = f.fileCategory?.length ? f.fileCategory.join(',') : '';
      const hasHistory = !!f.hasHistory;
      const folder = !!f.folder;
      let searchMode = 'keyword';
      switch (searchType) {
        case 'image': searchMode = 'image'; break;
        // case 'qa': searchMode = 'hybrid'; break;
        case 'precision': searchMode = 'precision'; break; // 仍保留后端精准模式，仅通过 checkbox 触发
        default: searchMode = 'keyword';
      }
    const aiTagLabel = f.fileAiTag || '';
    const base = { offset, limit: pageSize, createrId, timeDis, startDate, endDate, minSize, maxSize, hasHistory, folder, extname, tag: (aiTagLabel || fileSysTag), searchType: searchMode, searchMode };
  // 如果筛选中携带了 fileAiTag（标签名），同时传递给后端
  if (query && String(query).trim()) base.keyword = String(query).trim();
      if (fileCategory) base.fileCategory = fileCategory;
      if (fileSizeStr) base.fileSize = fileSizeStr;
      const docTypeParam = tabToDocTypeParam(this.activeTab); if (docTypeParam) base.docType = docTypeParam;
      // 精准搜索附加参数（固定精度）
      if (searchType === 'precision') {
        const ps = Number(this.precision) || 0.9;
        const bounded = Math.min(1, Math.max(0.6, ps));
        const gap = Math.min(4, Math.max(0, Math.round((1 - bounded) * 10)));
        base.precision = bounded;
        base.gap = gap;
      }
      return base;
    },
  async search(query, searchType = 'fullText', imageFile = null, options = null) {
      const seq = ++this._reqSeq; // 本次请求序
      // 不要直接修改传入的 searchType（这是 UI 的选择），使用局部变量作为请求时的类型
      let reqType = searchType;
      // 根据前端下拉: 1全文 2段落 3精准 — 仅用于构建请求，不写回 store.searchType
      if (options && typeof options.precisionMode !== 'undefined' && !['image','qa'].includes(searchType)) {
        const mode = Number(options.precisionMode);
        if (mode === 3) reqType = 'precision';
        else reqType = 'fullText'; // 1/2 都归为全文类型，后端可用附加字段区分
      }
      this.loading = true;
      this.query = query;
      // 保持 store.searchType 为 UI 的选择值，不因混合模式而变更
      // 如果本次请求的 searchType 与 store 中当前类型不一致，重置分页
      if (this.searchType !== searchType) {
        this.pagination.currentPage = 1;
      }
      this.searchType = searchType;
      this.tagSearchActive = false; // 离开标签搜索模式
      // 如果本次请求为图片搜索或提供了 imageFile，清理分页以避免使用旧页码
      if (reqType === 'image' || imageFile) {
        this.pagination.currentPage = 1;
      }
      // If switching to image search for the request, clear previous list results to avoid UI remnants
      if (reqType === 'image') {
        this.results = [];
        this.pagination.total = 0;
        this.searchTime = 0;
      }
      if (options && typeof options.precision === 'number') {
        this.precision = options.precision;
      }

      try {
  const params = this.buildParams(query, reqType);
        if (options && typeof options.precisionMode !== 'undefined') {
          // 使用后端约定的参数名 precisionMode（数值 1/2/3）
          params.precisionMode = Number(options.precisionMode);
        }
    let searchResp, aggCounts;
    let gotAgg = false;
        if (reqType === 'image') {
          searchResp = await imageSearchService.searchByVisual(params, imageFile);
          aggCounts = {};
        } else {
          if (params && !params.docType) {
            [searchResp, aggCounts] = await Promise.all([
              searchService.search(params, imageFile || null),
              searchService.getAggregationStats(params)
            ]);
            gotAgg = true;
          } else {
            // skip aggregation call when no docType filter is provided
            searchResp = await searchService.search(params, imageFile || null);
            aggCounts = {};
          }
        }
  if (seq !== this._reqSeq) return; // 只应用最新
        const { results, pagination, tabCounts } = searchResp;
        // robustly parse AI tags from fileAiTag and populate fileSysTag/tags
        function parseAiKeywords(aiTag) {
          if (!aiTag && aiTag !== 0) return [];
          try {
            // If already an object with keywords
            if (typeof aiTag === 'object' && aiTag) {
              const list = Array.isArray(aiTag.keywords) ? aiTag.keywords : [];
              return list.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
            }
            let txt = String(aiTag).trim();
            if (!txt) return [];
            // Try direct JSON parse
          
              const obj = JSON.parse(txt);
              if (obj && Array.isArray(obj.keywords)) {
                return obj.keywords.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
              }
           
            // Try double-JSON (quoted JSON string), e.g. "{\"keywords\":...}"
         
              const unwrapped = JSON.parse(txt);
              if (unwrapped && typeof unwrapped === 'string') {
                const obj2 = JSON.parse(unwrapped);
                if (obj2 && Array.isArray(obj2.keywords)) {
                  return obj2.keywords.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
                }
              } else if (unwrapped && typeof unwrapped === 'object' && Array.isArray(unwrapped.keywords)) {
                return unwrapped.keywords.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
              }
           
            // Try unescape common patterns and parse again
         
              const stripped = txt.replace(/^"|"$/g, '');
              const normalized = stripped.replace(/\\"/g, '"').replace(/\\n/g, '');
              const obj3 = JSON.parse(normalized);
              if (obj3 && Array.isArray(obj3.keywords)) {
                return obj3.keywords.map(k => (typeof k === 'string' ? k : (k && k.keyword))).filter(Boolean).slice(0, 10);
              }
          
            // Regex fallback: extract "keyword":"..." pairs
            const matches = [];
            const re = /"keyword"\s*:\s*"([^"]+)"/g;
            let m;
            while ((m = re.exec(txt)) && matches.length < 10) { matches.push(m[1]); }
            return matches;
          } catch {
            return [];
          }
        }

        if (Array.isArray(results)) {
          results.forEach(r => {
            // 兼容数据在 r._raw.fileAiTag 的情况
            const rawAi = r ? (r.fileAiTag != null ? r.fileAiTag : (r._raw && r._raw.fileAiTag)) : null;
            const kws = parseAiKeywords(rawAi);
            if (kws && kws.length) {
              r.fileSysTag = kws.join(',');
              // UI 只显示前 10 个关键词
              r.tags = kws.slice(0, 10);
            }
            // 如果前端对象缺少 fileAiTag 字段，则回填，便于后续导出/展示使用
            if (r && r.fileAiTag == null && rawAi != null) {
              r.fileAiTag = rawAi;
            }
          });
        }
  this.results = results;
  // expose latest results for other modules (e.g., download mapping)
  try { window.__SEARCH_RESULTS__ = Array.isArray(results) ? [...results] : []; } catch (e) { /* ignore */ }
        // cache results for this request type so switching away/back can restore
        try {
          this.resultsCache[reqType] = {
            results: Array.isArray(results) ? [...results] : [],
            pagination: { ...this.pagination },
            tabCounts: { ...this.tabCounts },
            searchTime: this.searchTime
          };
        } catch (e) { /* ignore */ }
        this.pagination.total = pagination.total;
        // After updating total, ensure currentPage is within valid range.
        // If options contains internal flag _skipPageFix, do not attempt correction to avoid loop.
        try {
          const sz = this.pagination.pageSize || 10;
          const tot = Number(this.pagination.total) || 0;
          const maxPage = Math.max(1, Math.ceil(tot / sz));
          if (!options || !options._skipPageFix) {
            if (this.pagination.currentPage > maxPage) {
              // set to maxPage and re-run search once (with skip flag)
              this.pagination.currentPage = maxPage;
              // re-run search but mark to skip further correction
              this.search(this.query, this.searchType, null, { ...options, _skipPageFix: true }).catch(()=>{});
            }
          }
        } catch (e) { /* ignore */ }
  // 如果后端返回 searchTime，则保存到 store，单位毫秒
  if (searchResp.searchTime != null) this.searchTime = Number(searchResp.searchTime) || 0;
        // only replace tabCounts when we actually fetched aggregation stats
        if (gotAgg) {
          const merged = { ...tabCounts, ...aggCounts };
          merged.all = tabCounts.all;
          this.tabCounts = merged;
        } else {
          // keep previous this.tabCounts, but update the overall 'all' count from response
          const kept = { ...this.tabCounts };
          kept.all = tabCounts.all;
          this.tabCounts = kept;
        }
        this.error = null;
      } catch (e) {
        if (seq === this._reqSeq) this.error = e.message || '搜索失败';
      } finally {
        if (seq === this._reqSeq) this.loading = false;
      }
    },
    async searchFilesByTags(tags){
      if(!Array.isArray(tags) || !tags.length) return;
      const { tagCloudService } = await import('../services/tagCloud');
      this.loading=true; this.tagSearchActive=true; this.tagSearchTags=[...tags]; this.query='';
      try {
        const page=this.pagination.currentPage; const pageSize=this.pagination.pageSize;
        const resp = await tagCloudService.filesByTags({ tags, page, pageSize });
        const { normalizeFile } = await import('../constants/fileModel');
        const { mapDocTypeCodeToTab, mapExtToTab } = await import('../constants/fileTypes');
        let norm = resp.list.map(r=>{ const f=normalizeFile(r); const tab = f.docType!=null? mapDocTypeCodeToTab(Number(f.docType)) : mapExtToTab(f.fileType); return { ...f, type: tab }; });
          // ensure AI tags are parsed and mapped to fileSysTag/tags as in regular search
          if (Array.isArray(norm)) {
            norm.forEach(r => {
              const rawAi = r ? (r.fileAiTag != null ? r.fileAiTag : (r._raw && r._raw.fileAiTag)) : null;
              const kws = parseAiKeywords(rawAi);
              if (kws && kws.length) {
                r.fileSysTag = kws.join(',');
                r.tags = kws.slice(0, 10);
              }
              if (r && r.fileAiTag == null && rawAi != null) r.fileAiTag = rawAi;
            });
          }
          this.results=norm; this.pagination.total=resp.total;
        const counter={ document:0,image:0,multimedia:0,archive:0,other:0 };
        norm.forEach(r=>{ if(counter[r.type]!=null) counter[r.type]++; else counter.other++; });
        this.tabCounts = { all: resp.total, ...counter };
        this.error=null;
      } catch(e){ this.error=e.message||'标签搜索失败'; }
      finally { this.loading=false; }
    },
  setActiveTab(tab) { this.activeTab = tab; this.pagination.currentPage = 1; if(this.tagSearchActive){ this.searchFilesByTags(this.tagSearchTags); } else { this.search(this.query, this.searchType, null, { precisionMode: this.precisionMode }); } },
    // setSearchType: switch mode and clear previous results to avoid stale UI
    setSearchType(type) {
      const newType = type || 'fullText';
      const oldType = this.searchType;
      // persist current results into cache keyed by previous type
      try {
        this.resultsCache[oldType] = {
          results: Array.isArray(this.results) ? [...this.results] : [],
          pagination: { ...this.pagination },
          tabCounts: { ...this.tabCounts },
          searchTime: this.searchTime,
          tagSearchActive: this.tagSearchActive
        };
      } catch (e) { /* ignore */ }

      this.searchType = newType;

      // If we have cached results for the new type, restore them to avoid empty UI
      const cached = this.resultsCache[newType];
      if (cached && Array.isArray(cached.results) && cached.results.length) {
        this.results = [...cached.results];
        // restore pagination fields carefully
        this.pagination = { ...this.pagination, ...cached.pagination };
        this.tabCounts = { ...this.tabCounts, ...cached.tabCounts };
        this.searchTime = cached.searchTime || 0;
        this.tagSearchActive = !!cached.tagSearchActive;
      } else {
        // no cache — clear and reset pagination
        this.results = [];
        this.pagination.currentPage = 1;
        this.pagination.total = 0;
        this.searchTime = 0;
        this.tagSearchActive = false;
      }
    },
  updateFilters(filters) { const cloned = { ...filters }; ['fileCategory','fileSpace','creators','tags','formats','fileSize'].forEach(k => { if (Array.isArray(cloned[k])) cloned[k] = [...cloned[k]]; }); this.filters = { ...this.filters, ...cloned }; this.pagination.currentPage = 1;  this.search(this.query, this.searchType, null, { precisionMode: this.precisionMode }); },
  updateCurrentPage(p) { this.pagination.currentPage = p; this.search(this.query, this.searchType, null, { precisionMode: this.precisionMode }); },
  updatePageSize(s) { this.pagination.pageSize = s; this.pagination.currentPage = 1; this.search(this.query, this.searchType, null, { precisionMode: this.precisionMode }); },
    async downloadFiles(ids) { try { await searchService.downloadFiles(ids); } catch (e) { this.error = e.message; } },
    async exportResults(ids) {
      try {
        // ids may be object rows (preferred), stable keys (e.g., 'nas::nasId::path'), or plain ids
        let rows = [];
        if (Array.isArray(ids) && ids.length) {
          // if array of objects, accept directly
          if (typeof ids[0] === 'object') {
            rows = ids.filter(Boolean);
          } else {
            rows = ids.map(k => {
              if (typeof k === 'string' && k.includes('::')) {
                const parts = k.split('::');
                const last = parts[parts.length - 1];
                const found = this.results.find(r => {
                  try { return String(r.id) === String(last) || String(r.fileId) === String(last); } catch { return false; }
                });
                if (found) return found;
                return this.itemsById[last];
              }
              return this.results.find(r => r.id === k) || this.itemsById[k];
            }).filter(Boolean);
          }
        } else {
          rows = this.results;
        }
        if (!rows.length) { ElMessage.warning('没有可导出的数据'); return; }
        // 构建 CSV
        const headers = ['文件名称','文件大小','文件路径','创建人','上传时间','更新人','更新时间','空间','中文摘要','译文摘要','AI标签','系统标签','文件实体','文本翻译','属性','文件内容'];
        const escapeCsv = (str) => { if (str == null) return '""'; const s = String(str).replace(/"/g,'""'); return '"' + s + '"'; };
        const formatSize = (sz) => { if (!sz && sz!==0) return ''; const units=['B','KB','MB','GB','TB']; let v=Number(sz); let i=0; while(v>=1024 && i<units.length-1){ v/=1024; i++; } return (v.toFixed(i?2:0)) + units[i]; };
        let csv = headers.map(h=>escapeCsv(h)).join(',') + '\n';
        rows.forEach(r => {
          // 兼容导出时 AI 标签位于 r._raw.fileAiTag
          const aiTagVal = r && r.fileAiTag != null ? r.fileAiTag : (r && r._raw ? r._raw.fileAiTag : undefined);
          const aiTagStr = aiTagVal == null ? '' : (typeof aiTagVal === 'string' ? aiTagVal : JSON.stringify(aiTagVal));
          csv += [
            escapeCsv(r.fileName||r.name||''),
            escapeCsv(formatSize(r.fileSize)),
            escapeCsv(r.filePath||''),
            escapeCsv(r.createrName||''),
            escapeCsv(r.createTime||''),
            escapeCsv(r.updateUserName||''),
            escapeCsv(r.updateTime||''),
            escapeCsv(r.fileCategory||''),
            escapeCsv(r.fileSummary||''),
            escapeCsv(r.fileSummaryTranslate||''),
            escapeCsv(aiTagStr),
            escapeCsv(r.fileSysTag||''),
            escapeCsv(r.fileEntities||''),
            escapeCsv(r.fileTranslate||''),
            escapeCsv(r.userCustomAttributes||''),
            escapeCsv(r.fileContents||'')
          ].join(',') + '\n';
        });
        const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '文件导出_' + new Date().toLocaleDateString() + '.csv';
        document.body.appendChild(link);
        link.click();
        setTimeout(()=>{ URL.revokeObjectURL(link.href); document.body.removeChild(link); }, 120);
        ElMessage.success('导出完成');
      } catch (e) {
        console.warn('前端导出失败', e);
        this.error = e.message || '导出失败';
        ElMessage.error(this.error);
      }
    },
  resetFilters() { this.filters = { fileCategory: [], fileSpace: [], creators: [], tags: [], formats: [], timeRange: 'all', customTimeRange: null, fileSize: [], hasHistory: false, folder: false, fileAiTag: '', fileSysTag: '', extname: '' }; this.pagination.currentPage = 1; this.search(this.query, this.searchType, null, { precisionMode: this.precisionMode }); }
  ,
  // selection persistence
  addSelected(key, obj) {
   this.selectedMap = { ...this.selectedMap, [key]: { ...obj } }; 
  },
  removeSelected(key) {
  const m = { ...this.selectedMap }; delete m[key]; this.selectedMap = m; 
  },
  clearSelected() {
    this.selectedMap = {};
  }
  }
});