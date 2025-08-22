import api from './api';

// Mock extractions data
const MOCK_EXTRACTIONS = [
  {
    id: 1,
    document_id: '1',
    form_id: 1,
    ai_model: 'GPT-4',
    extracted_data: {
      甲方: {
        companyName: 'ABC科技有限公司',
        负责人: '张三',
        联系方式: '13800138000'
      },
      购买产品: [
        {
          产品名称: '云服务器',
          数量: 5,
          价格: 2000.0
        },
        {
          产品名称: '数据库服务',
          数量: 2,
          价格: 1500.0
        }
      ],
      合同详情: {
        总价: 13000.0,
        服务器周期: '2年',
        交付周期: '15天'
      }
    },
    status: 'completed',
    created_at: '2024-01-15 15:30:00',
    updated_at: '2024-01-15 15:30:00'
  },
  {
    id: 2,
    document_id: '2',
    form_id: 2,
    ai_model: 'GPT-4',
    extracted_data: {
      发票号码: 'INV-2024-0015',
      开票日期: '2024-01-10',
      销售方: 'XYZ软件公司',
      购买方: 'ABC科技有限公司',
      金额: 85000.0,
      税率: 0.13,
      备注: '软件许可费用'
    },
    status: 'completed',
    created_at: '2024-01-16 16:45:00',
    updated_at: '2024-01-16 16:45:00'
  },
  {
    id: 3,
    document_id: '3',
    form_id: 3,
    ai_model: 'Claude-3',
    extracted_data: {
      报价单号: 'QT-2024-0023',
      报价日期: '2024-01-12',
      客户名称: '深圳创新科技',
      报价项目: [
        {
          项目名称: '网站开发',
          单价: 50000.0,
          数量: 1,
          小计: 50000.0
        },
        {
          项目名称: '移动应用开发',
          单价: 80000.0,
          数量: 1,
          小计: 80000.0
        }
      ],
      总金额: 130000.0,
      有效期: '45天'
    },
    status: 'completed',
    created_at: '2024-01-17 11:20:00',
    updated_at: '2024-01-17 11:20:00'
  }
];

class ExtractionsService {
  async getExtractions(filters = {}) {
    try {
      // Uncomment when backend API is ready
      // const params = new URLSearchParams(filters);
      // const response = await api.get(`/admin-api/extractions?${params}`);
      // return response.data;
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 300));
      let results = [...MOCK_EXTRACTIONS];
      
      // Apply filters
      if (filters.form_id) {
        results = results.filter(e => e.form_id === parseInt(filters.form_id));
      }
      if (filters.document_id) {
        results = results.filter(e => e.document_id === filters.document_id);
      }
      if (filters.status) {
        results = results.filter(e => e.status === filters.status);
      }
      if (filters.ai_model) {
        results = results.filter(e => e.ai_model === filters.ai_model);
      }
      if (filters.start_date) {
        results = results.filter(e => e.created_at >= filters.start_date);
      }
      if (filters.end_date) {
        results = results.filter(e => e.created_at <= filters.end_date);
      }
      
