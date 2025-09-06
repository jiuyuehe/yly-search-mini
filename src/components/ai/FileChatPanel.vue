<template>
  <div class="file-chat-root" :class="{ 'sessions-collapsed': !showSessions }">
    <!-- Sidebar sessions -->
    <aside class="sessions-pane" v-show="showSessions">
      <div class="sessions-header">
        <div class="title">会话</div>
        <div class="actions">
          <el-tooltip content="新建会话" placement="bottom"><el-button size="small" circle @click="createNewSession" :disabled="streaming"><el-icon><Plus /></el-icon></el-button></el-tooltip>
          <el-tooltip content="清空全部" placement="bottom"><el-button size="small" circle @click="confirmClearAll" :disabled="streaming || !sessions.length"><el-icon><Delete /></el-icon></el-button></el-tooltip>
          <el-tooltip content="刷新" placement="bottom"><el-button size="small" circle @click="reloadSessions" :loading="loadingSessions"><el-icon><Refresh /></el-icon></el-button></el-tooltip>
        </div>
      </div>
      <div class="sessions-list" v-loading="loadingSessions">
        <div v-if="!sessions.length && !loadingSessions" class="empty">暂无会话</div>
        <div v-for="s in sessions" :key="s.id" class="session-item" :class="{active: s.id===currentSessionId}" @click="switchSession(s.id)">
          <div class="name" :title="sessionDisplayTitle(s)">{{ sessionDisplayTitle(s) }}</div>
          <div class="ops" @click.stop>
            <el-tooltip content="删除" placement="top">
              <el-button class="del-btn" size="small" text @click="deleteSession(s.id)" :disabled="streaming"><el-icon><Close /></el-icon></el-button>
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
            <el-icon v-if="showSessions"><ArrowLeft /></el-icon>
            <el-icon v-else><Menu /></el-icon>
          </el-button>
      <el-button size="small" text v-if=" $attrs['show-return']" @click="$emit('return-to-search')">返回搜索</el-button>
          <span v-if="!editingTitle" class="title-text" @dblclick="beginEditTitle" :title="currentSessionTitle">{{ currentSessionTitle || '新建会话' }}<span v-if="messages.length"> ({{ messages.length }})</span></span>
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
          <el-button v-if="!showSessions" class="header-new-session" size="small" circle :disabled="streaming" @click="quickNewSession">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        <div class="chat-header-actions">
          <el-button class="model-config-btn" size="small" type="primary" bg plain @click="openConfig">
            <span class="model-name">{{ modelDisplayName || '配置模型' }}</span>
            <el-icon class="ml-4"><Setting /></el-icon>
          </el-button>
          <el-tooltip content="导出会话" placement="bottom">
            <el-button size="small" circle @click="exportConversation" :disabled="!messages.length">
              <el-icon><Download /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="回到顶部" placement="bottom">
            <el-button size="small" circle @click="scrollToTop" :disabled="!messages.length">
              <el-icon><ArrowLeft style="transform:rotate(90deg);" /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="清空当前会话" placement="bottom">
            <el-button size="small" circle type="danger" @click="confirmClearCurrent" :disabled="!messages.length || streaming">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
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
      />

      <div v-if="!messages.length && !currentSessionId && !streaming" class="starter-container">
        <div class="starter-title">快速开始</div>
        <div class="starter-list">
          <div class="starter-item" v-for="q in starterQuestions" :key="q" @click="clickStarter(q)">{{ q }}</div>
        </div>
      </div>

      <!-- Input area -->
      <footer class="input-area">
        <div class="input-box">
          <el-input
            ref="inputRef"
            v-model="inputText"
            :autosize="{minRows:3,maxRows:10}"
            type="textarea"
            placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
            @keydown.enter.prevent="onEnterPress"
            :disabled="creatingSession"
          />
          <div class="input-toolbar">
            <div class="left">
              <el-checkbox v-model="useContext" :disabled="streaming">上下文</el-checkbox>
            </div>
            <div class="right">
              <el-button size="small" @click="stopStreaming" v-if="streaming" type="warning">停止</el-button>
              <el-button size="small" type="primary" @click="sendMessage" :disabled="!canSend">发送</el-button>
            </div>
          </div>
        </div>
      </footer>
    </section>
  </div>

  <!-- 参数配置弹窗 -->
  <el-dialog v-model="showConfig" title="会话设置" width="520px">
    <el-form label-width="130px" class="config-form" :model="configDraft">
      <el-form-item label="系统模型">
        <el-select v-model="configForm.modelId" placeholder="选择模型" filterable :loading="modelsLoading">
          <el-option v-for="m in models" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
       <el-form-item label="用户提示词">
        <el-input type="textarea" :rows="3" v-model="configForm.systemMessage" placeholder="为本会话设定自定义提示词或风格提示" />
      </el-form-item>
      <el-form-item label="温度 temperature">
        <el-input-number v-model="configForm.temperature" :min="0" :max="2" :step="0.1" :precision="2" />
      </el-form-item>
      <el-form-item label="回复上限 tokens">
        <el-input-number v-model="configForm.maxTokens" :min="0" :max="8192" />
      </el-form-item>
      <el-form-item label="上下文条数">
        <el-input-number v-model="configForm.maxContexts" :min="0" :max="20" />
      </el-form-item>
      <el-form-item label="TopK(检索)">
        <el-input-number v-model="configForm.topK" :min="1" :max="10" />
      </el-form-item>
      <el-form-item label="最大上下文字符">
        <el-input-number v-model="configForm.maxContextChars" :min="1000" :max="50000" step="500" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showConfig=false">取消</el-button>
      <el-button type="primary" :loading="savingConfig" @click="applyConfig">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, onMounted, watch, nextTick, computed, reactive, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Refresh, Close, ArrowLeft, Menu, Setting, Download } from '@element-plus/icons-vue';
