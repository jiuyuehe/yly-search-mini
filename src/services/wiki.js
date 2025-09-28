// 独立的百科查询服务 (与现有 QA / aiService 解耦)
// 提供流式读取后端 /rag/ai/text/wiki Flux<String> 输出
// 用法：
//   import { wikiStream } from './wiki';
//   const controller = new AbortController();
//   await wikiStream({ text:'术语', onChunk:c=>..., onError:e=>..., onComplete:()=>..., signal: controller.signal });

// 引入统一 api 实例（searchApi 默认导出）以保持与其余代码风格一致
import { getCT, getUserInfo } from './api';

// 允许通过环境变量配置管理网关前缀（例如 /admin-api），本地开发可为空
// Vite 注入：VITE_ADMIN_API_PREFIX=/admin-api  (不带尾斜杠)
const ADMIN_PREFIX = (import.meta?.env?.VITE_ADMIN_API_PREFIX || '').replace(/\/$/, '');
// 完整流式接口路径（含 /rag 前缀，因为后端映射的是 /rag/ai/text/wiki）
const WIKI_FULL_PATH = `/rag/admin-api/rag/ai/text/wiki`;
// axios 基础实例 searchApi 的 baseURL 已是 /rag，因此 axios 里不应再重复 /rag；拼接时去掉前缀部分
// 鉴权相关（可通过环境变量覆盖）
const TENANT_ID = (import.meta?.env?.VITE_TENANT_ID || '1');
const AUTHORIZATION = (import.meta?.env?.VITE_AUTHORIZATION || 'Bearer test1');

function buildCommonHeaders(extra = {}) {
  return {
    'tenant-id': TENANT_ID,
    'Authorization': AUTHORIZATION,
    ...extra
  };
}

/**
 * 统一抽取错误消息
 */
function extractErrorMessage(e) {
  if (!e) return '未知错误';
  if (typeof e === 'string') return e;
  if (e.message) return e.message;
  try { return JSON.stringify(e); } catch { return '请求失败'; }
}

/**
 * 流式百科查询
 * @param {Object} opts
 * @param {string} opts.text  查询文本 (<=100 字符)
 * @param {number} [opts.size]  预留参数 (后端默认 0)
 * @param {(chunk:string)=>void} opts.onChunk  每次收到内容块
 * @param {(err:any)=>void} [opts.onError]
 * @param {()=>void} [opts.onComplete]
 * @param {AbortSignal} [opts.signal]
 */


/**
 * 流式百科查询：优先使用 fetch 以便按块输出；
 * 若运行环境或响应不支持流式，则回退到一次性 axios 请求 (wikiOnce)
 */
export async function wikiStream(opts) {
  const { text, size = 0, onChunk, onError, onComplete, signal } = opts || {};
  if (!text || !text.trim()) { onError && onError('请输入需要查询的百科词汇'); return; }
  const clipped = text.trim().slice(0, 100);

  // 优先使用 fetch 以支持流式 (axios 在浏览器不支持逐块读取)
  if (typeof fetch === 'function') {
    const ct = getCT();
    let userId = '';
    try { const u = getUserInfo(); userId = (u && (u.id || u.userId)) ? (u.id || u.userId) : ''; } catch { /* ignore */ }
    let resp;
    try {
  // debug log removed
      resp = await fetch(WIKI_FULL_PATH, {
        method: 'POST',
        headers: {
          ...buildCommonHeaders({
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream, text/plain, application/json,*/*'
          }),
          ...(ct ? { ct } : {}),
          ...(userId ? { 'X-User-Id': userId } : {})
        },
        body: JSON.stringify({ text: clipped, size }),
        signal
      });
    } catch (e) { onError && onError(extractErrorMessage(e)); return; }

    if (!resp.ok) {
      let errText = '';
      try { errText = await resp.text(); } catch { /* ignore */ }
      onError && onError(errText || `HTTP ${resp.status}`);
      return;
    }

    if (resp.body) {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      // 将 token 级 data: 流合并为“行”级输出：
      // 规则：
      //  - 普通 token 连续拼接到 lineBuffer
      //  - 空 payload (data:) 视为换行：flush lineBuffer -> emit '\n'
      //  - 连续两个空 payload 产生空行（第二个再发一个 '\n'）
      //  - 发送给前端的 onChunk: 非 "\n" 为一整行；"\n" 表示换行
      let residual = '';
      let lineBuffer = '';
      let blankCount = 0;
      const processDataLines = (text) => {
        const lines = text.split(/\r?\n/);
        for (let rawLine of lines) {
          if (!rawLine.startsWith('data:')) continue; // 忽略非 data: 行
          const payload = rawLine.slice(5); // 保留原样（可能为空 / 空格 / token）
          const trimmed = payload.replace(/^\s/, '');
          if (trimmed === '[DONE]') return 'DONE';
          if (payload === '') { // newline signal
            blankCount++;
            if (lineBuffer) {
              onChunk && onChunk(lineBuffer); // emit a full line
              lineBuffer = '';
            }
            // emit one \n per blank line (保留段落空行)
            onChunk && onChunk('\n');
            continue;
          }
          // 非空 token
          blankCount = 0;
          lineBuffer += payload; // 直接追加（中文无需空格，英文 token 若需要空格后端会给）
        }
        return null;
      };
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;
          residual += decoder.decode(value, { stream: true });
          const lastNL = residual.lastIndexOf('\n');
          if (lastNL >= 0) {
            const chunkText = residual.slice(0, lastNL + 1);
            residual = residual.slice(lastNL + 1);
            const endFlag = processDataLines(chunkText);
            if (endFlag === 'DONE') break;
          }
        }
        if (residual) processDataLines(residual);
        // flush 未结束的行
        if (lineBuffer) onChunk && onChunk(lineBuffer);
        onComplete && onComplete();
        return; // 成功流式完成
      } catch (e) {
        if (signal?.aborted) {
          onError && onError('已取消');
        } else {
          onError && onError(extractErrorMessage(e));
        }
        return;
      } finally { try { reader.releaseLock(); } catch { /* ignore */ } }
    }
    // 若没有 resp.body 则继续回退
  }
}

export default { wikiStream };
