import { appsApi, getCT } from './api';
import { buildAppsUrl } from '../constants/server';

function triggerBrowserDownload(url, filename) {
  try {
    const a = document.createElement('a');
    a.href = url;
    if (filename) a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); }, 0);
  } catch (e) { console.warn('download trigger failed', e); }
}

export async function downloadFileByMeta(file) {
  if (!file) throw new Error('缺少文件信息');
  const fc = file.fileCategory || file.fc;
  if (fc === 'nas') {
    const nasId = file.nasId;
    const nasFilePath = file.subPath || file.filePath;
    if (!nasId || !nasFilePath) throw new Error('NAS 下载缺少 nasId 或 nasFilePath');
    const furl = buildAppsUrl(`/nas/file/download?nasCode=${encodeURIComponent(nasId)}&nasFilePath=${encodeURIComponent(nasFilePath)}&ct=${encodeURIComponent(getCT()||'')}`);
    triggerBrowserDownload(furl, file.fileName || file.name);
    return { url: furl };
  }
  // 普通文件: 获取一次临时下载地址
  const fi = file.fileId || file.id;
  if (!fi || !fc) throw new Error('普通文件下载缺少 fileId 或 fileCategory');
  const res = await appsApi.get('/file/down', { params: { fi, fc } });
  if (!res || res.status !== 'ok' || !res.data?.fileUri) throw new Error(res?.msg || '文件获取失败');
  let furl = res.data.fileUri;
  if (!/[?&]ct=/.test(furl)) furl += (furl.includes('?') ? '&' : '?') + 'ct=' + encodeURIComponent(getCT()||'');
  furl = buildAppsUrl(furl);
  triggerBrowserDownload(furl, file.fileName || file.name);
  return { url: furl };
}

export default { downloadFileByMeta };