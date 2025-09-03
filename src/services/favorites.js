import { appsApi } from './api';

function unwrapRows(res) {
  const rows = res?.data?.data?.rows || res?.data?.rows || res?.rows || res?.data?.data || [];
  return Array.isArray(rows) ? rows : [];
}

export async function listFavorite(file) {
  if (!file?.fileId) return null;
  try {
    const body = { limit: 1, offset: 0, fileCategory: file.fileCategory || file.fc || 'personal', fileId: file.fileId };
    const res = await appsApi.post('/files/favorite/list', body);
    const rows = unwrapRows(res);
    return rows[0] || null;
  } catch (e) {
    console.warn('[favorites] list failed', e);
    return null;
  }
}

export async function addFavorite(file) {
  if (!file?.fileId) throw new Error('缺少文件');
  const body = { fileIds: [file.fileId], fileCategory: file.fileCategory || file.fc || 'personal' };
  const res = await appsApi.post('/files/favorite', body);
  return res;
}

export async function removeFavorite(favoriteId) {
  if (!favoriteId) throw new Error('缺少收藏ID');
  const body = { favoriteIds: [favoriteId] };
  const res = await appsApi.post('/files/favorite/remove', body);
  return res;
}
