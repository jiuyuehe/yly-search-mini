<template>
  <div class="file-chat-root" :class="{ 'sessions-collapsed': !showSessions }">
    <!-- Sidebar sessions -->
    <aside class="sessions-pane" v-show="showSessions">
      <div class="sessions-header">
        <div class="title">会话</div>
        <div class="actions">
          <el-tooltip content="新建会话" placement="bottom">
            <el-button size="small" circle @click="createNewSession('', '')" :disabled="streaming">
              <el-icon>
                <Plus/>
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="清空全部" placement="bottom">
            <el-button size="small" circle @click="confirmClearAll" :disabled="streaming || !sessions.length">
              <el-icon>
                <Delete/>
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="刷新" placement="bottom">
            <el-button size="small" circle @click="reloadSessions" :loading="loadingSessions">
              <el-icon>
                <Refresh/>
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="sessions-list" v-loading="loadingSessions">
        <div v-if="!sessions.length && !loadingSessions" class="empty">暂无会话</div>
        <div v-for="s in sessions" :key="s.id" class="session-item" :class="{active: s.id===currentSessionId}"
             @click="switchSession(s.id)">
          <div class="name" :title="sessionDisplayTitle(s)">{{ sessionDisplayTitle(s) }}</div>
          <div class="ops" @click.stop>
            <el-tooltip content="删除" placement="top">
              <el-button class="del-btn" size="small" text @click="deleteSession(s.id)" :disabled="streaming">
                <el-icon>
                  <Close/>
                </el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </aside>

    <!-- Chat main area -->
    <section class="chat-main">
      <header class="chat-header">
        <div class="chat-title">
          <el-button class="toggle-sessions" size="small" text @click="toggleSessions">
            <el-icon v-if="showSessions">
              <ArrowLeft/>
            </el-icon>
            <el-icon v-else>
              <Menu/>
            </el-icon>
          </el-button>
          <span v-if="!editingTitle" class="title-text" @dblclick="beginEditTitle"
                :title="currentSessionTitle">{{ currentSessionTitle || '新建会话' }}<span
              v-if="messages.length"> ({{ messages.length }})</span></span>
          <el-input
              v-else
              size="small"
              class="title-edit-input"
              v-model="editableTitle"
              @keyup.enter="saveTitle"
              @blur="saveTitle"
              :maxlength="40"
          />
          <el-tag v-if="useContext" size="small" type="success">上下文</el-tag>
          <el-button v-if="!showSessions" class="header-new-session" size="small" circle :disabled="streaming"
                     @click="quickNewSession">
            <el-icon>
              <Plus/>
            </el-icon>
          </el-button>
        </div>
        <div class="chat-header-actions">
          <el-button class="model-config-btn" size="small" type="primary" bg plain @click="openConfig">
            <span class="model-name">{{ modelDisplayName || '配置模型' }}</span>
            <el-icon class="ml-4">
              <Setting/>
            </el-icon>
          </el-button>
          <el-tooltip content="导出会话" placement="bottom">
            <el-button size="small" circle @click="exportConversation" :disabled="!messages.length">
              <el-icon>
                <Download/>
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="回到顶部" placement="bottom">
            <el-button size="small" circle @click="scrollToTop" :disabled="!messages.length">
              <el-icon>
                <ArrowLeft style="transform:rotate(90deg);"/>
              </el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="清空当前会话" placement="bottom">
            <el-button size="small" plain type="default" @click="confirmClearCurrent"
                       :disabled="!messages.length || streaming" class="btn-clear-current">清空当前会话
            </el-button>
          </el-tooltip>
          <el-button v-if="showReturn" size="small" type="primary" class="btn-return"
                     @click="$emit('return-to-search')">返回搜索
          </el-button>
        </div>
      </header>

      <FileChatMessageList
          ref="messageListRef"
          :list="messages"
          :streaming="streaming"
          user-avatar-text="我"
          ai-avatar-text="AI"
          @copy="copyMessage"
          @retry="retryMessage"
          @resend="resendMessage"
          @edit="editMessage"
          @delete="deleteMessage"
          @scroll-state="(s)=> onChildScrollState(s)"
      />

      <div v-if="!messages.length && !currentSessionId && !streaming" class="starter-container">
        <div class="starter-title">快速开始</div>
        <div class="starter-list">
          <div class="starter-item" v-for="q in starterQuestions" :key="q" @click="clickStarter(q)">{{ q }}</div>
        </div>
      </div>

      <!-- Input area -->
      <footer class="input-area">
        <div class="input-box input-overlay" :class="{ 'rag-mode': isRagMode }">
          <!-- RAG: 单层 contenteditable 输入 -->
          <div v-if="isRagMode" class="ce-wrapper">
            <div
                ref="ceRef"
                class="ce-input"
                :contenteditable="!creatingSession"
                :data-placeholder="inputPlaceholder"
                @keydown.enter.prevent="onEnterPress"
                @input="onCeInput"
                @paste="onCePaste"
                @keyup="updateHasSelection"
                @mouseup="updateHasSelection"
            ></div>
          </div>
          <!-- QA: 仍用 textarea -->
          <el-input
              v-else
              ref="inputRef"
              v-model="inputText"
              :autosize="{minRows:3,maxRows:10}"
              type="textarea"
              :placeholder="inputPlaceholder"
              @keydown.enter.prevent="onEnterPress"
              :disabled="creatingSession"
          />
          <div class="inline-control left">
            <el-checkbox v-model="useContext" :disabled="streaming">上下文</el-checkbox>
            <template v-if="isRagMode">
              <span class="tag-tools-sep">|</span>
              <el-tooltip content="选中文本后标记为关键词" placement="top">
                <el-button text size="small" class="tag-btn kw" :disabled="!hasSelection || streaming"
                           @mousedown.prevent="markSelection('keyword')"><span class="dot kw"></span>关键词
                </el-button>
              </el-tooltip>
              <el-tooltip content="选中文本后标记为关键内容" placement="top">
                <el-button text size="small" class="tag-btn kc" :disabled="!hasSelection || streaming"
                           @mousedown.prevent="markSelection('keycontent')"><span class="dot kc"></span>关键内容
                </el-button>
              </el-tooltip>
              <el-tooltip content="清除选区标记；无选区则清空全部" placement="top">
                <el-button text size="small" class="tag-btn clear"
                           :disabled="(!hasSelection && markCount===0) || streaming" @mousedown.prevent="clearMarks">
                  清除标记
                </el-button>
              </el-tooltip>
            </template>
          </div>
          <div class="inline-control right">
            <el-button size="small" @click="stopStreaming" v-if="streaming" type="warning">停止</el-button>
            <el-button size="small" type="primary" @click="sendMessage" :disabled="!canSend">发送</el-button>
          </div>
        </div>
      </footer>
      <!-- parent-level scroll button to avoid clipping by the scroll container -->
      <el-button v-if="!childNearBottom" class="scroll-to-bottom-parent" size="small" plain @click="scrollToBottom">
        回到底部
      </el-button>
    </section>
  </div>

  <!-- 参数配置弹窗 -->
  <el-dialog v-model="showConfig" title="会话设置" width="520px">
    <el-form label-width="130px" class="config-form" :model="configDraft">
      <el-form-item label="系统模型">
        <el-select v-model="configDraft.modelId" placeholder="选择模型" filterable :loading="modelsLoading"
                   @change="onModelChange">
          <el-option v-for="m in models" :key="m.id" :label="m.name" :value="m.id"/>
        </el-select>
      </el-form-item>
      <el-form-item label="用户提示词">
        <el-input type="textarea" :rows="3" v-model="configDraft.userPrompt"
                  placeholder="为本会话设定自定义提示词或风格提示"/>
      </el-form-item>
      <el-form-item label="温度 temperature">
        <el-input-number v-model="configDraft.temperature" :min="0" :max="2" :step="0.1" :precision="2"/>
      </el-form-item>
      <el-form-item label="回复上限 tokens">
        <el-input-number v-model="configDraft.maxTokens" :min="0" :max="8192"/>
      </el-form-item>
      <el-form-item label="上下文条数">
        <el-input-number v-model="configDraft.maxContexts" :min="0" :max="20"/>
      </el-form-item>
      <el-form-item label="TopK(检索)">
        <el-input-number v-model="configDraft.topK" :min="1" :max="10"/>
      </el-form-item>
      <el-form-item label="最大上下文字符">
        <el-input-number v-model="configDraft.maxContextChars" :min="1000" :max="50000" step="500"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showConfig=false">取消</el-button>
      <el-button type="primary" :loading="savingConfig" @click="applyConfig">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import {ref, onMounted, watch, nextTick, computed, reactive, provide} from 'vue';
