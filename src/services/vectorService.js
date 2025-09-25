// 文档向量化相关服务（独立于 aiService）
// 提供两个方法：
// 1) checkVectorStatus(esId): 检查文档是否已向量化
// 2) vectorizeDoc({ esId, userId, forceReprocess }): 触发文档向量化

import api from './api';

function getUserId(userId) {
  if (userId !== undefined && userId !== null && userId !== '') return userId;
  try {
    const raw = localStorage.getItem('userInfo');
    if (raw) {
      const obj = JSON.parse(raw);
      const uid = obj?.userId || obj?.id || obj?.uid || obj?.userID || '';
      if (uid !== undefined && uid !== null && uid !== '') return uid;
    }
  } catch { /* ignore */ }
  return '';
}

export const vectorService = {
  // 检查文档向量化状态
  async checkVectorStatus(esId, userId) {
    if (!esId) throw new Error('缺少 esId');
    const headers = {};
    const uid = getUserId(userId);
    if (uid !== '') headers['X-User-Id'] = uid;
    const res = await api.get('/admin-api/rag/ai/text/file-chat/check-vector-status', {
      params: { esId },
      headers,
      timeout: 20000
    });
    const root = (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {});
    return {
      success: root.code === 0,
      data: root.data || null,
      raw: root
    };
  },

  // 触发文档向量化（chunkSize 不必传）
  async vectorizeDoc({ esId, userId, forceReprocess = true } = {}) {
    if (!esId) throw new Error('缺少 esId');
    const headers = { 'Content-Type': 'application/json' };
    const uid = getUserId(userId);
    if (uid !== '') headers['X-User-Id'] = uid;
    const body = { esId, userId: uid || userId || '', forceReprocess };
    const res = await api.post('/admin-api/rag/ai/text/file-chat/vectorize-doc', body, {
      headers,
      timeout: 30000
    });
    const root = (res && typeof res === 'object' && 'code' in res) ? res : (res?.data || {});
    return {
      success: root.code === 0,
      data: root.data || null,
      raw: root
    };
  }
};
