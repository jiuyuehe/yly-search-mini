import { defineStore } from 'pinia';
import { searchService } from '../services/search';
import { tabToDocTypeParam } from '../constants/fileTypes';

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    searchType: 'fullText',
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
    activeTab: 'all'
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
      switch (searchType) { case 'semantic': searchMode = 'vector'; break; case 'image': searchMode = 'image'; break; case 'qa': searchMode = 'hybrid'; break; }
      const base = { keyword: query, offset, limit: pageSize, createrId, timeDis, startDate, endDate, minSize, maxSize, hasHistory, folder, extname, fileSysTag, searchType: searchMode, searchMode };
      if (fileCategory) base.fileCategory = fileCategory;
      if (fileSizeStr) base.fileSize = fileSizeStr;
      const docTypeParam = tabToDocTypeParam(this.activeTab); if (docTypeParam) base.docType = docTypeParam;
      return base;
    },
    async search(query, searchType = 'fullText', imageFile = null) { this.loading = true; this.query = query; this.searchType = searchType; try { const params = this.buildParams(query, searchType); const [searchResp, aggCounts] = await Promise.all([ searchService.search(params, imageFile||null), searchService.getAggregationStats(params) ]); const { results, pagination, tabCounts } = searchResp; this.results = results; this.pagination.total = pagination.total; const merged = { ...tabCounts, ...aggCounts }; merged.all = tabCounts.all; this.tabCounts = merged; this.error = null; } catch (e) { this.error = e.message || '搜索失败'; } finally { this.loading = false; } },
    setActiveTab(tab) { this.activeTab = tab; this.pagination.currentPage = 1; this.search(this.query, this.searchType); },
    updateFilters(filters) { const cloned = { ...filters }; ['fileCategory','fileSpace','creators','tags','formats','fileSize'].forEach(k => { if (Array.isArray(cloned[k])) cloned[k] = [...cloned[k]]; }); this.filters = { ...this.filters, ...cloned }; this.pagination.currentPage = 1; console.log('[Store] merged filters =>', this.filters); this.search(this.query, this.searchType); },
    updateCurrentPage(p) { this.pagination.currentPage = p; this.search(this.query, this.searchType); },
    updatePageSize(s) { this.pagination.pageSize = s; this.pagination.currentPage = 1; this.search(this.query, this.searchType); },
    async downloadFiles(ids) { try { await searchService.downloadFiles(ids); } catch (e) { this.error = e.message; } },
    async exportResults(ids) { try { await searchService.exportResults(ids); } catch (e) { this.error = e.message; } },
    resetFilters() { this.filters = { fileCategory: [], fileSpace: [], creators: [], tags: [], formats: [], timeRange: 'all', customTimeRange: null, fileSize: [], hasHistory: false, folder: false, fileAiTag: '', fileSysTag: '', extname: '' }; this.pagination.currentPage = 1; this.search(this.query, this.searchType); }
  }
});