import api from './api';
import { mapDocTypeCodeToTab, mapExtToTab } from '../constants/fileTypes';
import { normalizeFile } from '../constants/fileModel';

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

function transformResponse(data) {
  const list = data?.fileList || [];
  // 标准化
  const normalized = list.map(raw => {
    const norm = normalizeFile(raw);
    // 预览摘要补充（若标准化后没有）
    if (!norm.preview) {
      norm.preview = raw.fileSummary || raw.fileSummaryTranslate || raw.fileContents || raw.fileTranslate || '';
    }
    return norm;
  });
  // 计算前端分类 type（沿用旧字段名，便于 UI 继续工作）
  const results = normalized.map(f => {
    const tab = f.docType != null ? mapDocTypeCodeToTab(Number(f.docType)) : mapExtToTab(f.fileType);
    return { ...f, type: tab };
  });
  // 统计 tabCounts（若后端未给 types）
  let tabCounts;
  if (data?.types && typeof data.types === 'object') {
    const types = data.types;
    tabCounts = {
      all: data.total || results.length,
      document: types.document || 0,
      image: types.image || 0,
      multimedia: types.multimedia || 0,
      archive: types.archive || 0,
      other: types.other || 0
    };
  } else {
    const counter = { document:0, image:0, multimedia:0, archive:0, other:0 };
    results.forEach(r => { if (counter[r.type] != null) counter[r.type]++; else counter.other++; });
    tabCounts = { all: data?.total || results.length, ...counter };
  }
  return { results, pagination: { total: data?.total || results.length }, tabCounts };
}

class SearchService {
  async search(builtParams, imageFile = null) {
    const url = '/admin-api/documents/search';
    const { offset, limit, ...rest } = builtParams;
    try {
      let root;
      if (imageFile) {
        const form = new FormData();
        Object.entries(rest).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') form.append(k, v); });
        form.append('offset', offset);
        form.append('limit', limit);
        form.append('image', imageFile); // 若后端字段不同请调整
        root = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const formData = new URLSearchParams();
        Object.entries({ ...rest, offset, limit }).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') formData.append(k, v);
        });
        root = await api.post(url, formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      }
      // axios 拦截器已返回 data，root 即 { code, data, msg }
      if (root?.code !== 0) throw new Error(root?.msg || '搜索失败');
      const apiData = root?.data;
      if (!apiData || !Array.isArray(apiData.fileList)) throw new Error('无数据');
      const mapped = transformResponse(apiData);
      return { ...mapped, searchTime: apiData.searchTime };
    } catch (error) {
      console.warn('搜索接口失败，使用 mock 数据', error);
      // mock 数据也需要标准化以保持结构统一
      const mappedMock = MOCK_DATA.searchResults.map(r => normalizeFile({ fileId: r.id, fileName: r.name, fileType: r.name.split('.').pop(), fileSize: r.size, updateTime: r.modifiedTime, createrName: r.creator, filePath: r.path, highlight: r.preview }));
      const results = mappedMock.map(f => ({ ...f, type: mapExtToTab(f.fileType) }));
      const tabCounts = { all: results.length, document:0, image:0, multimedia:0, archive:0, other:0 };
      results.forEach(r => { if (tabCounts[r.type] != null) tabCounts[r.type]++; else tabCounts.other++; });
      return { results, pagination: { total: results.length }, tabCounts, searchTime: 0 };
    }
  }
  
  async getFilterOptions() {
    // 可调用后端专用接口，这里直接 mock
    return MOCK_DATA.filterOptions;
  }

  // 获取创建者列表（用户列表），后端接口: /admin-api/rag/documents/users
  async getCreators(force = false) {
    if (!force && this._cachedCreators && Array.isArray(this._cachedCreators)) return this._cachedCreators;
    try {
      const root = await api.get('/admin-api/documents/users');
      if (root?.code !== 0) throw new Error(root?.msg || '获取用户失败');
      const raw = Array.isArray(root.data) ? root.data : [];
      const mapped = raw.map(u => ({ value: String(u.userId), label: u.userName || ('用户' + u.userId) }));
      this._cachedCreators = mapped;
      return mapped;
    } catch (e) {
      console.warn('获取创建者列表失败，使用已有或空列表', e);
      this._cachedCreators = this._cachedCreators || [];
      return this._cachedCreators;
    }
  }
  
  async getFileCount(_filters) {
    // 保留 mock
    return { count: MOCK_DATA.searchResults.length };
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
      alert(`正在导出 ${fileIds.length} 个文件结果...`);
      return Promise.resolve();
    } catch (error) {
      console.warn('Export failed:', error);
      throw error;
    }
  }

  // 新增：获取聚合统计（与搜索参数一致）
  async getAggregationStats(builtParams) {
    const url = '/admin-api/documents/aggregations/stats';
    try {
      const formData = new URLSearchParams();
      Object.entries(builtParams).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') formData.append(k, v); });
      const root = await api.post(url, formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (root?.code !== 0) throw new Error(root?.msg || '聚合统计失败');
      const dataObj = root?.data || {};
      // 新结构: data.docType 是数组 [{ key: '2', count: 6 }, ...]
      const docTypeArr = Array.isArray(dataObj.docType) ? dataObj.docType : [];
      const counts = { document:0, image:0, multimedia:0, archive:0, other:0 };
      docTypeArr.forEach(item => {
        const code = Number(item.key);
        const tab = mapDocTypeCodeToTab(code);
        if (counts[tab] != null) counts[tab] += item.count || 0; else counts.other += item.count || 0;
      });
      // fileCategory 目前不直接影响 tabs，如需可返回
      return counts;
    } catch (e) {
      console.warn('获取聚合统计失败，忽略并使用搜索结果内统计', e);
      return {};
    }
  }
}

export const searchService = new SearchService();