import FileChatMessageList from './FileChatMessageList.vue';
import { getUserInfo } from '../../services/api';
import { resolveEsId } from '../../utils/esid';

const props = defineProps({ file: { type:Object, required:false, default:null }, fileId: { type:String, required:false }, esId:{ type:String, default:'' }, userId:{ type:[String,Number], default:'' }, expandSessions: { type:Boolean, default:false } });
const showSessions = ref(false);
function toggleSessions(){
  showSessions.value = !showSessions.value;
  if(showSessions.value){ reloadSessions(); }
}

const sessions = ref([]);
const currentSessionId = ref(null); // 不自动创建，首次发送时创建
const messages = ref([]);
const inputText = ref('');
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
  userPrompt:'',
  modelId:'',
  temperature:1,
  maxTokens:1024,
  maxContexts:10,
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
  maxContextChars: configForm.maxContextChars,
  systemMessage: ''
});
// Trace currentSessionId and sessions mutations to find unexpected resets
// (no debug watches)
async function loadModels(){ modelsLoading.value=true; try { const { aiService } = await import('../../services/aiService'); models.value = await aiService.getChatModels({ userId: effectiveUserId.value }); } finally { modelsLoading.value=false; } }
function fillConfigDraftFromSession(){
  const s = sessions.value.find(s=>s.id===currentSessionId.value);
  if(!s) return;
  // copy session raw into draft; do not modify configForm yet
  configDraft.userPrompt = s.raw?.userPrompt || '';
  configDraft.modelId = s.raw?.modelId || s.raw?.model || '';
  configDraft.temperature = s.raw?.temperature ?? 1;
  configDraft.maxTokens = s.raw?.maxTokens ?? 1024;
  configDraft.maxContexts = s.raw?.maxContexts ?? 10;
  configDraft.topK = topK.value;
  configDraft.maxContextChars = maxContextChars.value;
  configDraft.systemMessage = s.raw?.systemMessage || '';
}
async function openConfig(){
  fillConfigDraftFromSession();
  await loadModels();
  showConfig.value=true;
}
async function applyConfig(){
  savingConfig.value=true;
  try {
    // only persist after user confirms in dialog
    topK.value = configDraft.topK;
    maxContextChars.value = configDraft.maxContextChars;
    const { aiService } = await import('../../services/aiService');
    if(currentSessionId.value){
      const { success } = await aiService.updateFileChatSession({
        sessionId: currentSessionId.value,
        modelId: configDraft.modelId,
        temperature: configDraft.temperature,
        maxTokens: configDraft.maxTokens,
        maxContexts: configDraft.maxContexts,
        userId: effectiveUserId.value
      });
      let userPromptUpdated = true;
      if(configDraft.userPrompt !== (sessions.value.find(s=>s.id===currentSessionId.value)?.raw?.userPrompt||'')){
        const r = await aiService.updateFileChatUserPrompt({ sessionId: currentSessionId.value, userPrompt: configDraft.userPrompt, userId: effectiveUserId.value });
        userPromptUpdated = r.success;
      }
      if(success && userPromptUpdated){
        // apply draft to persistent configForm and session raw
        configForm.userPrompt = configDraft.userPrompt;
        configForm.modelId = configDraft.modelId;
        configForm.temperature = configDraft.temperature;
        configForm.maxTokens = configDraft.maxTokens;
        configForm.maxContexts = configDraft.maxContexts;
        configForm.topK = configDraft.topK;
        configForm.maxContextChars = configDraft.maxContextChars;
        const s = sessions.value.find(s=>s.id===currentSessionId.value);
        if(s){ s.raw = { ...(s.raw||{}), userPrompt: configDraft.userPrompt, modelId: configDraft.modelId, temperature: configDraft.temperature, maxTokens: configDraft.maxTokens, maxContexts: configDraft.maxContexts, systemMessage: configDraft.systemMessage }; }
        ElMessage.success('已保存');
      } else {
        ElMessage.error('保存失败');
      }
    }
    showConfig.value=false;
  } finally { savingConfig.value=false; }
}

