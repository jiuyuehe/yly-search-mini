// Mock data for data extraction statistics
export const mockStats = {
  summary: {
    totalExtractions: 1245,
    successRate: 92.5,
    avgProcessingTime: 2.3,
    todayExtractions: 87
  },
  timeSeriesData: [
    { date: '2025-01-01', count: 45, success: 42, failed: 3 },
    { date: '2025-01-02', count: 52, success: 48, failed: 4 },
    { date: '2025-01-03', count: 38, success: 35, failed: 3 },
    { date: '2025-01-04', count: 61, success: 57, failed: 4 },
    { date: '2025-01-05', count: 55, success: 51, failed: 4 },
    { date: '2025-01-06', count: 48, success: 44, failed: 4 },
    { date: '2025-01-07', count: 67, success: 62, failed: 5 }
  ],
  formTypeDistribution: [
    { name: '发票', value: 345 },
    { name: '合同', value: 287 },
    { name: '身份证', value: 156 },
    { name: '简历', value: 234 },
    { name: '其他', value: 223 }
  ],
  statusDistribution: [
    { name: '成功', value: 1152 },
    { name: '失败', value: 56 },
    { name: '处理中', value: 37 }
  ],
  recentExtractions: [
    {
      id: 1,
      formName: '销售发票',
      fileName: 'invoice_20250105.pdf',
      status: 'success',
      createdAt: '2025-01-05 14:32:15',
      processingTime: 2.1,
      fields: 5
    },
    {
      id: 2,
      formName: '采购合同',
      fileName: 'contract_A123.pdf',
      status: 'success',
      createdAt: '2025-01-05 14:28:42',
      processingTime: 3.5,
      fields: 12
    },
    {
      id: 3,
      formName: '员工简历',
      fileName: 'resume_zhangsan.doc',
      status: 'failed',
      createdAt: '2025-01-05 14:15:33',
      processingTime: 1.8,
      fields: 0
    },
    {
      id: 4,
      formName: '身份证',
      fileName: 'id_card_001.jpg',
      status: 'success',
      createdAt: '2025-01-05 13:45:22',
      processingTime: 1.2,
      fields: 8
    },
    {
      id: 5,
      formName: '销售发票',
      fileName: 'invoice_20250104.pdf',
      status: 'success',
      createdAt: '2025-01-05 13:22:11',
      processingTime: 2.4,
      fields: 5
    },
    {
      id: 6,
      formName: '采购合同',
      fileName: 'contract_B456.pdf',
      status: 'processing',
      createdAt: '2025-01-05 13:10:05',
      processingTime: 0,
      fields: 0
    },
    {
      id: 7,
      formName: '员工简历',
      fileName: 'resume_lisi.doc',
      status: 'success',
      createdAt: '2025-01-05 12:55:30',
      processingTime: 2.8,
      fields: 10
    },
    {
      id: 8,
      formName: '销售发票',
      fileName: 'invoice_20250103.pdf',
      status: 'success',
      createdAt: '2025-01-05 12:30:18',
      processingTime: 1.9,
      fields: 5
    }
  ]
};

// API-like functions for future backend integration
export const statsService = {
  async getStats() {
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: mockStats
        });
      }, 500);
    });
  },

  async getTimeSeries(startDate, endDate) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: mockStats.timeSeriesData
        });
      }, 300);
    });
  },

  async getRecentExtractions(page = 1, pageSize = 10) {
    return new Promise(resolve => {
      setTimeout(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        resolve({
          code: 200,
          data: {
            list: mockStats.recentExtractions.slice(start, end),
            total: mockStats.recentExtractions.length
          }
        });
      }, 300);
    });
  }
};
