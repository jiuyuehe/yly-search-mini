import { defineStore } from 'pinia';
import { searchService } from '../services/search';
import { tabToDocTypeParam } from '../constants/fileTypes';

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    searchType: 'fullText',
    precisionScore: 0.9, // 新增：精准搜索精度 0.6 ~ 1
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
    pagination: { currentPage: 1, pageSize: 10, total: 0 },
    tabCounts: { all: 0, document: 0, image: 0, multimedia: 0, archive: 0, other: 0 },
    filterOptions: { fileSpaces: [], creators: [], tags: [], formats: [] },
    activeTab: 'all',
    _reqSeq: 0 // 并发请求序列号
  }),
  getters: {
    getFilteredResults: (state) => (tab) => { if (tab === 'all') return state.results; return state.results.filter(i => i.type === tab); },
    getTotalCount: (s) => s.pagination.total,
    getTabCounts: (s) => s.tabCounts,
    getFilterOptions: (s) => s.filterOptions
  },
  actions: {
    async loadInitialData() { try { const fo = await searchService.getFilterOptions(); this.filterOptions = fo; await this.search('', 'fullText'); } catch (e) { this.error = e.message; } },
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
        case 'qa': searchMode = 'hybrid'; break;
        case 'precision': searchMode = 'precision'; break;
        default: searchMode = 'keyword';
      }
      const base = { keyword: query, offset, limit: pageSize, createrId, timeDis, startDate, endDate, minSize, maxSize, hasHistory, folder, extname, fileSysTag, searchType: searchMode, searchMode };
      if (fileCategory) base.fileCategory = fileCategory;
      if (fileSizeStr) base.fileSize = fileSizeStr;
      const docTypeParam = tabToDocTypeParam(this.activeTab); if (docTypeParam) base.docType = docTypeParam;
      // 精准搜索附加参数
      if (searchType === 'precision') {
        const ps = Number(this.precisionScore) || 0.9;
        const bounded = Math.min(1, Math.max(0.6, ps));
        const gap = Math.min(4, Math.max(0, Math.round((1 - bounded) * 10))); // 0~4
        base.precisionScore = bounded;
        base.gap = gap; // 提供给后端字间距（冗余）
      }
      return base;
    },
    async search(query, searchType = 'fullText', imageFile = null, options = null) {
      const seq = ++this._reqSeq; // 本次请求序列
      this.loading = true;
      this.query = query;
      this.searchType = searchType;
      if (options && typeof options.precisionScore === 'number') {
        this.precisionScore = options.precisionScore;
      }
      try {
        const params = this.buildParams(query, searchType);
        const [searchResp, aggCounts] = await Promise.all([
          searchService.search(params, imageFile || null),
          searchService.getAggregationStats(params)
        ]);
        if (seq !== this._reqSeq) return; // 只应用最新
        const { results, pagination, tabCounts } = searchResp;
        this.results = results;
        this.pagination.total = pagination.total;
        const merged = { ...tabCounts, ...aggCounts };
        merged.all = tabCounts.all;
        this.tabCounts = merged;
        this.error = null;
      } catch (e) {
        if (seq === this._reqSeq) this.error = e.message || '搜索失败';
      } finally {
        if (seq === this._reqSeq) this.loading = false;
      }
    },
    setActiveTab(tab) { this.activeTab = tab; this.pagination.currentPage = 1; this.search(this.query, this.searchType); },
    updateFilters(filters) { const cloned = { ...filters }; ['fileCategory','fileSpace','creators','tags','formats','fileSize'].forEach(k => { if (Array.isArray(cloned[k])) cloned[k] = [...cloned[k]]; }); this.filters = { ...this.filters, ...cloned }; this.pagination.currentPage = 1; console.log('[Store] merged filters =>', this.filters); this.search(this.query, this.searchType); },
    updateCurrentPage(p) { this.pagination.currentPage = p; this.search(this.query, this.searchType); },
    updatePageSize(s) { this.pagination.pageSize = s; this.pagination.currentPage = 1; this.search(this.query, this.searchType); },
    async downloadFiles(ids) { try { await searchService.downloadFiles(ids); } catch (e) { this.error = e.message; } },
    async exportResults(ids) { try { await searchService.exportResults(ids); } catch (e) { this.error = e.message; } },
    resetFilters() { this.filters = { fileCategory: [], fileSpace: [], creators: [], tags: [], formats: [], timeRange: 'all', customTimeRange: null, fileSize: [], hasHistory: false, folder: false, fileAiTag: '', fileSysTag: '', extname: '' }; this.pagination.currentPage = 1; this.search(this.query, this.searchType); }
  }
});