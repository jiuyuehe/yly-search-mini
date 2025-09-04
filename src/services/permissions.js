import { appsApi } from './api';

/**
 * 文件权限相关服务
 * 根据文件类别（nas / 其它）调用不同接口返回权限列表
 * 返回统一数组，如 ['view','download','edit']
 */
export async function fetchFilePermissions(meta = {}) {
  if (!meta) return [];
  const fc = meta.fileCategory || meta.fc;
  if (!fc) return [];
  try {
    if (fc === 'nas') {
      const nasId = meta.nasId || meta.nsi || meta.nasCode;
      const nasFilePath = meta.subPath || meta.nasFilePath || meta.filePath || meta.path;
      if (!nasId || !nasFilePath) return [];
      const body = { nasCode: nasId, nasFilePath };
      const res = await appsApi.post('/nas/file/all-pers', body);
      // 兼容结构: { status:'ok', data:{ pers:[] } } 或直接 { pers:[] }
      if (res?.status === 'ok' && Array.isArray(res?.data?.pers)) return res.data.pers;
      if (Array.isArray(res?.pers)) return res.pers;
      return [];
    } else {
      const fi = meta.fileId || meta.id || meta.fi;
      if (!fi) return [];
      const params = { fi, fc };
      const res = await appsApi.get('/file/all-pers', { params });
      if (res?.status === 'ok' && Array.isArray(res?.data?.pers)) return res.data.pers;
      if (Array.isArray(res?.pers)) return res.pers;
      return [];
    }
  } catch (e) {
    console.warn('[permissions] fetchFilePermissions failed', e);
    return [];
  }
}

export function mapPermission(code) {
  const PERM_MAP = {
    view: '查看',
    read: '查看',
    preview: '预览',
    edit: '编辑',
    update: '编辑',
    download: '下载',
    dl: '下载',
  down: '下载',
  upload: '上传',
  up: '上传',
    share: '分享',
  分享: '分享',
    delete: '删除',
    remove: '删除',
  del: '删除',
    manage: '管理',
    admin: '管理'
  ,sync: '同步'
  ,per: '权限'
  ,import: '导入'
  ,fav: '收藏'
  ,favorite: '收藏'
  ,collect: '收藏'
  ,list: '列表'
  ,编辑: '编辑'
  };
  return PERM_MAP[code] || code;
}
