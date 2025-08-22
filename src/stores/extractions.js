import { defineStore } from 'pinia';
import { extractionsService } from '../services/extractionsService';

export const useExtractionsStore = defineStore('extractions', {
  state: () => ({
    extractions: [],
    currentExtraction: null,
    availableModels: [],
    selectedExtractions: [],
    loading: {
      list: false,
      create: false,
      update: false,
      delete: false,
      search: false,
      export: false,
      models: false
    },
    error: null,
    filters: {
      form_id: null,
      document_id: null,
      status: null,
      ai_model: null,
      start_date: null,
      end_date: null
    },
    searchKeyword: '',
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0
    }
  }),

  getters: {
    extractionById: (state) => (id) => {
      return state.extractions.find(extraction => extraction.id === parseInt(id));
    },

    extractionsByDocument: (state) => (documentId) => {
      return state.extractions.filter(extraction => extraction.document_id === documentId);
    },

    extractionsByForm: (state) => (formId) => {
      return state.extractions.filter(extraction => extraction.form_id === parseInt(formId));
    },

    statusCounts: (state) => {
      const counts = { completed: 0, pending: 0, error: 0 };
      state.extractions.forEach(extraction => {
        counts[extraction.status] = (counts[extraction.status] || 0) + 1;
      });
      return counts;
    },

    availableModelOptions: (state) => {
      return state.availableModels
        .filter(model => model.available)
        .map(model => ({
          label: `${model.name} (${model.provider})`,
          value: model.id
        }));
    }
  },

  actions: {
    async loadExtractions(filters = {}) {
      this.loading.list = true;
      this.error = null;
      
      try {
        const extractions = await extractionsService.getExtractions(filters);
        this.extractions = extractions;
        this.pagination.total = extractions.length;
        return extractions;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.list = false;
      }
    },

    async loadExtraction(id) {
      this.loading.list = true;
      this.error = null;
      
      try {
        const extraction = await extractionsService.getExtraction(id);
        this.currentExtraction = extraction;
        return extraction;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.list = false;
      }
    },

    async createExtraction(extractionData) {
      this.loading.create = true;
      this.error = null;
      
      try {
        const newExtraction = await extractionsService.createExtraction(extractionData);
        this.extractions.unshift(newExtraction);
        this.pagination.total++;
        return newExtraction;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.create = false;
      }
    },

    async updateExtraction(id, extractionData) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const updatedExtraction = await extractionsService.updateExtraction(id, extractionData);
        const index = this.extractions.findIndex(e => e.id === parseInt(id));
        if (index !== -1) {
          this.extractions[index] = updatedExtraction;
        }
        if (this.currentExtraction?.id === parseInt(id)) {
          this.currentExtraction = updatedExtraction;
        }
        return updatedExtraction;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.update = false;
      }
    },

    async deleteExtraction(id) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        await extractionsService.deleteExtraction(id);
        this.extractions = this.extractions.filter(e => e.id !== parseInt(id));
        this.pagination.total--;
        if (this.currentExtraction?.id === parseInt(id)) {
          this.currentExtraction = null;
        }
        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },

    async deleteSelectedExtractions() {
      if (this.selectedExtractions.length === 0) return;
      
      this.loading.delete = true;
      this.error = null;
      
      try {
        await extractionsService.deleteExtractions(this.selectedExtractions);
        this.extractions = this.extractions.filter(e => 
          !this.selectedExtractions.includes(e.id)
        );
        this.pagination.total -= this.selectedExtractions.length;
        this.selectedExtractions = [];
        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },

    async searchExtractions(keyword, filters = {}) {
      this.loading.search = true;
      this.error = null;
      this.searchKeyword = keyword;
      
      try {
        const results = await extractionsService.searchExtractions(keyword, filters);
        this.extractions = results;
        this.pagination.total = results.length;
        return results;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.search = false;
      }
    },

    async exportExtractions(ids, format = 'json') {
      this.loading.export = true;
      this.error = null;
      
      try {
        const result = await extractionsService.exportExtractions(ids, format);
        
        // Create download link
        const blob = new Blob([
          format === 'json' ? JSON.stringify(result.data, null, 2) : result.data
        ], {
          type: format === 'json' ? 'application/json' : 'text/csv'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return result;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.export = false;
      }
    },

    async loadAvailableModels() {
      this.loading.models = true;
      this.error = null;
      
      try {
        const models = await extractionsService.getAvailableModels();
        this.availableModels = models;
        return models;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.models = false;
      }
    },

    setFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters };
    },

    clearFilters() {
      this.filters = {
        form_id: null,
        document_id: null,
        status: null,
        ai_model: null,
        start_date: null,
        end_date: null
      };
    },

    setSelectedExtractions(ids) {
      this.selectedExtractions = ids;
    },

    toggleSelection(id) {
      const index = this.selectedExtractions.indexOf(id);
      if (index > -1) {
        this.selectedExtractions.splice(index, 1);
      } else {
        this.selectedExtractions.push(id);
      }
    },

    selectAll() {
      this.selectedExtractions = this.extractions.map(e => e.id);
    },

    clearSelection() {
      this.selectedExtractions = [];
    },

    setCurrentExtraction(extraction) {
      this.currentExtraction = extraction;
    },

    clearCurrentExtraction() {
      this.currentExtraction = null;
    },

    clearSearch() {
      this.searchKeyword = '';
    },

    clearError() {
      this.error = null;
    },

    // Pagination helpers
    setPagination(page, pageSize) {
      this.pagination.page = page;
      this.pagination.pageSize = pageSize;
    },

    // Generate form-based data structure from flat data
    generateFormStructuredData(flatData, formStructure) {
      const structured = {};
      
      if (!formStructure || !formStructure.fields) {
        return flatData;
      }
      
      formStructure.fields.forEach(field => {
        if (field.type === 'object' && field.fields) {
          structured[field.name] = {};
          field.fields.forEach(subField => {
            if (flatData[subField.name] !== undefined) {
              structured[field.name][subField.name] = flatData[subField.name];
            }
          });
        } else if (field.type === 'array' && field.fields) {
          // For arrays, we need special handling
          structured[field.name] = flatData[field.name] || [];
        } else {
          if (flatData[field.name] !== undefined) {
            structured[field.name] = flatData[field.name];
          }
        }
      });
      
      return structured;
    }
  }
});