import { defineStore } from 'pinia';
import { formsService } from '../services/formsService';

export const useFormsStore = defineStore('forms', {
  state: () => ({
    forms: [],
    currentForm: null,
    loading: {
      list: false,
      create: false,
      update: false,
      delete: false,
      search: false
    },
    error: null,
    searchKeyword: '',
    filteredForms: []
  }),

  getters: {
    formById: (state) => (id) => {
      return state.forms.find(form => form.id === parseInt(id));
    },
    
    formOptions: (state) => {
      return state.forms.map(form => ({
        label: form.name,
        value: form.id,
        structure: form.structure
      }));
    }
  },

  actions: {
    async loadForms() {
      this.loading.list = true;
      this.error = null;
      
      try {
        const forms = await formsService.getForms();
        // Initialize enabled and dataCount if not present
        this.forms = forms.map(form => ({
          ...form,
          enabled: form.enabled !== undefined ? form.enabled : true,
          dataCount: form.dataCount || 0
        }));
        this.filteredForms = this.forms;
        return this.forms;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.list = false;
      }
    },

    async loadForm(id) {
      this.loading.list = true;
      this.error = null;
      
      try {
        const form = await formsService.getForm(id);
        this.currentForm = form;
        return form;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.list = false;
      }
    },

    async createForm(formData) {
      this.loading.create = true;
      this.error = null;
      
      try {
        const newForm = await formsService.createForm(formData);
        this.forms.push(newForm);
        this.filteredForms = [...this.forms];
        return newForm;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.create = false;
      }
    },

    async updateForm(id, formData) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const updatedForm = await formsService.updateForm(id, formData);
        const index = this.forms.findIndex(f => f.id === parseInt(id));
        if (index !== -1) {
          this.forms[index] = updatedForm;
          this.filteredForms = [...this.forms];
        }
        if (this.currentForm?.id === parseInt(id)) {
          this.currentForm = updatedForm;
        }
        return updatedForm;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.update = false;
      }
    },

    async deleteForm(id) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        await formsService.deleteForm(id);
        this.forms = this.forms.filter(f => f.id !== parseInt(id));
        this.filteredForms = [...this.forms];
        if (this.currentForm?.id === parseInt(id)) {
          this.currentForm = null;
        }
        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },

    async updateFormStatus(id, enabled) {
      try {
        // In a real implementation, this would call an API
        // await formsService.updateFormStatus(id, enabled);
        
        // Update local state
        const index = this.forms.findIndex(f => f.id === parseInt(id));
        if (index !== -1) {
          this.forms[index].enabled = enabled;
          this.filteredForms = [...this.forms];
        }
        return true;
      } catch (error) {
        throw error;
      }
    },

    async searchForms(keyword) {
      this.loading.search = true;
      this.error = null;
      this.searchKeyword = keyword;
      
      try {
        const results = await formsService.searchForms(keyword);
        this.filteredForms = results;
        return results;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.search = false;
      }
    },

    clearSearch() {
      this.searchKeyword = '';
      this.filteredForms = [...this.forms];
    },

    setCurrentForm(form) {
      this.currentForm = form;
    },

    clearCurrentForm() {
      this.currentForm = null;
    },

    clearError() {
      this.error = null;
    },

    // Validate form structure
    validateFormStructure(structure) {
      const errors = [];
      
      if (!structure.formName || structure.formName.trim() === '') {
        errors.push('表单名称不能为空');
      }
      
      if (!structure.fields || !Array.isArray(structure.fields) || structure.fields.length === 0) {
        errors.push('表单必须包含至少一个字段');
      } else {
        structure.fields.forEach((field, index) => {
          if (!field.name || field.name.trim() === '') {
            errors.push(`字段 ${index + 1} 的名称不能为空`);
          }
          
          if (!field.type) {
            errors.push(`字段 "${field.name}" 的类型不能为空`);
          }
          
          // Validate nested fields for object and array types
          if (field.type === 'object' || field.type === 'array') {
            if (!field.fields || !Array.isArray(field.fields) || field.fields.length === 0) {
              errors.push(`字段 "${field.name}" 必须包含子字段`);
            }
          }
        });
      }
      
      return errors;
    },

    // Generate a sample form structure
    generateSampleForm() {
      return {
        formName: '示例表单',
        fields: [
          {
            name: '基本信息',
            type: 'object',
            fields: [
              { name: '姓名', type: 'text', example: '张三', required: true },
              { name: '年龄', type: 'number', example: 30, required: false },
              { name: '邮箱', type: 'text', example: 'example@email.com', required: true }
            ]
          },
          {
            name: '联系方式',
            type: 'text',
            example: '13800138000',
            required: false
          }
        ]
      };
    }
  }
});