// declare emitted events so parent listeners are recognized (support kebab and camelCase)
defineEmits(['return-to-search', 'returnToSearch']);
import {ElMessage, ElMessageBox} from 'element-plus';
import {Plus, Delete, Refresh, Close, ArrowLeft, Menu, Setting, Download} from '@element-plus/icons-vue';
import FileChatMessageList from './FileChatMessageList.vue';
import {getUserInfo} from '../../../services/api';
import {resolveEsId} from '../../../utils/esid';

// 对外可配置参数：
// - url: 调用的后端流式接口（默认 /admin-api/rag/ai/text/file-chat/stream）
// - fileId / esId: 文档标识
// - sessionchat: 会话侧栏是否默认展开
// - showReturn: 是否显示“返回搜索”按钮
// - defaultUseContext: “上下文”是否默认勾选
// - chatType: 会话类型，qa | rag（全局参数）
const props = defineProps({
  file: {type: Object, required: false, default: null},
  fileId: {type: String, required: false},
  esId: {type: String, default: ''},
  userId: {type: [String, Number], default: ''},
  expandSessions: {type: Boolean, default: false}, // 向后兼容
  url: {type: String, default: '/admin-api/rag/ai/text/file-chat/stream'},
  sessionchat: {type: Boolean, default: true},
  showReturn: {type: Boolean, default: false},
  defaultUseContext: {type: Boolean, default: true},
  chatType: {type: String, default: 'qa', validator: (v) => ['qa', 'rag'].includes(v)}
});
// 向子组件全局提供 chatType
const chatTypeRef = computed(() => props.chatType || 'qa');
provide('chatType', chatTypeRef);
const isRagMode = computed(() => chatTypeRef.value === 'rag');
const showSessions = ref(true);

// const encyclopediaOnly = computed(() => { return !props.file && !props.fileId && !(props.esId && String(props.esId).trim()); });
function toggleSessions() {
  showSessions.value = !showSessions.value;
  if (showSessions.value) {
    reloadSessions();
  }
}

const sessions = ref([]);
const currentSessionId = ref(null); // 不自动创建，首次发送时创建
const messages = ref([]);
const inputText = ref('');
// RAG 单层 contenteditable 相关
const ceRef = ref(null);
const hasSelection = ref(false);
const markCount = ref(0);
let lastRange = null; // 记录最近一次选区，用于按钮点击时恢复
const ceText = ref(''); // CE 可见纯文本（用于按钮启用和统计）
const inputPlaceholder = computed(() => isRagMode.value
    ? '请输入问题，支持选中文本后点击“关键词/关键内容”进行标注，Enter 发送，Shift+Enter 换行'
    : '输入你的问题，Enter 发送，Shift+Enter 换行');
const streaming = ref(false);
const creatingSession = ref(false);
const loadingSessions = ref(false);
const useContext = ref(true);
const topK = ref(3);
const maxContextChars = ref(8000);
const showConfig = ref(false);
const savingConfig = ref(false);
const models = ref([]);
const modelsLoading = ref(false);
const configForm = reactive({
  userPrompt: '',
  modelId: '',
  temperature: 1,
  maxTokens: 1024,
  maxContexts: 10,
  topK: topK.value,
  maxContextChars: maxContextChars.value
});

// Working draft used by the modal. Only when user clicks 保存 (applyConfig)
// do we persist changes from configDraft into configForm and backend.
const configDraft = reactive({
  userPrompt: configForm.userPrompt,
  modelId: configForm.modelId,
  temperature: configForm.temperature,
  maxTokens: configForm.maxTokens,
  maxContexts: configForm.maxContexts,
  topK: configForm.topK,
  maxContextChars: configForm.maxContextChars
});
// Trace currentSessionId and sessions mutations to find unexpected resets
// (no debug watches)
async function loadModels() {
  modelsLoading.value = true;
  try {
    const {aiService} = await import('../../../services/aiService');
    models.value = await aiService.getChatModels({userId: effectiveUserId.value});
  } finally {
    modelsLoading.value = false;
  }
}

function fillConfigDraftFromSession() {
  const s = sessions.value.find(s => s.id === currentSessionId.value);
  if (!s) return;
  // copy session raw into draft; only override when session provides a concrete value
  const raw = s.raw || {};
  if (raw.userPrompt !== undefined && raw.userPrompt !== null) configDraft.userPrompt = raw.userPrompt;
  if (raw.modelId !== undefined && raw.modelId !== null) configDraft.modelId = raw.modelId;
  else if (raw.model !== undefined && raw.model !== null) configDraft.modelId = raw.model;
  if (raw.temperature !== undefined && raw.temperature !== null) configDraft.temperature = raw.temperature;
  if (raw.maxTokens !== undefined && raw.maxTokens !== null) configDraft.maxTokens = raw.maxTokens;
  if (raw.maxContexts !== undefined && raw.maxContexts !== null) configDraft.maxContexts = raw.maxContexts;
  // keep UI-driven values for topK / maxContextChars as current control defaults
  configDraft.topK = topK.value ?? configDraft.topK;
  configDraft.maxContextChars = maxContextChars.value ?? configDraft.maxContextChars;
}