      return results;
    } catch (error) {
      console.warn('Extractions API not available, using mock data');
      return MOCK_EXTRACTIONS;
    }
  }

  async getExtraction(id) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.get(`/admin-api/extractions/${id}`);
      // return response.data;
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 200));
      const extraction = MOCK_EXTRACTIONS.find(e => e.id === parseInt(id));
      if (!extraction) {
        throw new Error('抽取记录不存在');
      }
      return extraction;
    } catch (error) {
      console.warn('Extraction API not available, using mock data');
      throw error;
    }
  }

  async createExtraction(extractionData) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.post('/admin-api/extractions', extractionData);
      // return response.data;
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 800));
      const newExtraction = {
        id: Math.max(...MOCK_EXTRACTIONS.map(e => e.id)) + 1,
        ...extractionData,
        status: 'completed',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      MOCK_EXTRACTIONS.push(newExtraction);
      return newExtraction;
    } catch (error) {
      console.warn('Create extraction API not available, using mock data');
      throw error;
    }
  }

  async updateExtraction(id, extractionData) {
    try {
      // Uncomment when backend API is ready
      // const response = await api.put(`/admin-api/extractions/${id}`, extractionData);
      // return response.data;
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = MOCK_EXTRACTIONS.findIndex(e => e.id === parseInt(id));
      if (index === -1) {
        throw new Error('抽取记录不存在');
      }
      
      MOCK_EXTRACTIONS[index] = {
        ...MOCK_EXTRACTIONS[index],
        ...extractionData,
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      return MOCK_EXTRACTIONS[index];
    } catch (error) {
      console.warn('Update extraction API not available, using mock data');
      throw error;
    }
  }

  async deleteExtraction(id) {
    try {
      // Uncomment when backend API is ready
      // await api.delete(`/admin-api/extractions/${id}`);
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = MOCK_EXTRACTIONS.findIndex(e => e.id === parseInt(id));
      if (index === -1) {
        throw new Error('抽取记录不存在');
      }
      
      MOCK_EXTRACTIONS.splice(index, 1);
      return { success: true };
    } catch (error) {
      console.warn('Delete extraction API not available, using mock data');
      throw error;
    }
  }

  async deleteExtractions(ids) {
    try {
      // Uncomment when backend API is ready
      // await api.delete('/admin-api/extractions', { data: { ids } });
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 500));
      ids.forEach(id => {
        const index = MOCK_EXTRACTIONS.findIndex(e => e.id === parseInt(id));
        if (index !== -1) {
          MOCK_EXTRACTIONS.splice(index, 1);
        }
      });
      return { success: true, deleted: ids.length };
    } catch (error) {
      console.warn('Batch delete extractions API not available, using mock data');
      throw error;
    }
  }

  async searchExtractions(keyword, filters = {}) {
    try {
      // Uncomment when backend API is ready
      // const params = new URLSearchParams({ ...filters, q: keyword });
      // const response = await api.get(`/admin-api/extractions/search?${params}`);
      // return response.data;
      
      // Mock search for now
      await new Promise(resolve => setTimeout(resolve, 200));
      let results = await this.getExtractions(filters);
      
      if (!keyword) {
        return results;
      }
      
      return results.filter(extraction => {
        const dataStr = JSON.stringify(extraction.extracted_data).toLowerCase();
        return dataStr.includes(keyword.toLowerCase());
      });
    } catch (error) {
      console.warn('Search extractions API not available, using mock data');
      return MOCK_EXTRACTIONS;
    }
  }

  async exportExtractions(ids, format = 'json') {
    try {
      // Uncomment when backend API is ready
      // const response = await api.post('/admin-api/extractions/export', { ids, format });
      // return response.data;
      
      // Mock export for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      const extractions = MOCK_EXTRACTIONS.filter(e => ids.includes(e.id));
      
      if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(extractions);
        return { format: 'csv', data: csvData, filename: `extractions_${Date.now()}.csv` };
      } else {
        // Return JSON format
        return { format: 'json', data: extractions, filename: `extractions_${Date.now()}.json` };
      }
    } catch (error) {
      console.warn('Export extractions API not available, using mock data');
      throw error;
    }
  }

  convertToCSV(extractions) {
    if (extractions.length === 0) return '';
    
    const headers = ['ID', 'Document ID', 'Form ID', 'AI Model', 'Status', 'Created At', 'Extracted Data'];
    const rows = extractions.map(e => [
      e.id,
      e.document_id,
      e.form_id,
      e.ai_model,
      e.status,
      e.created_at,
      JSON.stringify(e.extracted_data)
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  // Get available AI models for extraction
  async getAvailableModels() {
    try {
      // Uncomment when backend API is ready
      // const response = await api.get('/admin-api/ai-models');
      // return response.data;
      
      // Mock models for now
      return [
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', available: true },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', available: true },
        { id: 'claude-3', name: 'Claude-3', provider: 'Anthropic', available: true },
        { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', available: false }
      ];
    } catch (error) {
      console.warn('AI models API not available, using mock data');
      return [
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', available: true },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', available: true }
      ];
    }
  }
}

export const extractionsService = new ExtractionsService();