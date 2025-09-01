import api, { appsApi } from './api';

// 预览相关服务，封装接口调用，避免在 UI 组件里直接写地址

class PreviewService {
  /** 获取文档基础信息 (支持 nas: nsi + nsubp) */
  async getBasicInfo(params) {
    if (!params || !params.fc) throw new Error('缺少参数 fc');
    const body = { fc: params.fc };
    if (params.fi) body.fi = params.fi;
    if (params.fsi) body.fsi = params.fsi;
    if (params.nsi) body.nsi = params.nsi;
    if (params.nsubp) body.nsubp = params.nsubp;
    const root = await api.post('/admin-api/rag/documents/basicinfo', body, { headers: { 'Content-Type': 'application/json' } });
    if (root?.code !== 0 || !root?.data) throw new Error(root?.msg || '获取基础信息失败');
    const data = root.data || {};
    // 统一生成 esId (若后端未返回) - 规则:
    // NAS: nasId + '-' + nasFileId
    // 非 NAS: fileId + fileCategory.toLowerCase() + fsFileId
    if (!data.esId && !data.esid) {
      try {
        const isNas = (data.fileCategory || params.fc) === 'nas' || data.nasId || params.nsi;
        if (isNas) {
          const nasId = data.nasId || params.nsi;
            // nasFileId 后端可能命名 nasFileId 或 nasFileID；若缺失尝试从 params.nfi
          const nasFileId = data.nasFileId || data.nasfileId || params.nfi || null;
          if (nasId && nasFileId) {
            data.esId = `${nasId}-${nasFileId}`;
          }
        } else {
          const fileId = data.fileId || params.fi;
          const fileCategory = (data.fileCategory || params.fc || '').toLowerCase();
          const fsFileId = data.fsFileId || params.fsi;
          if (fileId && fileCategory && fsFileId) {
            data.esId = `${fileId}${fileCategory}${fsFileId}`;
          }
        }
      } catch { /* silent */ }
    }
    return data;
  }

  /** 获取文件预览视图 (非 NAS)
   * 普通文件: /apps/file/view  params: { fi, fc }
   */
  async getFileView(opts) {
    if (!opts || !opts.fc) throw new Error('缺少参数 fc');
    const { fc, responseType } = opts;
    const fi = opts.fi;
    if (!fi) throw new Error('缺少参数 fi');
    return await appsApi.get('/file/view', { params: { fi, fc }, responseType });
  }

  /** 创建 NAS 在线预览任务 */
  async createNasPreviewTask({ nasId, nasFilePath, serverCode = 'yliyunviewer', mode = 'view' }) {
    if (!nasId) throw new Error('缺少 nasId');
    if (!nasFilePath) throw new Error('缺少 nasFilePath');
    const body = { mode, serverCode, nasId: String(nasId), nasFilePath, fileCategory: 'nas' };
    const res = await appsApi.post('/pub/file-online/url/task', body, { headers: { 'Content-Type': 'application/json;charset=UTF-8' } });
    if (res?.status !== 'ok') throw new Error(res?.msg || 'NAS 预览任务创建失败');
    return res.data; // { taskId, token }
  }

  /** 查询 NAS 在线预览任务状态 */
  async fetchNasPreviewTask({ taskId, token }) {
    if (!taskId || !token) throw new Error('缺少 taskId/token');
    const res = await appsApi.get('/pub/file-online/url/task', { params: { task_id: taskId, token } });
    if (res?.status !== 'ok') throw new Error(res?.msg || 'NAS 预览任务查询失败');
    return res.data; // 包含 status, result 等
  }

  /** 等待 NAS 预览链接 (轮询) */
  async waitNasPreviewLink({ nasId, nasFilePath, pollInterval = 1000, maxWaitMs = 15000, shouldStop }) {
    const start = Date.now();
    const { taskId, token } = await this.createNasPreviewTask({ nasId, nasFilePath });
    while (true) {
      if (typeof shouldStop === 'function' && shouldStop()) {
        throw new Error('NAS 预览已取消');
      }
      if (Date.now() - start > maxWaitMs) {
        throw new Error('NAS 预览生成超时');
      }
      const data = await this.fetchNasPreviewTask({ taskId, token });
      if (data.status === 'ok' && data.result?.link) {
        return { link: data.result.link, fileName: data.result.fileName || '' };
      }
      if (data.status === 'fail' || data.errorMsg) {
        throw new Error(data.errorMsg || 'NAS 预览生成失败');
      }
      // deal / processing -> 等待
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
}

export const previewService = new PreviewService();
export default previewService;