async function openConfig() {
  //TODO 后续完善,先屏蔽
  // fill draft from current session (only overrides when session provides explicit values)
  fillConfigDraftFromSession();
  await loadModels();
  showConfig.value = true;
}

async function applyConfig() {
  savingConfig.value = true;
  try {
    // update local chat runtime params
    topK.value = configDraft.topK;
    maxContextChars.value = configDraft.maxContextChars;
    const {aiService} = await import('../../../services/aiService');
    if (currentSessionId.value) {
      const {success} = await aiService.updateFileChatSession({
        sessionId: currentSessionId.value,
        modelId: configDraft.modelId,
        temperature: configDraft.temperature,
        maxTokens: configDraft.maxTokens,
        maxContexts: configDraft.maxContexts,
        userPrompt: configDraft.userPrompt,
        userId: effectiveUserId.value
      });
      if (success) {
        // persist draft into configForm
        Object.assign(configForm, JSON.parse(JSON.stringify(configDraft)));
        // update current session raw and display model name
        const s = sessions.value.find(s => s.id === currentSessionId.value);
        if (s) {
          const selected = models.value.find(m => String(m.id) === String(configDraft.modelId));
          s.raw = {
            ...(s.raw || {}),
            userPrompt: configDraft.userPrompt,
            modelId: configDraft.modelId,
            temperature: configDraft.temperature,
            maxTokens: configDraft.maxTokens,
            maxContexts: configDraft.maxContexts,
            modelName: selected?.name || s.raw?.modelName
          };
        }
        ElMessage.success('已保存');
        showConfig.value = false;
      } else {
        ElMessage.error('保存失败');
      }
    }
  } finally {
    savingConfig.value = false;
  }
}

function onModelChange() {
  // 选择模型后，立即在标题处反映已选择的模型名称
  const s = sessions.value.find(s => s.id === currentSessionId.value);
  const selected = models.value.find(m => String(m.id) === String(configDraft.modelId));
  if (s) {
    s.raw = {...(s.raw || {}), modelId: configDraft.modelId, modelName: selected?.name || s.raw?.modelName};
  }
}

const internalUserId = ref('');

function resolveUserId() {
  if (props.userId) {
    internalUserId.value = String(props.userId);
    return;
  }
  try {
    const info = getUserInfo();
    const uid = info?.userId || info?.id || info?.uid || '';
    if (uid) internalUserId.value = String(uid);
  } catch { /* ignore */
  }
}

const effectiveUserId = computed(() => props.userId || internalUserId.value || '');
const abortRef = ref(null);
const messageListRef = ref(null);
const childNearBottom = ref(true);
const editingTitle = ref(false);
const editableTitle = ref('');

// 统一解析 esId（可为空：百科模式）
const effectiveEsId = computed(() => resolveEsId(props.file, props.esId || props.fileId) || '');
// 用于持久化最近会话 id 的 key（按 esId 或 per-user 全局键区分）
const esKey = computed(() => effectiveEsId.value || (`global:${effectiveUserId.value || 'anonymous'}`));
// 发送条件：RAG 模式需提供 esId；QA 模式允许百科(global)对话
const canSend = computed(() => {
  if (streaming.value) return false;
  if (isRagMode.value) {
    return ceText.value.trim().length > 0 && !!effectiveEsId.value;
  }
  return inputText.value.trim().length > 0;
});
const currentSessionTitle = computed(() => {
  const s = sessions.value.find(s => s.id === currentSessionId.value);
  if (!s) return '';
  if (s.title) return s.title;
  const firstUser = messages.value.find(m => m.role === 'user');
  return firstUser ? firstUser.content.slice(0, 20) : `会话 ${s.id}`;
});

// utility: derive a concise title from a text (used for new sessions)
function makeTitle(txt = '') {
  const s = String(txt || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const max = 80;
  return s.length > max ? (s.slice(0, max - 3) + '...') : s;
}

const modelDisplayName = computed(() => {
  const s = sessions.value.find(s => s.id === currentSessionId.value);
  if (!s) return '';
  return s.raw?.modelName || s.raw?.model || '';
});

function sessionDisplayTitle(s) {
  return s.title || (s.raw?.title) || (s.id ? `会话 ${s.id}` : '未命名');
}

function persistLastSession() {
  const es = esKey.value;
  if (!currentSessionId.value) return;
  try {
    localStorage.setItem(`fileChat:lastSession:${es}`, currentSessionId.value);
  } catch { /* ignore */
  }
}

function loadPersistedLastSession() {
  const es = esKey.value;
  try {
    return localStorage.getItem(`fileChat:lastSession:${es}`);
  } catch {
    return null;
  }
}

const inputRef = ref(null);

async function init() {
  resolveUserId();
  // 初始化：上下文勾选与会话展开来自外部参数
  useContext.value = !!props.defaultUseContext;
  showSessions.value = !!props.sessionchat;
  // 尝试加载会话列表与最近会话（支持 per-esId 或 global）
  try {
    await reloadSessions();
  } catch { /* ignore */
    ;
  }
  try {
    await loadLatest();
  } catch { /* ignore */
    ;
  }
  // 如果没有任何会话，则自动新建一个，便于直接输入即发送
  if (!currentSessionId.value) {
    try {
      await createNewSession('', '');
    } catch { /* ignore */
      ;
    }
  }
  bindEsc();
}

function bindEsc() {
  window.addEventListener('keydown', escHandler);
  window.addEventListener('keydown', shortcutHandler);
}

function escHandler(e) {
  if (e.key === 'Escape' && streaming.value) {
    stopStreaming();
  }
}

function shortcutHandler(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    quickNewSession();
  }
}

onMounted(() => {
  init();
});
watch(() => props.esId, () => {
  resetAll();
  init();
});
watch(() => props.fileId, () => {
  resetAll();
  init();
});
watch(() => props.file, () => {
  resetAll();
  init();
});
// allow parent to request sessions panel expansion
watch(() => props.expandSessions, (v) => {
  if (v) {
    showSessions.value = true;
    reloadSessions().catch(() => {
    });
  }
});

