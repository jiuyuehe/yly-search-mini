import axios from 'axios';
import { ElMessage } from 'element-plus';

const CT_KEY = 'ct';
const USER_INFO_KEY = 'userInfo';

function getCtFromCookie() {
  const match = document.cookie.match(/(?:^|; )ct=([^;]+)/);
  return match ? decodeURIComponent(match[1]) :"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJ0aW1lIjoxNzU1OTQ3NzgyLCJrZXkiOiIxMjM0NTY3NC4yIiwiaXAiOiIxOTIuMTY4LjI1MC4xMTQiLCJkZXZpY2UiOiJ3ZWIiLCJpYXQiOjE3NTU5NDc3ODJ9.Pc0IBpV7aRTYTNzqzgjLwNXRaadUc_j947dcCnIBoq0";
}

export function getCT() {
  return localStorage.getItem(CT_KEY) || getCtFromCookie();
}
export function clearCT() {
  try { localStorage.removeItem(CT_KEY); } catch { /* ignore */ }
}
export function setUserInfo(u) {
  try { localStorage.setItem(USER_INFO_KEY, JSON.stringify(u||{})); } catch { /* ignore */ }
}
export function getUserInfo() {
  try { return JSON.parse(localStorage.getItem(USER_INFO_KEY)||'null'); } catch { return null; }
}

// 基础搜索后端实例（保持原 /api 前缀）
export const searchApi = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

// 存储/应用服务器实例（/apps 前缀绝对地址）
export const appsApi = axios.create({
  baseURL: '/apps',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

function attachCt(config) {
  const ct = getCT();
  if (ct) config.headers['ct'] = ct; else config.headers['ct'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJ0aW1lIjoxNzU1OTQ3NzgyLCJrZXkiOiIxMjM0NTY3NC4yIiwiaXAiOiIxOTIuMTY4LjI1MC4xMTQiLCJkZXZpY2UiOiJ3ZWIiLCJpYXQiOjE3NTU5NDc3ODJ9.Pc0IBpV7aRTYTNzqzgjLwNXRaadUc_j947dcCnIBoq0';
  return config;
}

[searchApi, appsApi].forEach(ins => {
  ins.interceptors.request.use(cfg => attachCt(cfg), err => Promise.reject(err));
  ins.interceptors.response.use(
    res => res.data,
    err => {
      // 标准化错误对象，避免上层拿不到 http 状态码
      const standardError = (() => {
        if (err && err.response) {
          const { status, data, config } = err.response;
          return {
            httpStatus: status,
            url: config?.url,
            method: config?.method,
            code: data?.status || status, // 后端业务码或直接 http 状态
            message: data?.msg || data?.message || err.message || '请求失败',
            data,
            response: err.response, // 兼容旧代码 err.response?.status 判断
            original: err
          };
        }
        // 无 response，多半是网络/超时/跨域等
        return {
          httpStatus: 0,
          code: 'NETWORK_ERROR',
          message: err?.message || '网络异常',
          data: null,
          response: null,
          original: err
        };
      })();
      return Promise.reject(standardError);
    }
  );
});

let _authInited = false;
export async function fetchUserInfo() {
  try {
    const res = await appsApi.get('/apps/user');
    if (res && res.status === 'ok') {
      setUserInfo(res.data || {});
      return res.data;
    }
    if (res && res.status === 'err_token') {
      clearCT();
      ElMessage.error('登录已过期，请刷新或重新登录');
      return null;
    }
    return null;
  } catch (e) {
    console.warn('[auth] fetchUserInfo failed', e);
    return null;
  }
}
export async function initAuth(force = false) {
  if (_authInited && !force) return getUserInfo();
  _authInited = true;
  const ct = getCT();
  if (!ct) {
    ElMessage.warning('未检测到登录令牌 ct');
    return null;
  }
  const user = await fetchUserInfo();
  if (!user) {
    // 已在 fetch 内部提示
  } else {
    ElMessage.success({ message: '用户已登录：' + (user.name || user.username || ''), duration: 1800 });
  }
  return user;
}

export default searchApi;