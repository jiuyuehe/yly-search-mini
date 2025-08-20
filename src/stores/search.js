import { defineStore } from 'pinia';
import { searchService } from '../services/search';

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    searchType: 'fullText',
    filters: {
      fileSpace: [],
      creators: [],
      tags: [],
      formats: [],
      timeRange: null,
      sizeRange: null,
      versions: false
    },
    results: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      pageSize: 10,
      total: 0
    },
    tabCounts: {
      all: 0,
      document: 0,
      image: 0,
      multimedia: 0,
      archive: 0,
      other: 0
    },
    filterOptions: {
      fileSpaces: [],
      creators: [],
      tags: [],
      formats: []
    }
  }),
  
  getters: {
    getFilteredResults: (state) => (tab) => {
      if (tab === 'all') return state.results;
      return state.results.filter(item => item.type === tab);
    },
    
    getTotalCount: (state) => state.pagination.total,
    
    getTabCounts: (state) => state.tabCounts,
    
    getFilterOptions: (state) => state.filterOptions
  },
  
  actions: {
    async loadInitialData() {
      try {
        const filterOptions = await searchService.getFilterOptions();
        this.filterOptions = filterOptions;
        
        // Load initial search results to display some data
        await this.search('', 'fullText');
      } catch (error) {
        this.error = error.message;
      }
    },
    
    async search(query, searchType = 'fullText') {
      this.loading = true;
      this.query = query;
      this.searchType = searchType;
      
      try {
        const { results, pagination, tabCounts } = await searchService.search(
          query, 
          searchType,
          this.filters,
          this.pagination.currentPage,
          this.pagination.pageSize
        );
        
        this.results = results;
        this.pagination = pagination;
        this.tabCounts = tabCounts;
        this.error = null;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    updateFilters(filters) {
      this.filters = { ...this.filters, ...filters };
      this.search(this.query, this.searchType);
    },
    
    updateCurrentPage(page) {
      this.pagination.currentPage = page;
      this.search(this.query, this.searchType);
    },
    
    updatePageSize(size) {
      this.pagination.pageSize = size;
      this.pagination.currentPage = 1;
      this.search(this.query, this.searchType);
    },
    
    async downloadFiles(ids) {
      try {
        await searchService.downloadFiles(ids);
      } catch (error) {
        this.error = error.message;
      }
    },
    
    async exportResults(ids) {
      try {
        await searchService.exportResults(ids);
      } catch (error) {
        this.error = error.message;
      }
    },
    
    resetFilters() {
      this.filters = {
        fileSpace: [],
        creators: [],
        tags: [],
        formats: [],
        timeRange: null,
        sizeRange: null,
        versions: false
      };
      this.search(this.query, this.searchType);
    }
  }
});