// expose ability for parent to trigger reload sessions
function loadSessions() {
  return reloadSessions();
}

defineExpose({askQuestion, loadSessions});

// expose programmatic ask function to parent via ref
function askQuestion(q) {
  if (!q || !String(q).trim()) return;
  if (isRagMode.value) setCeText(String(q).trim()); else inputText.value = String(q).trim();
  // ensure session exists then send
  return (async () => {
    const titleForCreate = makeTitle(q);
    if (!currentSessionId.value) await createNewSession(inputText.value, titleForCreate);
    // small tick to ensure session creation flows
    await nextTick();
    if (!currentSessionId.value) return false;
    await sendMessage();
    return true;
  })();
}

function resetAll() {
  sessions.value = [];
  currentSessionId.value = null;
  messages.value = [];
}

async function loadLatest() {
  const esForApi = effectiveEsId.value || `global:${effectiveUserId.value || 'anonymous'}`;
  const stored = loadPersistedLastSession();
  try {
    const {aiService} = await import('../../../services/aiService');
    // esForApi used to represent either document esId or per-user global key
    const {success, session, messages: history} = await aiService.getLatestFileChatSession({
      esId: esForApi,
      returnHistory: true,
      userId: effectiveUserId.value
    });
    // loadLatest fetched
    if (success && session) {
      // merge with any local session info to preserve raw/config fields
      const local = sessions.value.find(s => String(s.id) === String(session.id)) || {};
      const merged = {
        ...session,
        raw: {...(session.raw || {}), ...(local.raw || {})},
        title: session.title || local.title || ''
      };
      // set current session id
      currentSessionId.value = merged.id;
      // merge into existing sessions list instead of replacing it so previous reloadSessions results are preserved
      const existIdx = sessions.value.findIndex(s => String(s.id) === String(merged.id));
      if (existIdx >= 0) {
        // replace existing entry
        sessions.value.splice(existIdx, 1, merged);
      } else {
        // add to front
        sessions.value.unshift(merged);
      }
      // ensure persisted-stored session is present (compare as string to avoid type mismatch)
      if (stored && String(stored) !== String(merged.id)) {
        const localStored = sessions.value.find(s => String(s.id) === String(stored)) || {
          id: stored,
          esId: esForApi,
          title: '',
          raw: {}
        };
        if (!sessions.value.find(s => String(s.id) === String(localStored.id))) sessions.value.push(localStored);
      }
      // load messages for the current session
      messages.value = history;
      scrollSoon();
    }
  } catch (err) {
    console.warn('加载会话失败', err);
  }
}

async function ensureSession() { /* 延迟创建：不在初始化阶段自动创建 */
}

async function createNewSession(userPromptForCreate = '', titleForCreate = '', esIdOverride = undefined) {
  // 兼容点击事件误传: 若第一个/第二个参数为事件对象，则置为空字符串
  if (userPromptForCreate && typeof userPromptForCreate === 'object') {
    userPromptForCreate = '';
  }
  if (titleForCreate && typeof titleForCreate === 'object') {
    titleForCreate = '';
  }
  if (creatingSession.value) return;
  const esId = (typeof esIdOverride !== 'undefined') ? esIdOverride : (effectiveEsId.value || `global:${effectiveUserId.value || 'anonymous'}`);
  creatingSession.value = true;
  try {
    const {aiService} = await import('../../../services/aiService');
    // when no explicit title provided, use current input (CE or textarea)
    if (!titleForCreate) {
      const currentInput = isRagMode.value ? (ceRef.value ? String(ceRef.value.innerText || '').replace(/\u200B/g, '') : '') : (inputText.value || '');
      titleForCreate = makeTitle(currentInput || userPromptForCreate || '');
    }
    // pass title to backend when available
    const payload = {
      esId,
      userPrompt: userPromptForCreate || configForm.userPrompt || '',
      userId: effectiveUserId.value
    };
    if (titleForCreate) payload.title = titleForCreate;
    const {success, sessionId, raw} = await aiService.createFileChatSession(payload);
    if (success) {
      currentSessionId.value = sessionId;
      sessions.value.unshift({
        id: sessionId,
        esId: esId || '',
        title: titleForCreate || '',
        raw: {...(raw || {}), userPrompt: userPromptForCreate || configForm.userPrompt || ''}
      });
      messages.value = [];
      nextTick(() => focusInput());
      persistLastSession();
      setTimeout(() => {
        if (esId) reloadSessions();
      }, 300);
    } else {
      ElMessage.error('创建会话失败');
    }
  } catch {
    ElMessage.error('创建会话异常');
  } finally {
    creatingSession.value = false;
  }
}

