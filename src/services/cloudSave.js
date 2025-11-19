import { appsApi } from './api';

export async function fetchFolderTree({ fc = 'personal', parentId }) {
  const params = { fc, fi: parentId, limit: 10000 };
  const res = await appsApi.get('/file/folders', { params });
  const files = res?.data?.data?.files || res?.data?.files || res?.files || [];
  return files.map(it => ({ ...it, name: it.fileName || it.name }));
}

export async function copyPublicToPersonal({ file, targetFolderId }) {
  if (!file?.fileId) throw new Error('缺少文件');
  const body = { fileCategory: file.fileCategory || file.fc, toCategory: 'personal', toFolderId: targetFolderId, fileIds: [file.fileId] };
  return appsApi.post('/files/copy', body);
}

export async function createNasExportTask({ file, targetParentId }) {
  const body = {
    isCover: 0,
    sourceNasPath: file.subPath || file.filePath,
    targetFileCategory: 'personal',
    targetParentId,
    nasCode: file.nasId || file.nasCode
  };
  const res = await appsApi.post('/nas/files/export/yun/task', body);
  const taskId = res?.data?.data?.taskId || res?.data?.taskId || res?.taskId;
  if (!taskId) throw new Error('任务创建失败');
  return taskId;
}

export async function pollNasExportTask(taskId, { maxWaitMs = 15000, interval = 1200 } = {}) {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > maxWaitMs) throw new Error('超时');
    const res = await appsApi.get('/nas/files/export/yun/task', { params: { taskId } });
    const data = res?.data?.data || res?.data || res;
    if (data?.status === 'ok' || data?.finished) return data;
    if (data?.status === 'fail' || data?.error) throw new Error(data?.error || '任务失败');
    await new Promise(r => setTimeout(r, interval));
  }
}
