import { defineStore } from 'pinia';
import { searchService } from '../services/search';
import { imageSearchService } from '../services/imageSearch';
import { tabToDocTypeParam } from '../constants/fileTypes';
import { ElMessage } from 'element-plus';

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    searchType: 'fullText',
    precision: 0.9, // 固定默认精准度（UI 已移除滑块）
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
        case 'precision': searchMode = 'precision'; break; // 仍保留后端精准模式，仅通过 checkbox 触发
        default: searchMode = 'keyword';
      }
      const base = { keyword: query, offset, limit: pageSize, createrId, timeDis, startDate, endDate, minSize, maxSize, hasHistory, folder, extname, fileSysTag, searchType: searchMode, searchMode };
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
      const seq = ++this._reqSeq; // 本次请求序列
      // 根据前端下拉: 1全文 2段落 3精准
      if (options && typeof options.precisionMode !== 'undefined' && !['image','qa'].includes(searchType)) {
        const mode = Number(options.precisionMode);
        if (mode === 3) searchType = 'precision';
        else searchType = 'fullText'; // 1/2 都归为全文类型，后端可用附加字段区分
      }
      this.loading = true;
      this.query = query;
      this.searchType = searchType; // 记录主类型
      try {
        const params = this.buildParams(query, searchType);
        if (options && typeof options.precisionMode !== 'undefined') {
          // 使用后端约定的参数名 precisionMode（数值 1/2/3）
          params.precisionMode = Number(options.precisionMode);
        }
        let searchResp, aggCounts;
        if (searchType === 'image') {
          searchResp = await imageSearchService.searchByVisual(params, imageFile);
          aggCounts = {};
        } else {
          [searchResp, aggCounts] = await Promise.all([
            searchService.search(params, imageFile || null),
            searchService.getAggregationStats(params)
          ]);
        }
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
    async exportResults(ids) {
      try {
        const rows = Array.isArray(ids) && ids.length ? ids.map(id => this.results.find(r => r.id === id)).filter(Boolean) : this.results;
        if (!rows.length) { ElMessage.warning('没有可导出的数据'); return; }
        // 构建 CSV
        const headers = ['文件名称','文件大小','文件路径','创建人','上传时间','更新人','更新时间','空间','中文摘要','译文摘要','AI标签','系统标签','文件实体','文本翻译','属性','文件内容'];
        const escapeCsv = (str) => { if (str == null) return '""'; const s = String(str).replace(/"/g,'""'); return '"' + s + '"'; };
        const formatSize = (sz) => { if (!sz && sz!==0) return ''; const units=['B','KB','MB','GB','TB']; let v=Number(sz); let i=0; while(v>=1024 && i<units.length-1){ v/=1024; i++; } return (v.toFixed(i?2:0)) + units[i]; };
        let csv = headers.map(h=>escapeCsv(h)).join(',') + '\n';
        rows.forEach(r => {
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
            escapeCsv(r.fileAiTag||''),
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
    resetFilters() { this.filters = { fileCategory: [], fileSpace: [], creators: [], tags: [], formats: [], timeRange: 'all', customTimeRange: null, fileSize: [], hasHistory: false, folder: false, fileAiTag: '', fileSysTag: '', extname: '' }; this.pagination.currentPage = 1; this.search(this.query, this.searchType); }
  }
});