const internalUserId = ref('');
function resolveUserId(){ if(props.userId){ internalUserId.value=String(props.userId); return; } try { const info = getUserInfo(); const uid = info?.userId || info?.id || info?.uid || ''; if(uid) internalUserId.value=String(uid); } catch { /* ignore */ } }
const effectiveUserId = computed(()=> props.userId || internalUserId.value || '');
const abortRef = ref(null);
const messageListRef = ref(null);
const editingTitle = ref(false);
const editableTitle = ref('');
const recentQuestions = ref([]);

// 统一解析 esId（可为空：百科模式）
const effectiveEsId = computed(()=> resolveEsId(props.file, props.esId || props.fileId) || '');
// encyclopedia/global mode: 不强制要求 esId
const canSend = computed(()=> !streaming.value && inputText.value.trim().length>0 && currentSessionId.value);
const currentSessionTitle = computed(()=>{ const s = sessions.value.find(s=>s.id===currentSessionId.value); if(!s) return ''; if(s.title) return s.title; const firstUser = messages.value.find(m=>m.role==='user'); return firstUser ? firstUser.content.slice(0,20) : `会话 ${s.id}`; });

// utility: derive a concise title from a text (used for new sessions)
function makeTitle(txt=''){
  const s = String(txt||'').replace(/\s+/g,' ').trim();
  if(!s) return '';
  const max = 80;
  return s.length>max? (s.slice(0,max-3)+'...') : s;
}
const modelDisplayName = computed(()=>{ const s = sessions.value.find(s=>s.id===currentSessionId.value); if(!s) return ''; return s.raw?.modelName || s.raw?.model || ''; });
function sessionDisplayTitle(s){ return s.title || (s.raw?.title) || (s.id?`会话 ${s.id}`:'未命名'); }
function loadRecentQuestions(){ const es = effectiveEsId.value || 'global'; const key = `fileChat:recentQuestions:${es}`; try { const arr = JSON.parse(localStorage.getItem(key)||'[]'); if(Array.isArray(arr)) recentQuestions.value=arr; } catch { /* ignore */ } }
function pushRecentQuestion(q){ if(!q) return; const es = effectiveEsId.value || 'global'; const key = `fileChat:recentQuestions:${es}`; const list = [...recentQuestions.value.filter(i=>i!==q)]; list.unshift(q); if(list.length>10) list.length=10; recentQuestions.value=list; try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignore */ } }
function persistLastSession(){ const es = effectiveEsId.value || 'global'; if(!currentSessionId.value) return; try { localStorage.setItem(`fileChat:lastSession:${es}`, currentSessionId.value); } catch { /* ignore */ } }
function loadPersistedLastSession(){ const es = effectiveEsId.value || 'global'; try { return localStorage.getItem(`fileChat:lastSession:${es}`); } catch { return null; } }
const inputRef = ref(null);
async function init(){ resolveUserId(); loadRecentQuestions(); if(effectiveEsId.value){ await loadLatest(); await reloadSessions(); } bindEsc(); }
function bindEsc(){ window.addEventListener('keydown', escHandler); window.addEventListener('keydown', shortcutHandler); }
function escHandler(e){ if(e.key==='Escape' && streaming.value){ stopStreaming(); } }
function shortcutHandler(e){ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='n'){ e.preventDefault(); quickNewSession(); } }
onMounted(()=>{ init(); });
// 监听百科问答触发事件
window.addEventListener('encyclopedia-qa', handleEncyclopediaQA)
onMounted(()=>{ /* already calling init above */ })
onBeforeUnmount(()=>{ window.removeEventListener('encyclopedia-qa', handleEncyclopediaQA) })
watch(()=>props.esId, ()=>{ resetAll(); init(); });
watch(()=>props.fileId, ()=>{ resetAll(); init(); });
watch(()=>props.file, ()=>{ resetAll(); init(); });
// allow parent to request sessions panel expansion
watch(() => props.expandSessions, (v) => {
  if (v) {
    showSessions.value = true;
    reloadSessions().catch(()=>{});
  }
});

