import api from './api';

// Mock data for development
const MOCK_DATA = {
  filterOptions: {
    fileSpaces: [
      { value: 'workspace1', label: '工作空间1' },
      { value: 'workspace2', label: '工作空间2' },
      { value: 'workspace3', label: '个人空间' }
    ],
    creators: [
      { value: 'user1', label: '张三' },
      { value: 'user2', label: '李四' },
      { value: 'user3', label: '王五' }
    ],
    tags: [
      { value: 'tag1', label: '重要' },
      { value: 'tag2', label: '紧急' },
      { value: 'tag3', label: '项目' }
    ],
    formats: [
      { value: 'pdf', label: 'PDF' },
      { value: 'doc', label: 'Word文档' },
      { value: 'xls', label: 'Excel表格' },
      { value: 'ppt', label: 'PPT演示' },
      { value: 'txt', label: '文本文件' }
    ]
  },
  
  searchResults: [
    {
      id: 1,
      name: '项目需求文档.pdf',
      type: 'document',
      size: 2048000,
      modifiedTime: '2024-01-15T10:30:00Z',
      creator: '张三',
      path: '/projects/doc/requirements.pdf',
      preview: '这是一个项目需求文档，包含了详细的功能需求和技术规范...',
      tags: ['项目', '重要'],
      score: 0.95,
      hasSensitiveInfo: false
    },
    {
      id: 2,
      name: '设计图标准.png',
      type: 'image',
      size: 1536000,
      modifiedTime: '2024-01-14T15:20:00Z',
      creator: '李四',
      path: '/design/ui/icons.png',
      preview: '',
      tags: ['设计'],
      score: 0.87,
      hasSensitiveInfo: false
    },
    {
      id: 3,
      name: '会议录音.mp4',
      type: 'multimedia',
      size: 52428800,
      modifiedTime: '2024-01-13T09:00:00Z',
      creator: '王五',
      path: '/meetings/2024/jan/meeting.mp4',
      preview: '',
      tags: ['会议'],
      score: 0.72,
      hasSensitiveInfo: true
    },
    {
      id: 4,
      name: '数据备份.zip',
      type: 'archive',
      size: 104857600,
      modifiedTime: '2024-01-12T18:45:00Z',
      creator: '张三',
      path: '/backup/data_backup.zip',
      preview: '',
      tags: ['备份'],
      score: 0.68,
      hasSensitiveInfo: false
    },
    {
      id: 5,
      name: '配置文件.json',
      type: 'other',
      size: 4096,
      modifiedTime: '2024-01-11T14:30:00Z',
      creator: '李四',
      path: '/config/app.json',
      preview: '{ "app": { "name": "YLY Search", "version": "1.0.0" } }',
      tags: ['配置'],
      score: 0.55,
      hasSensitiveInfo: false
    }
  ]
};

class SearchService {
  async search(query, searchType, filters, page, pageSize) {
    // Mock API response for development
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const results = MOCK_DATA.searchResults.filter(item => {
        if (!query) return true;
        return item.name.toLowerCase().includes(query.toLowerCase()) ||
               (item.preview && item.preview.toLowerCase().includes(query.toLowerCase()));
      });
      
      const total = results.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedResults = results.slice(startIndex, startIndex + pageSize);
      
      const tabCounts = {
        all: results.length,
        document: results.filter(r => r.type === 'document').length,
        image: results.filter(r => r.type === 'image').length,
        multimedia: results.filter(r => r.type === 'multimedia').length,
        archive: results.filter(r => r.type === 'archive').length,
        other: results.filter(r => r.type === 'other').length
      };
      
      return {
        results: paginatedResults,
        pagination: {
          currentPage: page,
          pageSize,
          total
        },
        tabCounts
      };
    } catch (error) {
      console.warn('API not available, using mock data');
      return this.search(query, searchType, filters, page, pageSize);
    }
  }
  
  async getFilterOptions() {
    // Mock API response for development
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return MOCK_DATA.filterOptions;
    } catch (error) {
      console.warn('API not available, using mock data');
      return MOCK_DATA.filterOptions;
    }
  }
  
  async getFileCount(filters) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { count: MOCK_DATA.searchResults.length };
    } catch (error) {
      console.warn('API not available, using mock data');
      return { count: MOCK_DATA.searchResults.length };
    }
  }
  
  async downloadFiles(fileIds) {
    try {
      console.log('Downloading files:', fileIds);
      // Mock download implementation
      alert(`正在下载 ${fileIds.length} 个文件...`);
      return Promise.resolve();
    } catch (error) {
      console.warn('Download failed:', error);
      throw error;
    }
  }
  
  async exportResults(fileIds) {
    try {
      console.log('Exporting results:', fileIds);
      // Mock export implementation
      alert(`正在导出 ${fileIds.length} 个文件的搜索结果...`);
      return Promise.resolve();
    } catch (error) {
      console.warn('Export failed:', error);
      throw error;
    }
  }
}

export const searchService = new SearchService();