function quickNewSession() {
  if (streaming.value) return;
  // derive a safe title only from the current inputText — do NOT reuse previous session's title
  const makeTitle = (txt = '') => {
    const s = String(txt || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    const max = 80;
    return s.length > max ? (s.slice(0, max - 3) + '...') : s;
  };
  const derived = makeTitle(isRagMode.value ? (ceRef.value ? String(ceRef.value.innerText || '').replace(/\u200B/g, '') : '') : (inputText.value || ''));
  createNewSession('', derived);
}

async function reloadSessions() {
  const esForApi = effectiveEsId.value || `global:${effectiveUserId.value || 'anonymous'}`;
  // if(!esForApi){ sessions.value=[]; return; }
  loadingSessions.value = true;
  try {
    const {aiService} = await import('../../../services/aiService');
    const {list} = await aiService.listFileChatSessions({
      esId: esForApi,
      pageNo: 1,
      pageSize: 50,
      userId: effectiveUserId.value
    });
    if (list && list.length) {
      const cur = currentSessionId.value;
      // map local sessions for merging raw/title (use string keys)
      const localMap = new Map(sessions.value.map(s => [String(s.id), s]));
      // merge remote list with local raw/title when available
      let merged = list.map(s => ({
        ...s,
        raw: {...(s.raw || {}), ...(localMap.get(String(s.id))?.raw || {})},
        title: s.title || localMap.get(String(s.id))?.title || ''
      }));
      const remoteIds = new Set(list.map(s => String(s.id)));
      const extras = sessions.value.filter(s => !remoteIds.has(String(s.id)));
      if (cur && !remoteIds.has(String(cur))) {
        merged.unshift(extras.find(e => String(e.id) === String(cur)) || {id: cur, esId: esForApi, title: '', raw: {}});
      }
      extras.filter(e => String(e.id) !== String(cur)).forEach(e => merged.push(e));
      // dedupe while normalizing ids to string for comparison
      const uniq = [];
      const seen = new Set();
      for (const s of merged) {
        if (!s || s.id == null) continue;
        const sid = String(s.id);
        if (seen.has(sid)) continue;
        seen.add(sid);
        uniq.push(s);
      }
      sessions.value = uniq;
    }
  } catch (e) {
    console.warn('reload sessions failed', e);
  } finally {
    loadingSessions.value = false;
  }
}

async function switchSession(id) {
  if (id === currentSessionId.value) return;
  if (streaming.value) {
    const cont = await ElMessageBox.confirm('切换会话将终止当前回答，继续？', '提示', {type: 'warning'}).catch(() => false);
    if (!cont) return;
    stopStreaming();
  }
  currentSessionId.value = id;
  messages.value = [];
  await loadLatestForSwitch(id);
  persistLastSession();
}

async function loadLatestForSwitch(id) {
  try {
    const {aiService} = await import('../../../services/aiService');
    const {success, session, messages: history} = await aiService.getFileChatSessionDetail({
      sessionId: id,
      returnHistory: true,
      userId: effectiveUserId.value
    });
    if (success && session && session.id === id) {
      // 合并会话标题/原始信息
      const idx = sessions.value.findIndex(s => s.id === id);
      if (idx >= 0) {
        sessions.value[idx] = {
          ...sessions.value[idx],
          title: session.title || sessions.value[idx].title,
          raw: {...(sessions.value[idx].raw || {}), ...(session.raw || {})}
        };
      }
      messages.value = history || [];
      scrollSoon();
      return;
    }
    // Fallback: 若后端未提供按 sessionId 查询，则尽量加载该 esId 的最近一次，会话消息可能不是该 session
    const s = sessions.value.find(s => s.id === id);
    const esForApi = s?.esId || effectiveEsId.value || `global:${effectiveUserId.value || 'anonymous'}`;
    if (esForApi) {
      const {success: ok, session: latest, messages: hist} = await aiService.getLatestFileChatSession({
        esId: esForApi,
        returnHistory: true,
        userId: effectiveUserId.value
      });
      if (ok) {
        messages.value = (latest && latest.id === id) ? hist : [];
        scrollSoon();
      }
    }
  } catch (e) {
    console.warn('loadLatestForSwitch failed', e);
  }
}

function onEnterPress(e) {
  if (e.shiftKey) {
    if (isRagMode.value) {
      // 在 CE 中插入换行
      try {
        document.execCommand('insertLineBreak');
      } catch { /* ignore */
      }
    } else {
      // 在 textarea 中模拟换行（简单追加）
      inputText.value = (inputText.value || '') + '\n';
    }
    return;
  }
  sendMessage();
}

async function sendMessage() {
  if (streaming.value) return;
  const text = isRagMode.value ? buildTextFromCe() : inputText.value.trim();
  if (!text) return;
  if (!currentSessionId.value) {
    await createNewSession();
  }
  if (!currentSessionId.value) {
    ElMessage.error('会话创建失败');
    return;
  }
  // RAG 模式必须具备有效 esId
  if (chatTypeRef.value === 'rag' && !effectiveEsId.value) {
    ElMessage.error('RAG 模式缺少 esId，无法发送');
    return;
  }
  const userMsg = {
    id: `u_${Date.now()}`,
    sessionId: currentSessionId.value,
    role: 'user',
    content: text,
    parts: [text],
    status: 'done',
    createdAt: Date.now()
  };
  messages.value.push(userMsg);
  const aiMsg = {
    id: `a_${Date.now()}`,
    sessionId: currentSessionId.value,
    role: 'assistant',
    content: '',
    parts: [],
    status: 'streaming',
    createdAt: Date.now()
  };
  messages.value.push(aiMsg);
  if (isRagMode.value) {
    clearCe();
  } else {
    inputText.value = '';
  }
  scrollSoon();
  const cur = sessions.value.find(s => s.id === currentSessionId.value);
  if (cur && !cur.title) {
    cur.title = userMsg.content.slice(0, 20);
  }
  await streamAnswer(aiMsg, text);
}

async function streamAnswer(aiMsg, question) {
  streaming.value = true;
  // progressive renderer: collect deltas into aiMsg.parts, then flush parts -> content
  let flushTimer = 0;
  const FLUSH_INTERVAL = 80; // ms
  const clearForceFlush = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = 0;
    }
  };
  const scheduleForceFlush = () => {
    if (!flushTimer) flushTimer = window.setTimeout(() => {
      flushLines(true);
    }, FLUSH_INTERVAL);
  };
  const flushLines = (force = false) => {
    clearForceFlush();
    try {
      // Build content from parts to avoid duplication or ordering issues
      const newContent = Array.isArray(aiMsg.parts) ? aiMsg.parts.join('') : (aiMsg.content || '');
      // Only update if changed
      if (newContent !== aiMsg.content) {
        Object.assign(aiMsg, {content: newContent});
        // replace message entry to force reactivity
        try {
          const idx = messages.value.findIndex(m => m.id === aiMsg.id);
          if (idx >= 0) {
            const copy = {...aiMsg};
            messages.value.splice(idx, 1, copy);
            aiMsg = messages.value[idx];
          }
        } catch { /* ignore focus failure */
        }
        throttleScroll();
      }
    } finally {
      // schedule next flush if more parts may come
      if (!flushTimer && !force) scheduleForceFlush();
    }
  };
  const stopRenderer = () => {
    clearForceFlush();
  };

  try {
    // 根据 chatType 选择 esId 策略：rag 必须使用文档 esId；qa 允许使用 per-user 全局会话
    const esForApi = chatTypeRef.value === 'rag' ? (effectiveEsId.value || '') : (effectiveEsId.value || `global:${effectiveUserId.value || 'anonymous'}`);
    if (chatTypeRef.value === 'rag' && !esForApi) {
      throw new Error('RAG 模式缺少 esId');
    }
    const {aiService} = await import('../../../services/aiService');
    const controller = new AbortController();
    abortRef.value = controller;
    await aiService.streamFileChatMessage({
      sessionId: currentSessionId.value,
      esId: esForApi,
      content: question,
      useContext: useContext.value,
      topK: topK.value,
      maxContextChars: maxContextChars.value,
      userId: effectiveUserId.value,
      url: props.url,
      signal: controller.signal,
      onDelta: (delta) => {
        if (!delta) return;
        aiMsg.parts.push(delta);
        // schedule a flush to build content from parts
        scheduleForceFlush();
      },
      onDone: () => {
        flushLines(true);
        stopRenderer();
        aiMsg.status = 'done';
        streaming.value = false;
        abortRef.value = null;
        scrollSoon();
      },
      onError: (err) => {
        stopRenderer();
        if (err === 'aborted') {
          aiMsg.status = 'aborted';
        } else {
          aiMsg.status = 'error';
          aiMsg.errorMsg = err;
        }
        streaming.value = false;
        abortRef.value = null;
      }
    });
  } catch (e) {
    stopRenderer();
    aiMsg.status = 'error';
    aiMsg.errorMsg = e.message;
    streaming.value = false;
    abortRef.value = null;
  }
  nextTick(() => focusInput());
}