// expose ability for parent to trigger reload sessions
function loadSessions() { return reloadSessions(); }
defineExpose({ askQuestion, loadSessions });

// expose programmatic ask function to parent via ref
function askQuestion(q) {
  if (!q || !String(q).trim()) return;
  inputText.value = String(q).trim();
  // ensure session exists then send
  return (async () => {
    // derive a short title from the question to use as session title on first create
    const makeTitle = (txt='')=>{
      const s = String(txt||'').replace(/\s+/g,' ').trim();
      if(!s) return '';
      const max = 80;
      return s.length>max? (s.slice(0,max-3)+'...') : s;
    };
    const titleForCreate = makeTitle(q);
    if (!currentSessionId.value) await createNewSession(inputText.value, titleForCreate);
    // small tick to ensure session creation flows
    await nextTick();
    if (!currentSessionId.value) return false;
    await sendMessage();
    return true;
  })();
}

function resetAll(){ sessions.value=[]; currentSessionId.value=null; messages.value=[]; }
async function loadLatest(){
  const esId = effectiveEsId.value;
  if(!esId) return;
  const stored = loadPersistedLastSession();
  try {
    const { aiService } = await import('../../services/aiService');
    const { success, session, messages:history } = await aiService.getLatestFileChatSession({ esId, returnHistory:true, userId: effectiveUserId.value });
  // loadLatest fetched
    if(success && session){
      // merge with any local session info to preserve raw/config fields
      const local = sessions.value.find(s=>s.id===session.id) || {};
      const merged = { ...session, raw: { ...(session.raw||{}), ...(local.raw||{}) }, title: session.title || local.title || '' };
  // loadLatest merged
      currentSessionId.value = merged.id;
      sessions.value = [merged];
      messages.value = history;
      scrollSoon();
      if(stored && stored!==merged.id){
        const localStored = sessions.value.find(s=>s.id===stored) || { id: stored, esId, title:'', raw:{} };
        sessions.value.push(localStored);
      }
    }
  } catch(err){
    console.warn('加载会话失败', err);
  }
}

