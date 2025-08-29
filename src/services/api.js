import axios from 'axios';
import { ElMessage } from 'element-plus';

const CT_KEY = 'ct';
const USER_INFO_KEY = 'userInfo';

function getCtFromCookie() {
  const match = document.cookie.match(/(?:^|; )ct=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5LCJ0aW1lIjoxNzU2MjAyMDE4LCJrZXkiOiIxMjM0NTY3NC4yIiwiaXAiOiIxOTIuMTY4LjI1MC4xMTQiLCJkZXZpY2UiOiJ3ZWIiLCJpYXQiOjE3NTYyMDIwMTh9._TS6e9XVUHX2pXs6AOHlJuatdOOXo1W6PCHML9W4Btw";
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
  config.headers['ct'] = ct; 
  return config;
}

[searchApi, appsApi].forEach(ins => {
  ins.interceptors.request.use(cfg => attachCt(cfg), err => Promise.reject(err));
  ins.interceptors.response.use(
    res => res.data,
    err => {
      const standardError = (() => {
        if (err && err.response) {
          const { status, data, config } = err.response;
          return {
            httpStatus: status,
            url: config?.url,
            method: config?.method,
            code: data?.status || status,
            message: data?.msg || data?.message || err.message || '请求失败',
            serverMsg: data?.msg, // 保留后端原始 msg
            backendStatus: data?.status, // 业务状态码
            data: data?.data !== undefined ? data.data : data,
            response: err.response,
            original: err
          };
        }
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
    // 修正重复前缀，原 /apps/apps/user -> /apps/user
    const res = await appsApi.get('/apps/user');
    console.log(res);
    if (res && res.status === 'ok') {
      setUserInfo(res.data || {});
      return res.data;
    }
    if (res && res.status === 'err_token') {
      clearCT();
      throw { code: 'err_token', httpStatus: 401, message: res.msg || '登录已过期' };
    }
    return null;
  } catch (e) {
    // 适配标准化错误 & 旧结构
    if (e.code === 'err_token' || e.httpStatus === 401 || e.httpStatus === 403) {
      clearCT();
      ElMessage.error(e.message || '登录已过期或无权限');
    } else if (e.httpStatus === 0) {
      ElMessage.error('网络异常，无法获取用户信息');
    } else {
      console.warn('[auth] fetchUserInfo failed', e);
    }
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