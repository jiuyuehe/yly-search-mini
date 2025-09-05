import { normalizeFile } from '../constants/fileModel';
import router from '../router';

/**
 * 导航到预览页：
 * fc = nas  => /preview/nas/:nsi/:subp
 * 其它       => /preview/:fc/:fi/:fsi
 * @param {Object} file 任意文件对象（将 normalize）
 * @param {Object} options { newTab?: boolean }
 */
export function navigateToPreview(file, options = {}) {
  const { newTab = false, retureBtn } = options;
  const { from } = options || {};
  if (!file) return;
  // allow passing an esId string directly
  const norm = typeof file === 'string' ? { esId: file, esid: file } : normalizeFile(file);
  const fc = norm.fileCategory;
  const fi = norm.fileId;
  const fsi = norm.fsFileId;
  const nsi = norm.nasId;
  const subp = norm.subPath || '';

  let routeObj;
  // If esId provided, prefer esid route
  if (norm.esId || norm.esid) {
    routeObj = { name: 'preview-esid', params: { esid: norm.esId || norm.esid } };
  } else if (fc === 'nas') {
    const encodedSubp = encodeURIComponent(subp || '');
    routeObj = { name: 'preview-nas', params: { nsi, subp: encodedSubp } };
  } else {
    routeObj = { name: 'preview', params: { fc: fc || 'doc', fi: fi || 0, fsi: fsi || 0 } };
  }

  // attach origin marker to query so preview can show back button and optionally restore state
  if (from || typeof retureBtn !== 'undefined') {
    routeObj.query = { ...(routeObj.query || {}), ...(from ? { from } : {}), ...(typeof retureBtn !== 'undefined' ? { retureBtn } : {}) };
  }

  const resolved = router.resolve(routeObj);
  if (newTab) {
    window.open(resolved.href, '_blank');
  } else {
    router.push(routeObj).catch(() => {});
  }
}

// 跳转到云端路径（父页面监听）
export function goCloudPath(file) {
  if (!file) return;
  try {
    const payload = { ...file };
    window.top?.postMessage({ type: 'client_go_path', file: payload }, '*');
  } catch (e) {
    console.warn('goCloudPath failed', e);
  }
}

export default navigateToPreview;