async function ensureSession(){ /* 延迟创建：不在初始化阶段自动创建 */ }
async function createNewSession(userPromptForCreate='', titleForCreate=''){
  if(creatingSession.value) return;
  const esId = effectiveEsId.value || undefined;
  creatingSession.value=true;
  try {
    const { aiService } = await import('../../services/aiService');
    // when no explicit title provided, use the current inputText (first user input) as default title
    if(!titleForCreate){
      titleForCreate = makeTitle(inputText.value || userPromptForCreate || '');
    }
    // pass title to backend when available
    const payload = { esId, userPrompt: userPromptForCreate || configForm.userPrompt || '', userId: effectiveUserId.value };
    if(titleForCreate) payload.title = titleForCreate;
    const { success, sessionId, raw } = await aiService.createFileChatSession(payload);
    if(success){
      currentSessionId.value = sessionId;
      sessions.value.unshift({ id: sessionId, esId: esId || '', title: titleForCreate || '', raw:{ ...(raw||{}), userPrompt: userPromptForCreate || configForm.userPrompt || '' } });
      messages.value = [];
      showSessions.value = false;
      nextTick(()=> inputRef.value?.focus?.());
      persistLastSession();
      setTimeout(()=>{ if(esId) reloadSessions(); }, 300);
    } else { ElMessage.error('创建会话失败'); }
  } catch{ ElMessage.error('创建会话异常'); } finally { creatingSession.value=false; }
}
function quickNewSession(){ if(streaming.value) return; 
  // derive a safe title only from the current inputText — do NOT reuse previous session's title
  const makeTitle = (txt='')=>{
    const s = String(txt||'').replace(/\s+/g,' ').trim();
    if(!s) return '';
    const max = 80;
    return s.length>max? (s.slice(0,max-3)+'...') : s;
  };
  const derived = makeTitle(inputText.value || '');
  createNewSession('', derived);
}
async function reloadSessions(){
  const esId = effectiveEsId.value;
  // if(!esId){ sessions.value=[]; return; }
  loadingSessions.value=true;
  try {
    const { aiService } = await import('../../services/aiService');
    const { list } = await aiService.listFileChatSessions({ esId, pageNo:1, pageSize:50, userId: effectiveUserId.value });
    if(list && list.length){
      const cur = currentSessionId.value;
      // map local sessions for merging raw/title
      const localMap = new Map(sessions.value.map(s=>[s.id, s]));
      // merge remote list with local raw/title when available
      let merged = list.map(s => ({
        ...s,
        raw: { ...(s.raw||{}), ...(localMap.get(s.id)?.raw||{}) },
        title: s.title || localMap.get(s.id)?.title || ''
      }));
      const remoteIds = new Set(list.map(s=>s.id));
      const extras = sessions.value.filter(s=> !remoteIds.has(s.id));
      if(cur && !remoteIds.has(cur)){
        merged.unshift(extras.find(e=>e.id===cur) || { id: cur, esId, title:'', raw:{} });
      }
      extras.filter(e=> e.id!==cur).forEach(e=> merged.push(e));
      const uniq=[];
      const seen=new Set();
      for(const s of merged){
        if(!s || !s.id) continue;
        if(seen.has(s.id)) continue;
        seen.add(s.id);
        uniq.push(s);
      }
      sessions.value = uniq;
  // reloadSessions merged count
    }
  } catch(e){
    console.warn('reload sessions failed', e);
  } finally {
    loadingSessions.value=false;
  }
}

