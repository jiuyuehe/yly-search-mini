// 存储/应用服务器基础地址（可根据部署环境动态替换）
export const APPS_BASE =  window.location.origin;

// 生成存储绝对 URL（传入可能以 / 开头的路径或完整 http(s) 地址）
export function buildAppsUrl(path) {
  if (!path) return '';
  if (/^https?:/i.test(path)) return path;
  return APPS_BASE.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
}