function stopStreaming() {
  if (abortRef.value) {
    try {
      abortRef.value.abort();
    } catch { /* ignore abort error */
    }
  }
  // 将当前处于流式生成中的助手消息，标记为已中断并给出提示语
  try {
    const lastStreaming = [...messages.value].reverse().find(m => m.role === 'assistant' && m.status === 'streaming');
    if (lastStreaming) {
      lastStreaming.status = 'aborted';
      lastStreaming.errorMsg = 'aborted';
      // 清空残留的增量片段，直接给出中断提示内容
      if (Array.isArray(lastStreaming.parts)) lastStreaming.parts.length = 0;
      lastStreaming.content = '用户中断了本次对话';
    }
  } catch { /* ignore */
  }
  // 确保可继续输入
  streaming.value = false;
  nextTick(() => focusInput());
}

function retryMessage(msg) {
  if (streaming.value) return;
  if (msg.role !== 'assistant') return;
  const idx = messages.value.findIndex(m => m.id === msg.id);
  if (idx > 0) {
    const userBefore = [...messages.value].slice(0, idx).reverse().find(m => m.role === 'user');
    if (userBefore) {
      const newAi = {
        id: `a_${Date.now()}`,
        sessionId: currentSessionId.value,
        role: 'assistant',
        content: '',
        parts: [],
        status: 'streaming',
        createdAt: Date.now()
      };
      messages.value.push(newAi);
      streamAnswer(newAi, userBefore.content);
    }
  }
}

function resendMessage(userMsg) {
  if (streaming.value) return;
  if (userMsg.role !== 'user') return;
  const newAi = {
    id: `a_${Date.now()}`,
    sessionId: currentSessionId.value,
    role: 'assistant',
    content: '',
    parts: [],
    status: 'streaming',
    createdAt: Date.now()
  };
  messages.value.push(newAi);
  streamAnswer(newAi, userMsg.content);
}

function editMessage(userMsg) {
  if (streaming.value) return;
  if (userMsg.role !== 'user') return;
  if (isRagMode.value) setCeText(userMsg.content); else inputText.value = userMsg.content;
  nextTick(() => focusInput());
}

async function deleteMessage(m) {
  if (!m) return;
  if (streaming.value && m.status === 'streaming') return;
  const idx = messages.value.findIndex(x => x.id === m.id);
  // determine backend message id candidate
  const candidate = (m.messageId !== undefined && m.messageId !== null) ? m.messageId : m.id;
  const isNumericId = candidate !== undefined && candidate !== null && /^\d+$/.test(String(candidate));
  if (isNumericId) {
    const ok = await ElMessageBox.confirm('确认删除该消息？', '提示', {type: 'warning'}).catch(() => false);
    if (!ok) return;
    try {
      const {aiService} = await import('../../../services/aiService');
      const res = await aiService.deleteFileChatMessage(String(candidate), effectiveUserId.value);
      if (res && res.success) {
        if (idx > -1) messages.value.splice(idx, 1);
        ElMessage.success('已删除');
      } else {
        ElMessage.error('删除失败');
      }
    } catch {
      ElMessage.error('删除异常');
    }
  } else {
    // local-only message (e.g. temporary client id), just remove from UI
    if (idx > -1) messages.value.splice(idx, 1);
  }
}

function copyMessage(m) {
  try {
    navigator.clipboard?.writeText(m.content);
    ElMessage.success('已复制');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = m.content;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      ElMessage.success('已复制');
    } catch {
      ElMessage.error('复制失败');
    }
    document.body.removeChild(ta);
  }
}

async function deleteSession(id) {
  const ok = await ElMessageBox.confirm('确认删除该会话？', '提示', {type: 'warning'}).catch(() => false);
  if (!ok) return;
  try {
    const {aiService} = await import('../../../services/aiService');
    const {success} = await aiService.deleteFileChatSession(id, effectiveUserId.value);
    if (success) {
      sessions.value = sessions.value.filter(s => s.id !== id);
      if (id === currentSessionId.value) {
        currentSessionId.value = sessions.value[0]?.id || null;
        messages.value = [];
      }
      ElMessage.success('已删除');
    } else ElMessage.error('删除失败');
  } catch {
    ElMessage.error('删除异常');
  }
}

async function confirmClearAll() {
  const ok = await ElMessageBox.confirm('确认清空该文件所有会话？', '清空', {type: 'warning'}).catch(() => false);
  if (!ok) return;
  const esId = effectiveEsId.value;
  if (!esId) {
    ElMessage.info('当前为百科模式，无文件会话可清空');
    return;
  }
  try {
    const {aiService} = await import('../../../services/aiService');
    const {success} = await aiService.clearFileChatSessions(esId, effectiveUserId.value);
    if (success) {
      ElMessage.success('已清空');
      resetAll();
      await ensureSession();
      await reloadSessions();
    } else ElMessage.error('清空失败');
  } catch {
    ElMessage.error('清空异常');
  }
}

async function confirmClearCurrent() {
  const ok = await ElMessageBox.confirm('确认清空当前会话消息？\n（保留会话元信息）', '清空当前', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).catch(() => false);
  if (!ok) return;
  const oldTitle = currentSessionTitle.value;
  const oldModel = modelDisplayName.value;
  const curId = currentSessionId.value;
  if (!curId) return;
  const esId = effectiveEsId.value;
  // Try to clear on server whenever we have a sessionId; fall back to local clear if server not reachable.
  // (Previously we skipped server call when no esId; change to always attempt server-side clear if session exists.)
  try {
    const {aiService} = await import('../../../services/aiService');
    // prefer clear-history API which preserves session meta
    const res = await aiService.clearFileChatSessionHistory(curId, effectiveUserId.value);
    if (res && res.success) {
      messages.value = [];
      ElMessage.success('已清空');
      // refresh sessions list to reflect any server-side changes
      await reloadSessions();
      return;
    }
    // fallback: if clear-history not supported or failed, try delete+recreate session as before
    const del = await aiService.deleteFileChatSession(curId, effectiveUserId.value);
    if (!del || !del.success) {
      // if deletion also failed, try local clear as last resort
      messages.value = [];
      ElMessage.error('清空失败（已本地清空）');
      return;
    }
    const {success, sessionId, raw} = await aiService.createFileChatSession({
      esId,
      userPrompt: configForm.userPrompt || '',
      userId: effectiveUserId.value
    });
    if (success) {
      currentSessionId.value = sessionId;
      sessions.value = sessions.value.filter(s => s.id !== curId);
      sessions.value.unshift({
        id: sessionId,
        esId,
        title: oldTitle,
        raw: {modelName: oldModel, ...(raw || {}), userPrompt: configForm.userPrompt || ''}
      });
      messages.value = [];
      persistLastSession();
      ElMessage.success('已清空');
      reloadSessions();
    } else {
      ElMessage.error('清空失败');
    }
  } catch {
    ElMessage.error('清空异常');
  }
}