async function switchSession(id){ if(id===currentSessionId.value) return; if(streaming.value){ const cont = await ElMessageBox.confirm('切换会话将终止当前回答，继续？','提示',{ type:'warning' }).catch(()=>false); if(!cont) return; stopStreaming(); } currentSessionId.value = id; messages.value = []; await loadLatestForSwitch(id); persistLastSession(); }
async function loadLatestForSwitch(_id){ }
function onEnterPress(e){ if(e.shiftKey){ return; } sendMessage(); }
async function sendMessage(){ if(streaming.value) return; const text = inputText.value.trim(); if(!text) return; if(!currentSessionId.value){ await createNewSession(); }
  if(!currentSessionId.value){ ElMessage.error('会话创建失败'); return; }
  const userMsg = { id:`u_${Date.now()}`, sessionId: currentSessionId.value, role:'user', content:text, parts:[text], status:'done', createdAt:Date.now() };
  messages.value.push(userMsg);
  const aiMsg = { id:`a_${Date.now()}`, sessionId: currentSessionId.value, role:'assistant', content:'', parts:[], status:'streaming', createdAt:Date.now() };
  messages.value.push(aiMsg);
  inputText.value=''; scrollSoon();
  const cur = sessions.value.find(s=>s.id===currentSessionId.value); if(cur && !cur.title){ cur.title = userMsg.content.slice(0,20); }
  pushRecentQuestion(userMsg.content);
  await streamAnswer(aiMsg, text);
}
async function streamAnswer(aiMsg, question){
  streaming.value=true;
  try {
  const esId = effectiveEsId.value || undefined;
    const { aiService } = await import('../../services/aiService');
    const controller = new AbortController();
    abortRef.value=controller;
    await aiService.streamFileChatMessage({
      sessionId: currentSessionId.value,
      esId,
      content: question,
      useContext: useContext.value,
      topK: topK.value,
      maxContextChars: maxContextChars.value,
      userId: effectiveUserId.value,
      signal: controller.signal,
      onDelta: (delta)=> { aiMsg.parts.push(delta); aiMsg.content = aiMsg.parts.join(''); throttleScroll(); },
      onDone: ()=> { aiMsg.status='done'; streaming.value=false; abortRef.value=null; scrollSoon(); },
      onError: (err)=> { if(err==='aborted'){ aiMsg.status='aborted'; } else { aiMsg.status='error'; aiMsg.errorMsg=err; } streaming.value=false; abortRef.value=null; }
    });
  } catch(e){
    aiMsg.status='error';
    aiMsg.errorMsg=e.message;
    streaming.value=false;
    abortRef.value=null;
  }
  nextTick(()=> inputRef.value?.focus?.());
}
function stopStreaming(){ if(abortRef.value){ abortRef.value.abort(); } }
function retryMessage(msg){ if(streaming.value) return; if(msg.role!=='assistant') return; const idx = messages.value.findIndex(m=>m.id===msg.id); if(idx>0){ const userBefore = [...messages.value].slice(0,idx).reverse().find(m=>m.role==='user'); if(userBefore){ const newAi={ id:`a_${Date.now()}`, sessionId: currentSessionId.value, role:'assistant', content:'', parts:[], status:'streaming', createdAt:Date.now() }; messages.value.push(newAi); streamAnswer(newAi, userBefore.content); } } }
function resendMessage(userMsg){ if(streaming.value) return; if(userMsg.role!=='user') return; const newAi={ id:`a_${Date.now()}`, sessionId: currentSessionId.value, role:'assistant', content:'', parts:[], status:'streaming', createdAt:Date.now() }; messages.value.push(newAi); streamAnswer(newAi, userMsg.content); }
function editMessage(userMsg){ if(streaming.value) return; if(userMsg.role!=='user') return; inputText.value = userMsg.content; nextTick(()=> inputRef.value?.focus?.()); }
function deleteMessage(m){ if(streaming.value && m.status==='streaming') return; const idx = messages.value.findIndex(x=>x.id===m.id); if(idx>-1){ messages.value.splice(idx,1); } }
function copyMessage(m){ try { navigator.clipboard?.writeText(m.content); ElMessage.success('已复制'); } catch { const ta=document.createElement('textarea'); ta.value=m.content; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ElMessage.success('已复制'); } catch { ElMessage.error('复制失败'); } document.body.removeChild(ta); } }
async function deleteSession(id){ const ok = await ElMessageBox.confirm('确认删除该会话？','提示',{ type:'warning' }).catch(()=>false); if(!ok) return; try { const { aiService } = await import('../../services/aiService'); const { success } = await aiService.deleteFileChatSession(id, effectiveUserId.value); if(success){ sessions.value = sessions.value.filter(s=>s.id!==id); if(id===currentSessionId.value){ currentSessionId.value = sessions.value[0]?.id || null; messages.value = []; } ElMessage.success('已删除'); } else ElMessage.error('删除失败'); } catch{ ElMessage.error('删除异常'); } }
async function confirmClearAll(){ const ok = await ElMessageBox.confirm('确认清空该文件所有会话？','清空',{ type:'warning' }).catch(()=>false); if(!ok) return; const esId = effectiveEsId.value; if(!esId){ ElMessage.info('当前为百科模式，无文件会话可清空'); return; } try { const { aiService } = await import('../../services/aiService'); const { success } = await aiService.clearFileChatSessions(esId, effectiveUserId.value); if(success){ ElMessage.success('已清空'); resetAll(); await ensureSession(); await reloadSessions(); } else ElMessage.error('清空失败'); } catch{ ElMessage.error('清空异常'); } }
async function confirmClearCurrent(){ const ok = await ElMessageBox.confirm('确认清空当前会话消息？\n（将通过删除并立即新建同一会话实现）','清空当前',{ type:'warning', confirmButtonText:'确定', cancelButtonText:'取消' }).catch(()=>false); if(!ok) return; const oldTitle = currentSessionTitle.value; const oldModel = modelDisplayName.value; const curId = currentSessionId.value; if(!curId) return; const esId = effectiveEsId.value; if(!esId){ // 百科模式：仅清空本地消息
  messages.value = []; ElMessage.success('已清空'); return; }
  try { const { aiService } = await import('../../services/aiService'); await aiService.deleteFileChatSession(curId, effectiveUserId.value); const { success, sessionId, raw } = await aiService.createFileChatSession({ esId, userPrompt: configForm.userPrompt || '', userId: effectiveUserId.value }); if(success){ currentSessionId.value = sessionId; sessions.value = sessions.value.filter(s=>s.id!==curId); sessions.value.unshift({ id: sessionId, esId, title: oldTitle, raw:{ modelName: oldModel, ...(raw||{}), userPrompt: configForm.userPrompt||'' }}); messages.value = []; persistLastSession(); ElMessage.success('已清空'); reloadSessions(); } else { ElMessage.error('清空失败'); } } catch{ ElMessage.error('清空异常'); } }
