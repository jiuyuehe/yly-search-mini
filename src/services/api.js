import axios from 'axios';
import { ElMessage } from 'element-plus';

const CT_KEY = 'ct';
const USER_INFO_KEY = 'userInfo';

function getCtFromCookie() {
  const match = document.cookie.match(/(?:^|; )ct=([^;]+)/);
  return match ? decodeURIComponent(match[1]):"";
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

// 基础搜索后端实例（保持原 /rag 前缀）
export const searchApi = axios.create({
  baseURL: '/rag',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

// 存储/应用服务器实例（/apps 前缀绝对地址）
export const appsApi = axios.create({
  baseURL: '/apps',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

function attachCt(config) {
  const ct = getCT();
  if (ct) config.headers['ct'] = ct;
  // inject userId header if available
  try {
    const user = getUserInfo();
    if (user && (user.id || user.userId)) {
      const uid = user.id || user.userId;
      if (uid !== undefined && uid !== null && uid !== '') {
        if (!config.headers['X-User-Id']) config.headers['X-User-Id'] = uid;
      }
    }
  } catch { /* ignore */ }
  return config;
}

[searchApi, appsApi].forEach(ins => {
  // 在每次请求前强制进行 initAuth 验证：
  // - 如果请求设置了跳过标识（cfg._skipAuth 或 header 'X-Skip-Auth'），则不再调用 initAuth，直接注入 ct 后发起请求。
  //   这样可以避免 initAuth -> fetchUserInfo 使用 appsApi 导致的拦截器递归/死循环问题。
  ins.interceptors.request.use(async cfg => {
    // 支持两种跳过方式：显式的请求配置 `_skipAuth: true` 或者 header `X-Skip-Auth`。
    if (cfg && (cfg._skipAuth || (cfg.headers && (cfg.headers['X-Skip-Auth'] || cfg.headers['x-skip-auth'])))) {
      return attachCt(cfg);
    }
    try {
      // initAuth 会检查 ct 并尝试拉取用户信息；若无效会返回 null
      const user = await initAuth();
      if (!user) {
        // 明确提示，且阻止本次请求发送到后端
       // ElMessage.warning('未检测到登录令牌 ct');
        return Promise.reject({ httpStatus: 401, code: 'NO_CT', message: '未检测到登录令牌 ct' });
      }
      // 若验证通过，则注入 ct 与 X-User-Id 等头信息
      return attachCt(cfg);
    } catch (e) {
      // 出现异常也统一以未登录/无令牌处理并拒绝请求
     // ElMessage.warning('未检测到登录令牌 ct');
      return Promise.reject({ httpStatus: 401, code: 'NO_CT', message: '未检测到登录令牌 ct', original: e });
    }
  }, err => Promise.reject(err));
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
  // apps 前缀接口使用 appsApi，避免重复 /apps/apps；直接请求 /user
  // 为避免拦截器在此内部请求时再次触发 initAuth（造成递归），
  // 在该请求上设置 _skipAuth 标识或 header，拦截器会识别并跳过验证。
  const res = await appsApi.get('/user', { _skipAuth: true });
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
   // ElMessage.warning('未检测到登录令牌 ct');
    return null;
  }
  const user = await fetchUserInfo();
  if (!user) {
    // 已在 fetch 内部提示
  } else {
   // ElMessage.success({ message: '用户已登录：' + (user.name || user.username || ''), duration: 1800 });
  }
  return user;
}

export default searchApi;