function exportConversation() {
  const data = {
    sessionId: currentSessionId.value,
    messages: messages.value.map(m => ({role: m.role, content: m.content}))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation_${currentSessionId.value || 'new'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function scrollSoon() {
  nextTick(() => scrollToBottom());
}

function scrollToBottom() {
  messageListRef.value?.scrollToBottom?.();
}

function scrollToTop() {
  messageListRef.value?.scrollToTop?.();
}

function onChildScrollState(state) {
  try {
    if (!state) return;
    childNearBottom.value = !!state.nearBottom;
  } catch { /* ignore */
  }
}

let scrollThrottleTimer = null;

function throttleScroll() {
  if (scrollThrottleTimer) return;
  scrollThrottleTimer = requestAnimationFrame(() => {
    scrollThrottleTimer = null;
    scrollToBottom();
  });
}

function beginEditTitle() {
  const cur = sessions.value.find(s => s.id === currentSessionId.value);
  if (!cur) return;
  editableTitle.value = cur.title || '';
  editingTitle.value = true;
  nextTick(() => {
    const el = document.querySelector('.title-edit-input input');
    el && el.focus();
  });
}

function saveTitle() {
  const cur = sessions.value.find(s => s.id === currentSessionId.value);
  if (cur) {
    cur.title = editableTitle.value.trim();
  }
  editingTitle.value = false;
}

// 默认开场白问题（保留简版助推）
const starterQuestions = ['这份文档的核心要点是什么？', '帮我生成一个简短的总结'];

function clickStarter(q) {
  if (streaming.value) return;
  if (isRagMode.value) setCeText(q); else inputText.value = q;
  sendMessage();
}

// ---------- RAG CE 工具函数 ----------
function focusInput() {
  if (isRagMode.value) {
    nextTick(() => {
      try {
        ceRef.value?.focus?.();
      } catch { /* ignore */
      }
    });
  } else {
    nextTick(() => {
      try {
        inputRef.value?.focus?.();
      } catch { /* ignore */
      }
    });
  }
}

function onCeInput() {
  normalizeCe();
  updateMarkCount();
  updateCeText();
}

function onCePaste(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text') || '';
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) try {
      document.execCommand('insertLineBreak');
    } catch { /* ignore */
    }
    try {
      document.execCommand('insertText', false, lines[i]);
    } catch { /* ignore */
    }
  }
  updateMarkCount();
  updateCeText();
}

function updateHasSelection() {
  if (!isRagMode.value) return;
  const sel = window.getSelection();
  const ok = !!sel && !sel.isCollapsed && ceRef.value && ceRef.value.contains(sel.anchorNode);
  hasSelection.value = ok;
  if (ok) {
    try {
      lastRange = sel.getRangeAt(0).cloneRange();
    } catch { /* ignore */
    }
  }
}

function markSelection(type) {
  if (!isRagMode.value) return;
  let sel = window.getSelection();
  // 若因点击按钮导致选区丢失，尝试恢复
  if ((!sel || sel.isCollapsed) && lastRange && ceRef.value && ceRef.value.contains(lastRange.startContainer)) {
    sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(lastRange);
  }
  if (!sel || sel.isCollapsed) return;
  if (!ceRef.value || !ceRef.value.contains(sel.anchorNode)) return;
  const range = sel.getRangeAt(0);
  lastRange = range.cloneRange();
  unwrapMarksInRange(range);
  const span = document.createElement('span');
  span.className = `mark ${type === 'keyword' ? 'kw' : 'kc'}`;
  span.setAttribute('data-type', type);
  try {
    range.surroundContents(span);
  } catch {
    const frag = range.cloneContents();
    span.appendChild(frag);
    range.deleteContents();
    range.insertNode(span);
  }
  // place caret after
  sel.removeAllRanges();
  const after = document.createTextNode('\u200B');
  span.parentNode && span.parentNode.insertBefore(after, span.nextSibling);
  const r = document.createRange();
  r.setStart(after, 1);
  r.collapse(true);
  sel.addRange(r);
  updateMarkCount();
  updateHasSelection();
  updateCeText();
}

function clearMarks() {
  if (!isRagMode.value) return;
  let sel = window.getSelection();
  // 如果选区因点击按钮丢失，尝试恢复上一选区
  if ((!sel || sel.isCollapsed) && lastRange && ceRef.value && ceRef.value.contains(lastRange.startContainer)) {
    sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(lastRange);
  }
  if (sel && !sel.isCollapsed && ceRef.value && ceRef.value.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0);
    unwrapMarksInRange(range);
  } else {
    const root = ceRef.value;
    if (!root) return;
    const text = String(root.innerText || '').replace(/\u200B/g, '');
    root.innerHTML = '';
    if (text) root.appendChild(document.createTextNode(text));
  }
  updateMarkCount();
  updateHasSelection();
  updateCeText();
}

function unwrapMarksInRange(range) {
  const root = ceRef.value;
  if (!root) return;
  const common = range.commonAncestorContainer;
  const base = common.nodeType === 1 ? common : common.parentNode;
  const walker = document.createTreeWalker(base, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_SKIP;
      if (!root.contains(node)) return NodeFilter.FILTER_SKIP;
      if (!node.classList.contains('mark')) return NodeFilter.FILTER_SKIP;
      const nr = document.createRange();
      nr.selectNodeContents(node);
      return (nr.compareBoundaryPoints(Range.END_TO_START, range) < 0 && nr.compareBoundaryPoints(Range.START_TO_END, range) > 0)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  const toUnwrap = [];
  let n;
  while ((n = walker.nextNode())) toUnwrap.push(n);
  toUnwrap.forEach(unwrapElement);
}

function unwrapElement(el) {
  const p = el.parentNode;
  if (!p) return;
  while (el.firstChild) p.insertBefore(el.firstChild, el);
  p.removeChild(el);
}

function buildTextFromCe() {
  const root = ceRef.value;
  if (!root) return '';
  const parts = [];
  const blockBreak = () => {
    if (parts.length && parts[parts.length - 1] !== '\n') parts.push('\n');
  };
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(String(node.nodeValue || '').replace(/\u200B/g, ''));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node;
    if (el.classList && el.classList.contains('mark')) {
      const type = el.getAttribute('data-type');
      const before = type === 'keyword' ? '<keyword>' : '<keycontent>';
      const after = type === 'keyword' ? '</keyword>' : '</keycontent>';
      parts.push(before);
      Array.from(el.childNodes).forEach(walk);
      parts.push(after);
      return;
    }
    const tag = el.tagName;
    if (tag === 'BR') {
      parts.push('\n');
      return;
    }
    if (tag === 'DIV' || tag === 'P') {
      const len0 = parts.length;
      Array.from(el.childNodes).forEach(walk);
      if (parts.length > len0) blockBreak(); else parts.push('\n');
      return;
    }
    Array.from(el.childNodes).forEach(walk);
  };
  Array.from(root.childNodes).forEach(walk);
  let text = parts.join('');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[\s\u200B]+$/g, '');
  return text;
}

