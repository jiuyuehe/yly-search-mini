import { appsApi } from './api';



class FileService {
  async getFilePreview(fileId) {
    
  }
  
  async downloadFile(fileId) {
    
  }
  
  async requestAccess(fileId, requestType, reason) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
  // debug log removed
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