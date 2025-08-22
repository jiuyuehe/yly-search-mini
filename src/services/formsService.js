import api from './api';

// Mock forms data
const MOCK_FORMS = [
  {
    id: 1,
    name: '合同抽取表单',
    structure: {
      formName: '合同抽取表单',
      fields: [
        {
          name: '甲方',
          type: 'object',
          fields: [
            { name: 'companyName', type: 'text', example: 'Example Corp', required: true },
            { name: '负责人', type: 'text', example: '张三', required: true },
            { name: '联系方式', type: 'text', example: '13800138000', required: false }
          ]
        },
        {
          name: '购买产品',
          type: 'array',
          itemType: 'object',
          fields: [
            { name: '产品名称', type: 'text', example: '产品1', required: true },
            { name: '数量', type: 'number', example: 10, required: true },
            { name: '价格', type: 'number', example: 100.0, required: true }
          ]
        },
        {
          name: '合同详情',
          type: 'object',
          fields: [
            { name: '总价', type: 'number', example: 1000.0, required: true },
            { name: '服务器周期', type: 'text', example: '1年', required: false },
            { name: '交付周期', type: 'text', example: '30天', required: false }
          ]
        }
      ]
    },
    created_at: '2024-01-15 10:00:00',
    updated_at: '2024-01-15 10:00:00'
  },
  {
    id: 2,
    name: '发票抽取表单',
    structure: {
      formName: '发票抽取表单',
      fields: [
        { name: '发票号码', type: 'text', example: 'INV-2024-001', required: true },
        { name: '开票日期', type: 'date', example: '2024-01-15', required: true },
        { name: '销售方', type: 'text', example: 'ABC公司', required: true },
        { name: '购买方', type: 'text', example: 'XYZ公司', required: true },
        { name: '金额', type: 'number', example: 50000.0, required: true },
        { name: '税率', type: 'number', example: 0.13, required: false },
        { name: '备注', type: 'text', example: '备注信息', required: false }
      ]
    },
    created_at: '2024-01-16 14:30:00',
    updated_at: '2024-01-16 14:30:00'
  },
  {
    id: 3,
    name: '报价单表单',
    structure: {
      formName: '报价单表单',
      fields: [
        { name: '报价单号', type: 'text', example: 'QT-2024-001', required: true },
        { name: '报价日期', type: 'date', example: '2024-01-15', required: true },
        { name: '客户名称', type: 'text', example: '客户公司', required: true },
        {
          name: '报价项目',
          type: 'array',
          itemType: 'object',
          fields: [
            { name: '项目名称', type: 'text', example: '项目A', required: true },
            { name: '单价', type: 'number', example: 500.0, required: true },
            { name: '数量', type: 'number', example: 10, required: true },
            { name: '小计', type: 'number', example: 5000.0, required: true }
          ]
        },
        { name: '总金额', type: 'number', example: 50000.0, required: true },
        { name: '有效期', type: 'text', example: '30天', required: false }
      ]
    },
    created_at: '2024-01-17 09:15:00',
    updated_at: '2024-01-17 09:15:00'
  }
];

class FormsService {
  async getForms() {
    try {
      // Uncomment when backend API is ready
      // const response = await api.get('/admin-api/forms');
      // return response.data;
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_FORMS;
    } catch (error) {
      console.warn('Forms API not available, using mock data');
      return MOCK_FORMS;
    }
  }

  async getForm(id) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.get(`/admin-api/forms/${id}`);
      // return response.data;
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 200));
      const form = MOCK_FORMS.find(f => f.id === parseInt(id));
      if (!form) {
        throw new Error('表单不存在');
      }
      return form;
    } catch (error) {
      console.warn('Form API not available, using mock data');
      throw error;
    }
  }

  async createForm(formData) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.post('/admin-api/forms', formData);
      // return response.data;
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 500));
      const newForm = {
        id: Math.max(...MOCK_FORMS.map(f => f.id)) + 1,
        ...formData,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      MOCK_FORMS.push(newForm);
      return newForm;
    } catch (error) {
      console.warn('Create form API not available, using mock data');
      throw error;
    }
  }

  async updateForm(id, formData) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.put(`/admin-api/forms/${id}`, formData);
      // return response.data;
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = MOCK_FORMS.findIndex(f => f.id === parseInt(id));
      if (index === -1) {
        throw new Error('表单不存在');
      }
      
      MOCK_FORMS[index] = {
        ...MOCK_FORMS[index],
        ...formData,
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      return MOCK_FORMS[index];
    } catch (error) {
      console.warn('Update form API not available, using mock data');
      throw error;
    }
  }

  async deleteForm(id) {
    try {
      // Uncomment when backend API is ready
      // await api.delete(`/admin-api/forms/${id}`);
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = MOCK_FORMS.findIndex(f => f.id === parseInt(id));
      if (index === -1) {
        throw new Error('表单不存在');
      }
      
      MOCK_FORMS.splice(index, 1);
      return { success: true };
    } catch (error) {
      console.warn('Delete form API not available, using mock data');
      throw error;
    }
  }

  async searchForms(keyword) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.get(`/admin-api/forms/search?q=${encodeURIComponent(keyword)}`);
      // return response.data;
      
      // Mock search for now
      await new Promise(resolve => setTimeout(resolve, 200));
      if (!keyword) {
        return MOCK_FORMS;
      }
      
      return MOCK_FORMS.filter(form => 
        form.name.toLowerCase().includes(keyword.toLowerCase()) ||
        form.structure.formName.toLowerCase().includes(keyword.toLowerCase())
      );
    } catch (error) {
      console.warn('Search forms API not available, using mock data');
      return MOCK_FORMS;
    }
  }
}

export const formsService = new FormsService();