function clearCe() {
  const root = ceRef.value;
  if (!root) return;
  root.innerHTML = '';
  updateMarkCount();
  updateHasSelection();
  updateCeText();
}

function updateMarkCount() {
  const root = ceRef.value;
  markCount.value = root ? root.querySelectorAll('.mark').length : 0;
}

function setCeText(text) {
  const root = ceRef.value;
  if (!root) return;
  root.innerText = text || '';
  updateMarkCount();
  updateHasSelection();
  updateCeText();
}

function updateCeText() {
  const root = ceRef.value;
  ceText.value = root ? String(root.innerText || '').replace(/\u200B/g, '') : '';
}

function normalizeCe() {
  const root = ceRef.value;
  if (!root) return;
  const marks = root.querySelectorAll('.mark');
  marks.forEach((m) => {
    const txt = m.innerText.replace(/\u200B/g, '').trim();
    if (!txt) {
      unwrapElement(m);
    }
  });
}
</script>
<style scoped>
/* copied styles from original DocumentQA */
.file-chat-root {
  display: flex;
  height: 100%;
  background: #fff;
  color: #303133;
  font-size: 14px;
}

.file-chat-root.sessions-collapsed .sessions-pane {
  display: none;
}

.file-chat-root.sessions-collapsed .chat-main {
  flex: 1;
}

.chat-title .toggle-sessions {
  margin-right: 4px;
}

.chat-title .title-text {
  max-width: 360px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sessions-pane {
  width: 230px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.sessions-header {
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  height: 50px;
  line-height: 50px;
}

.sessions-header .title {
  font-weight: 600;
  font-size: 14px;
}

.sessions-header .actions {
  display: flex;
  gap: 6px;
}

.sessions-list {
  flex: 1;
  overflow: auto;
  padding: 4px 0;
}

.session-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background .15s;
}

session-item:hover {
  background: #f0f2f5;
}

.session-item.active {
  background: #e7f3ff;
}

.session-item .name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.session-item .ops .el-button {
  padding: 0 4px;
}

.session-item .ops {
  display: flex;
  opacity: 0;
  transition: opacity .15s;
}

.session-item:hover .ops {
  opacity: 1;
}

.sessions-list .empty {
  padding: 20px 12px;
  color: #909399;
  font-size: 13px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  height: 50px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header-actions .el-button {
  padding: 4px;
}

.chat-header-actions .model-config-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
}

.chat-header-actions .model-config-btn .model-name {
  max-width: 140px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-header-actions .btn-clear-current {
  color: #606266;
  border-color: #dcdfe6;
  background: #fff;
}

.chat-header-actions .btn-clear-current:hover {
  background: #f5f7fa;
  color: #303133;
}

.chat-header-actions .btn-return {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
  padding: 6px 12px;
  border-radius: 16px;
}

.chat-header-actions .btn-return:hover {
  background: #337ecc;
  border-color: #337ecc;
}

.config-form :deep(.el-input), .config-form :deep(.el-select), .config-form :deep(.el-textarea) {
  width: 100%;
}

.input-area {
  border-top: 1px solid #e5e7eb;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
}

.input-overlay {
  position: relative;
}

.inline-control {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
}

.inline-control.left {
  left: 12px;
  bottom: 12px;
}

.inline-control.right {
  right: 12px;
  bottom: 12px;
}

.input-overlay :deep(textarea.el-textarea__inner) {
  padding-bottom: 40px;
}

.input-overlay.rag-mode {
  min-height: 88px;
}

.ce-wrapper {
  position: relative;
}

.ce-input {
  min-height: 88px;
  max-height: 260px;
  overflow: auto;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 10px 12px 40px;
  line-height: 1.6;
  outline: none;
}

.ce-input:empty:before {
  content: attr(data-placeholder);
  color: #999;
}

.ce-input :deep(.mark) {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  background: #EEF2FF;
  color: #3F5BF6;
  border: 1px solid rgba(63, 91, 246, 0.18);
  box-shadow: none;
  line-height: 1.4;
}

.ce-input :deep(.mark.kw) {
  background: #FFF7E6;
  color: #AD6800;
  border-color: rgba(173, 104, 0, 0.2);
}

.ce-input :deep(.mark.kc) {
  background: #EEF2FF;
  color: #3F5BF6;
  border-color: rgba(63, 91, 246, 0.18);
}

.ce-input :deep(.mark:hover) {
  border-color: rgba(63, 91, 246, 0.28);
}

.tag-tools-sep {
  color: #c0c4cc;
}

.tag-btn .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.tag-btn .dot.kw {
  background: #faad14;
}

.tag-btn .dot.kc {
  background: #40a9ff;
}

.header-new-session {
  margin-left: 8px;
}

.starter-container {
  padding: 32px 40px 12px;
  color: #606266;
}

.starter-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.starter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.starter-item {
  cursor: pointer;
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  background: #f8f9fa;
  font-size: 13px;
  line-height: 1.4;
  transition: all .15s;
  max-width: 220px;
}

.starter-item:hover {
  background: #edf5ff;
  border-color: #c0d4f5;
  color: #409eff;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .file-chat-root {
    flex-direction: column;
  }

  .sessions-pane {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
  }

  .sessions-list {
    display: flex;
    flex-wrap: nowrap;
  }

  .session-item {
    min-width: 160px;
    border-right: 1px solid #e5e7eb;
  }
}

/* parent-level scroll-to-bottom button to avoid clipping by child's scroll area */
.scroll-to-bottom-parent {
  position: fixed;
  right: 28px;
  bottom: 96px;
  padding: 6px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, .08);
  z-index: 1200;
  background: transparent;
  color: inherit;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