function exportConversation(){ const data = { sessionId: currentSessionId.value, messages: messages.value.map(m=>({ role:m.role, content:m.content })) }; const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`conversation_${currentSessionId.value||'new'}.json`; a.click(); URL.revokeObjectURL(url); }
function scrollSoon(){ nextTick(()=> scrollToBottom()); }
function scrollToBottom(){ messageListRef.value?.scrollToBottom?.(); }
function scrollToTop(){ messageListRef.value?.scrollToTop?.(); }
let scrollThrottleTimer=null; function throttleScroll(){ if(scrollThrottleTimer) return; scrollThrottleTimer = requestAnimationFrame(()=>{ scrollThrottleTimer=null; scrollToBottom(); }); }
function beginEditTitle(){ const cur = sessions.value.find(s=>s.id===currentSessionId.value); if(!cur) return; editableTitle.value = cur.title || ''; editingTitle.value=true; nextTick(()=>{ const el = document.querySelector('.title-edit-input input'); el && el.focus(); }); }
function saveTitle(){ const cur = sessions.value.find(s=>s.id===currentSessionId.value); if(cur){ cur.title = editableTitle.value.trim(); } editingTitle.value=false; }

// 百科问答事件处理：detail: { text, selection, paragraph }
function handleEncyclopediaQA(e){
  const now = Date.now();
  if(now - lastEncyclopediaAt < 600) return; // 节流 600ms
  lastEncyclopediaAt = now;
  const raw = (e?.detail?.text || '').trim();
  if(!raw) return;
  const txt = raw; // 已包含格式化
  const ask = async ()=>{
  // set inputText first so createNewSession can use it as the session title
  inputText.value = txt;
  if(!currentSessionId.value){ await createNewSession(); }
  if(!currentSessionId.value) { ElMessage.error('无法创建会话'); return; }
  sendMessage();
  };
  ask();
}

