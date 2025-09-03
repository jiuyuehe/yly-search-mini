import { appsApi } from './api';

// Mock data for file preview
const MOCK_FILE_DATA = {
  1: {
    id: 1,
    name: '项目需求文档.pdf',
    fileType: 'pdf',
    size: 2048000,
    creator: '张三',
    createdTime: '2024-01-15T10:30:00Z',
    modifiedTime: '2024-01-15T10:30:00Z',
    path: '/projects/doc/requirements.pdf',
    hasAccess: true,
    content: 'PDF文件内容预览区域...',
    extractedText: '这是一个项目需求文档的示例文本内容。包含了详细的功能需求说明、技术规范、用户界面设计要求等内容。\n\n主要功能模块包括：\n1. 用户管理系统\n2. 文件搜索与预览\n3. AI辅助分析工具\n4. 多语言翻译支持\n\n技术要求：\n- 前端：Vue 3 + Element Plus\n- 后端：Spring Boot\n- 数据库：MySQL\n- 缓存：Redis'
  },
  2: {
    id: 2,
    name: '设计图标准.png',
    fileType: 'image',
    size: 1536000,
    creator: '李四',
    createdTime: '2024-01-14T15:20:00Z',
    modifiedTime: '2024-01-14T15:20:00Z',
    path: '/design/ui/icons.png',
    hasAccess: true,
    content: '图片预览区域...',
    extractedText: '这是一个设计图标准的图片文件。包含UI设计规范和图标库相关信息。'
  },
  3: {
    id: 3,
    name: '会议录音.mp4',
    fileType: 'video',
    size: 52428800,
    creator: '王五',
    createdTime: '2024-01-13T09:00:00Z',
    modifiedTime: '2024-01-13T09:00:00Z',
    path: '/meetings/2024/jan/meeting.mp4',
    hasAccess: false,
    content: '无权限访问',
    extractedText: '无权限访问此文件内容。'
  },
  4: {
    id: 4,
    name: '数据备份.zip',
    fileType: 'archive',
    size: 104857600,
    creator: '张三',
    createdTime: '2024-01-12T18:45:00Z',
    modifiedTime: '2024-01-12T18:45:00Z',
    path: '/backup/data_backup.zip',
    hasAccess: true,
    content: '压缩文件预览...',
    extractedText: '压缩包包含了系统数据备份文件，包括数据库导出文件、配置文件等重要数据。'
  },
  5: {
    id: 5,
    name: '配置文件.json',
    fileType: 'json',
    size: 4096,
    creator: '李四',
    createdTime: '2024-01-11T14:30:00Z',
    modifiedTime: '2024-01-11T14:30:00Z',
    path: '/config/app.json',
    hasAccess: true,
    content: '{ "app": { "name": "YLY Search", "version": "1.0.0", "modules": ["search", "preview", "ai"] } }',
    extractedText: '这是应用程序的配置文件，包含了系统的基本设置和模块配置信息。'
  }
};

class FileService {
  async getFilePreview(fileId) {
    try {
      // Mock API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const fileData = MOCK_FILE_DATA[fileId];
      if (!fileData) {
        throw new Error('文件不存在');
      }
      
      return fileData;
    } catch (e) {
      console.warn('API not available, using mock data', e);
      const fileData = MOCK_FILE_DATA[fileId];
      if (!fileData) {
        throw new Error('文件不存在');
      }
      return fileData;
    }
  }
  
  async downloadFile(fileId) {
    try {
      console.log('Downloading file:', fileId);
      const fileData = MOCK_FILE_DATA[fileId];
      if (fileData) {
        alert(`正在下载文件：${fileData.name}`);
      } else {
        alert(`正在下载文件 ID: ${fileId}`);
      }
      return Promise.resolve();
    } catch (e) {
      console.warn('Download failed:', e);
      throw e;
    }
  }
  
  async requestAccess(fileId, requestType, reason) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Access requested for file:', fileId, 'Type:', requestType, 'Reason:', reason);
      alert(`已提交访问申请，文件ID: ${fileId}`);
      return { success: true, message: '访问申请已提交' };
    } catch (e) {
      console.warn('Access request failed:', e);
      throw e;
    }
  }

  // 批量压缩下载任务提交
  async fileZipDownTask(files) {
    // files: [{ fileCategory:'nas', nasCode, nasFilePath } | { fileCategory:'public', fileId }]
    return appsApi.post('/files/zip-down/task', { files });
  }

  // 查询压缩任务进度 / 获取下载地址
  async getZipDownTaskUrl(taskId) {
    return appsApi.get('/files/zip-down/task', { params: { task_id: taskId } });
  }
}

export const fileService = new FileService();