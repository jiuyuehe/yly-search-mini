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
  
        
        // Update local state
        const index = this.forms.findIndex(f => f.id === parseInt(id));
        if (index !== -1) {
          this.forms[index].enabled = enabled;
          this.filteredForms = [...this.forms];
        }
        return true;
     
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

    // Validate form structure (enhanced for nested object fields)
    validateFormStructure(structure) {
      const errors = [];

      if (!structure || typeof structure !== 'object') {
        errors.push('表单结构无效');
        return errors;
      }

      if (!structure.formName || structure.formName.trim() === '') {
        errors.push('表单名称不能为空');
      }

      if (!structure.fields || !Array.isArray(structure.fields) || structure.fields.length === 0) {
        errors.push('表单必须包含至少一个字段');
        return errors;
      }

      // 顶层字段名称重复检查
      const topNames = structure.fields.map(f => f?.name).filter(Boolean);
      const topDup = topNames.filter((n, i) => topNames.indexOf(n) !== i);
      if (topDup.length > 0) {
        errors.push(`存在重复的字段名称: ${[...new Set(topDup)].join(', ')}`);
      }

      structure.fields.forEach((field, index) => {
        // 基础校验
        if (!field || typeof field !== 'object') {
          errors.push(`字段 ${index + 1} 无效`);
          return;
        }
        if (!field.name || field.name.trim() === '') {
          errors.push(`字段 ${index + 1} 的名称不能为空`);
        }
        if (!field.type) {
          errors.push(`字段 "${field.name || index + 1}" 的类型不能为空`);
        }

        // 对象字段嵌套校验
        if (field.type === 'object') {
          if (!Array.isArray(field.fields)) {
            // 自动修复：初始化为空数组，避免运行时报错
            field.fields = [];
          }

          // 子字段重复命名检查
          const subNames = field.fields.map(sf => sf?.name).filter(Boolean);
          const subDup = subNames.filter((n, i) => subNames.indexOf(n) !== i);
          if (subDup.length > 0) {
            errors.push(`对象字段 "${field.name}" 存在重复的子字段名称: ${[...new Set(subDup)].join(', ')}`);
          }

          field.fields.forEach((subField, subIndex) => {
            if (!subField || typeof subField !== 'object') {
              errors.push(`对象字段 "${field.name}" 的子字段 ${subIndex + 1} 无效`);
              return;
            }
            if (!subField.name || subField.name.trim() === '') {
              errors.push(`对象字段 "${field.name}" 的子字段 ${subIndex + 1}: 名称不能为空`);
            }
            if (!subField.type) {
              errors.push(`对象字段 "${field.name}" 的子字段 "${subField.name || subIndex + 1}": 类型不能为空`);
            }
            // 关键限制：对象的子字段不能为 object/array
            if (['object', 'array'].includes(subField.type)) {
              errors.push(`对象字段 "${field.name}" 的子字段 "${subField.name}": 不支持 ${subField.type} 类型（仅支持 text/number/date/boolean）`);
            }
          });

          // 可选：对象字段至少包含一个子字段（保持与历史逻辑一致，若为空提示）
          if (field.fields.length === 0) {
            errors.push(`字段 "${field.name}" 必须包含子字段`);
          }
        }

        // 数组字段简单校验（如 itemType 为 object，则其子字段同样不能继续嵌套 object/array）
        if (field.type === 'array') {
          if (!Array.isArray(field.fields)) {
            field.fields = [];
          }
          // 兼容历史：要求数组对象定义子字段
          if (field.itemType === 'object' && field.fields.length === 0) {
            errors.push(`数组字段 "${field.name}" 的元素为对象时必须定义子字段`);
          }
          field.fields.forEach((subField) => {
            if (['object', 'array'].includes(subField?.type)) {
              errors.push(`数组字段 "${field.name}" 的元素子字段 "${subField?.name}": 不支持 ${subField?.type} 类型`);
            }
          });
        }
      });

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
    ,
    // Sample A：纯平铺简单字段
    generateSampleFormA() {
      return {
        formName: '样例A-平铺字段',
        fields: [
          { name: '姓名', type: 'text', example: '张三', required: true },
          { name: '手机号', type: 'text', example: '13800138000', required: false },
          { name: '年龄', type: 'number', example: 28, required: false },
          { name: '是否在职', type: 'boolean', example: true, required: false },
          { name: '入职日期', type: 'date', example: '2024-06-01', required: false }
        ]
      };
    }
    ,
    // Sample B：一个对象带子字段
    generateSampleFormB() {
      return {
        formName: '样例B-对象与子字段',
        fields: [
          {
            name: '合同信息',
            type: 'object',
            fields: [
              { name: '甲方名称', type: 'text', example: '某科技有限公司', required: true },
              { name: '合同金额', type: 'number', example: 100000, required: true },
              { name: '签订日期', type: 'date', example: '2024-01-15', required: false }
            ]
          },
          { name: '备注', type: 'text', example: '无', required: false }
        ]
      };
    }
    ,
    // Sample C：对象 + 数组元素为对象
    generateSampleFormC() {
      return {
        formName: '样例C-对象与对象数组',
        fields: [
          {
            name: '发票信息',
            type: 'object',
            fields: [
              { name: '发票抬头', type: 'text', example: '某贸易公司', required: true },
              { name: '纳税人识别号', type: 'text', example: '9132XXXXXXXXXXXX', required: false }
            ]
          },
          {
            name: '明细',
            type: 'array',
            itemType: 'object',
            fields: [
              { name: '品名', type: 'text', example: '商品A', required: true },
              { name: '数量', type: 'number', example: 2, required: true },
              { name: '单价', type: 'number', example: 49.9, required: false }
            ]
          }
        ]
      };
    }
  }
});