// 默认开场白问题
const starterQuestions = [
  '这份文档的核心要点是什么？',
  '帮我生成一个简短的总结'
];
function clickStarter(q){ if(streaming.value) return; inputText.value = q; sendMessage(); }

// --- 百科问答辅助 ---
let lastEncyclopediaAt = 0;
</script>
<style scoped>
/* copied styles from original DocumentQA */
.file-chat-root{display:flex;height:100%;background:#fff;color:#303133;font-size:14px;}
.file-chat-root.sessions-collapsed .sessions-pane{display:none;}
.file-chat-root.sessions-collapsed .chat-main{flex:1;}
.chat-title .toggle-sessions{margin-right:4px;}
.chat-title .title-text{max-width:360px;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sessions-pane{width:230px;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;background:#fafafa;}
.sessions-header{padding:8px 10px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb;}
.sessions-header .title{font-weight:600;font-size:14px;}
.sessions-header .actions{display:flex;gap:6px;}
.sessions-list{flex:1;overflow:auto;padding:4px 0;}
.session-item{padding:8px 12px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:background .15s;}
session-item:hover{background:#f0f2f5;}
.session-item.active{background:#e7f3ff;}
.session-item .name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px;}
.session-item .ops .el-button{padding:0 4px;}
.session-item .ops{display:flex;opacity:0;transition:opacity .15s;}
.session-item:hover .ops{opacity:1;}
.sessions-list .empty{padding:20px 12px;color:#909399;font-size:13px;}
.chat-main{flex:1;display:flex;flex-direction:column;min-width:0;}
.chat-header{height:46px;padding:0 16px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;background:#fafafa;}
.chat-title{display:flex;align-items:center;gap:8px;font-weight:600;}
.chat-header-actions{display:flex;align-items:center;gap:12px;}
.chat-header-actions .el-button{padding:4px;}
.chat-header-actions .model-config-btn{display:flex;align-items:center;gap:6px;padding:4px 10px;}
.chat-header-actions .model-config-btn .model-name{max-width:140px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.config-form :deep(.el-input), .config-form :deep(.el-select), .config-form :deep(.el-textarea){ width:100%; }
.input-area{border-top:1px solid #e5e7eb;padding:8px 12px;display:flex;flex-direction:column;gap:6px;background:#fff;}
.input-toolbar{display:flex;align-items:center;justify-content:space-between;}
.input-toolbar .left{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.header-new-session{margin-left:8px;}
.starter-container{padding:32px 40px 12px;color:#606266;}
.starter-title{font-size:14px;font-weight:600;margin-bottom:12px;}
.starter-list{display:flex;flex-wrap:wrap;gap:12px;}
.starter-item{cursor:pointer;padding:10px 14px;border:1px solid #dcdfe6;border-radius:10px;background:#f8f9fa;font-size:13px;line-height:1.4;transition:all .15s;max-width:220px;}
.starter-item:hover{background:#edf5ff;border-color:#c0d4f5;color:#409eff;}
@keyframes blink{50%{opacity:0;}}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
@media (max-width:960px){.file-chat-root{flex-direction:column;}.sessions-pane{width:100%;flex-direction:row;overflow-x:auto;}.sessions-list{display:flex;flex-wrap:nowrap;}.session-item{min-width:160px;border-right:1px solid #e5e7eb;}}
</style>
