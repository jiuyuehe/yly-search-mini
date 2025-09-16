<template>
  <div class="summary-panel">
    <div class="panel-header">
      <h3>文档摘要</h3>
      <div class="controls">
        
        <el-input-number v-model="summaryLength" :min="50" :max="2000" :step="50" size="small" class="len-input" />
  <el-button size="small" type="primary" :loading="loadingSource" @click="() => generateSummary(false)">{{ loadingSource? '生成中...' : (hasAnySummary? '重新生成' : '生成摘要') }}</el-button>
        <el-button size="small" :disabled="!hasAnySummary" @click="copySummary">复制</el-button>
        <el-button size="small" type="success" :disabled="!dirty || saving" :loading="saving" @click="saveAll">保存</el-button>
      </div>
    </div>
    <div class="summary-content">
      <div v-if="loading" class="loading"><el-skeleton :rows="4" animated /></div>
      <template v-else>
        <div v-if="hasAnySummary" class="dual-wrapper">
          <el-card shadow="never" class="summary-card">
            <div class="card-header">
              <span class="card-title">原文摘要 <small v-if="sourceLang">({{ sourceLang }})</small></span>
              <div class="card-actions">
                <el-button v-if="!editingSource" link size="small" :disabled="!sourceSummary" @click="startEdit('source')">修改</el-button>
                <template v-else>
                  <el-button link size="small" @click="cancelEdit('source')">取消</el-button>
                </template>
              </div>
            </div>
            <div v-if="!editingSource" class="summary-view">
              <pre class="summary-text" v-if="sourceSummary">{{ sourceSummary }}</pre>
              <el-empty v-else description="无内容" />
              <ul v-if="sourcePoints.length" class="points-list">
                <li v-for="(p,i) in sourcePoints" :key="i">{{ i+1 }}. {{ p }}</li>
              </ul>
            </div>
            <div v-else class="summary-edit">
              <el-input v-model="editSource" type="textarea" :autosize="{ minRows:6, maxRows:14 }" placeholder="编辑原文摘要" />
              <div class="meta-line">
                <span>长度: {{ editSource.length }}</span>
                <span>tokens≈{{ tokens(editSource) }}</span>
              </div>
            </div>
            <div class="meta-line" v-if="!editingSource">
              <span>长度: {{ sourceSummary.length }}</span>
              <span>tokens≈{{ tokens(sourceSummary) }}</span>
            </div>
          </el-card>
          <el-card shadow="never" class="summary-card">
            <div class="card-header">
              <span class="card-title">译文摘要 
                <el-select v-model="targetLanguage" size="small" class="lang-select" placeholder="目标语言">
          <el-option label="中文" value="zh" />
          <el-option label="英文" value="en" />
          <!-- <el-option label="日文" value="ja" />
          <el-option label="韩文" value="ko" /> -->
        </el-select>
  <el-button size="small" type="primary" :loading="loadingTarget" @click="() => generateSummary(true)">{{ loadingTarget? '生成中...' : (hasAnySummary? '重新生成' : '生成摘要') }}</el-button>
              </span>
              <div class="card-actions">
                <el-button v-if="!editingTarget" link size="small" :disabled="!targetSummary" @click="startEdit('target')">修改</el-button>
                <template v-else>
                  <el-button link size="small" @click="cancelEdit('target')">取消</el-button>
                </template>
              </div>
            </div>
            <div v-if="!editingTarget" class="summary-view">
              <pre class="summary-text" v-if="targetSummary">{{ targetSummary }}</pre>
              <el-empty v-else description="无内容" />
              <ul v-if="targetPoints.length" class="points-list">
                <li v-for="(p,i) in targetPoints" :key="i">{{ i+1 }}. {{ p }}</li>
              </ul>
            </div>
            <div v-else class="summary-edit">
              <el-input v-model="editTarget" type="textarea" :autosize="{ minRows:6, maxRows:14 }" placeholder="编辑目标摘要" />
              <div class="meta-line">
                <span>长度: {{ editTarget.length }}</span>
                <span>tokens≈{{ tokens(editTarget) }}</span>
              </div>
            </div>
            <div class="meta-line" v-if="!editingTarget">
              <span>长度: {{ targetSummary.length }}</span>
              <span>tokens≈{{ tokens(targetSummary) }}</span>
              <span v-if="durationMs">耗时: {{ (durationMs/1000).toFixed(2) }}s</span>
            </div>
          </el-card>
        </div>
      
        <el-empty v-else :description="error || '设置参数后点击生成摘要'" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';
import { ElMessage } from 'element-plus';
import { aiService } from '../../services/aiService';

const props = defineProps({ fileId: { type: [String, Number], required: true }, file: { type: Object, default: null } });

const aiToolsStore = useAiToolsStore();
const sourceSummary = ref('');
const targetSummary = ref('');
const originSource = ref('');
const originTarget = ref('');
const loadingSource = ref(false);
const loadingTarget = ref(false);
const loading = computed(() => loadingSource.value || loadingTarget.value);
const error = ref('');
const targetLanguage = ref('zh'); // 默认中文(内部值用 zh)
const summaryLength = ref(200); // 默认 200
const startTime = ref(0);
const durationMs = ref(0);
const sourceLang = ref('');
const targetLang = ref('');
const saving = ref(false);
const editingSource = ref(false);
const editingTarget = ref(false);
const editSource = ref('');
const editTarget = ref('');
const sourcePoints = ref([]); // 原文要点
const targetPoints = ref([]); // 目标要点

function tokens(txt){ return Math.ceil((txt||'').length / 1.6); }
function looseParseJson(str){
  if (typeof str !== 'string') return null;
  let cleaned = str.trim();
  // Remove line-continuation backslashes at line ends: "\\\n" -> ''
  cleaned = cleaned.replace(/\\\r?\n/g,'');
  // Strip wrapping quotes if double-encoded
  if ((cleaned.startsWith('"{') && cleaned.endsWith('}"')) || (cleaned.startsWith("'{") && cleaned.endsWith("}'"))) {
    try { const unq = cleaned.slice(1,-1); if (unq.startsWith('{')||unq.startsWith('[')) cleaned = unq; } catch { /* ignore */ }
  }
  try { return JSON.parse(cleaned); } catch { return null; }
}
function cleanupSummaryText(text){
  if (!text) return '';
  // strip markdown code fences
  if (/^```/.test(text.trim())) {
    text = text.trim().replace(/^```[a-zA-Z0-9]*\n?/, '');
    if (text.endsWith('```')) text = text.slice(0,-3);
  }
  // Convert escaped \n to real newlines if present, but keep existing real newlines
  if (/\\n/.test(text)) text = text.replace(/\\n/g,'\n');
  // Remove line-continuation backslash at line end ("\\\n")
  text = text.replace(/\\\r?\n/g,'');
  // Collapse excessive blank lines
  text = text.replace(/\n{3,}/g,'\n\n');
  return text.trim();
}
function normalizeSummary(raw){
  if (!raw) return '';
  if (typeof raw === 'string') {
    const t = raw.trim();
  // unwrap code fences early
  let inner = t;
  if (inner.startsWith('```')) { inner = inner.replace(/^```[a-zA-Z0-9]*\n?/, ''); if(inner.endsWith('```')) inner = inner.slice(0,-3); inner = inner.trim(); }
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try {
    let obj = looseParseJson(inner) || looseParseJson(t) || JSON.parse(inner);
        if (obj && typeof obj === 'object') {
          // debug: normalized summary parsed object (removed noisy console.log)
          if (typeof obj.summary === 'string') return cleanupSummaryText(obj.summary);
          if (typeof obj.targetSummary === 'string') return cleanupSummaryText(obj.targetSummary);
          if (typeof obj.content === 'string') return cleanupSummaryText(obj.content);
        }
  } catch { /* JSON parse fallback silently */ }
    }
  return cleanupSummaryText(inner);
  } else if (typeof raw === 'object') {
  // debug: normalizeSummary raw object (removed noisy console.log)
    if (typeof raw.summary === 'string') return cleanupSummaryText(raw.summary);
    if (typeof raw.targetSummary === 'string') return cleanupSummaryText(raw.targetSummary);
    if (typeof raw.content === 'string') return cleanupSummaryText(raw.content);
    return '';
  }
  return String(raw || '');
}
function extractPoints(objOrStr){
  try {
    let obj = objOrStr;
    if (typeof objOrStr === 'string') {
      const t = objOrStr.trim();
      if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
  const parsed = looseParseJson(t);
  if (parsed) obj = parsed; else { try { obj = JSON.parse(t); } catch { /* ignore */ } }
      }
    }
    if (obj && typeof obj === 'object') {
      const arr = obj.key_points || obj.keyPoints || obj.keypoints || obj.points;
  // debug: extractPoints object and raw arr (removed noisy console.log)
      if (Array.isArray(arr)) {
        const out=[];
        const pushLines = (text)=>{
          if (!text || typeof text !== 'string') return;
          const raw = text.replace(/\\n/g,'\n');
          // debug: pushLines raw text BEFORE split (removed noisy console.log)
          // detect numbered lines or fallback to bullet split
          const lines = raw.split(/\n+/).map(l=>l.trim()).filter(l=>l);
            if (lines.filter(l=>/^\d+[.).、]/.test(l)).length >= 2) {
              lines.forEach(l=>{ if (/^\d+[.).、]/.test(l)) out.push(l.replace(/^\s*\d+[.).、]\s*/,'').trim()); });
            } else if (/^\d+[.).、]/.test(raw)) {
              // single string with numbers but no newlines split
              raw.split(/(?=\d+[.).、])/).forEach(seg=>{ const t=seg.trim(); if (t) out.push(t.replace(/^\d+[.).、]\s*/,'').trim()); });
            } else {
              out.push(raw.trim());
            }
        };
        arr.forEach(item=> pushLines(item));
  // debug: extracted points (removed noisy console.log)
        return out.filter(Boolean);
      }
    }
    // fallback: try split numbered list in string
    if (typeof objOrStr === 'string') {
  const lines = objOrStr.split(/\n+/).map(l=>l.trim()).filter(l=>/^\d+[.).、]/.test(l));
  if (lines.length>=2) return lines.map(s=> s.replace(/^\s*\d+[.).、]\s*/,'').trim());
    }
  } catch { /* ignore */ }
  return [];
}
function startEdit(which){
  if (which==='source') { editSource.value = sourceSummary.value; editingSource.value = true; }
  else { editTarget.value = targetSummary.value; editingTarget.value = true; }
}
function cancelEdit(which){
  if (which==='source') { editingSource.value = false; editSource.value=''; }
  else { editingTarget.value = false; editTarget.value=''; }
}
const dirty = computed(()=> {
  if (editingSource.value && editSource.value !== originSource.value) return true;
  if (editingTarget.value && editTarget.value !== originTarget.value) return true;
  if (!editingSource.value && sourceSummary.value !== originSource.value) return true;
  if (!editingTarget.value && targetSummary.value !== originTarget.value) return true;
  return false;
});
const hasAnySummary = computed(()=> !!(sourceSummary.value || targetSummary.value));
const showDual = computed(()=> !!sourceSummary.value);

async function generateSummary(isTarget) {
  if (loadingSource.value || loadingTarget.value) return;
  error.value='';
  // Only clear the relevant summary
  if (!isTarget) sourceSummary.value = '';
  if (isTarget) targetSummary.value = '';
  editingSource.value = false; editingTarget.value=false;
  startTime.value = Date.now();
  try {
    if (isTarget) {
      loadingTarget.value = true;
      const resTarget = await aiToolsStore.getSummary(String(props.fileId||''), targetLanguage.value || 'zh', summaryLength.value, props.file||null);
      if (resTarget && typeof resTarget === 'object') {
        targetSummary.value = normalizeSummary(resTarget.summary || resTarget.targetObj || resTarget.targetSummary || '');
        originTarget.value = targetSummary.value;
        targetLang.value = resTarget.targetLang || targetLanguage.value;
      } else if (typeof resTarget === 'string') {
        targetSummary.value = normalizeSummary(resTarget);
        originTarget.value = targetSummary.value;
      }
    } else {
      loadingSource.value = true;
      const res = await aiToolsStore.getSummary(String(props.fileId||''), '', summaryLength.value, props.file||null);
      if (res && typeof res === 'object') {
        sourceSummary.value = normalizeSummary(res.summary || res.sourceObj || res.sourceSummary || '');
        sourcePoints.value = extractPoints(res.sourceObj || res.sourceSummary);
        originSource.value = sourceSummary.value;
        sourceLang.value = res.sourceLang || '';
      } else if (typeof res === 'string') {
        sourceSummary.value = normalizeSummary(res);
        originSource.value = sourceSummary.value;
      }
    }
  } catch (e) {
    error.value = e?.message || '生成摘要失败';
    ElMessage.error(error.value);
  } finally {
    durationMs.value = Date.now()-startTime.value;
    // reset individual loading flags
    loadingSource.value = false;
    loadingTarget.value = false;
  }
}

async function loadCachedIfAny() {
  const esId = props.file?.esId || props.file?.esid || props.file?._raw?.esId || props.file?._raw?.esid || '';
  if (!esId) return;
  loadingSource.value = true;
  try {
    const cached = await aiService.fetchCachedSummary(esId);
    if (cached && (cached.targetSummary || cached.sourceSummary)) {
      targetSummary.value = normalizeSummary(cached.targetSummary || cached.targetObj || '');
      sourceSummary.value = normalizeSummary(cached.sourceSummary || cached.sourceObj || '');
      if (!sourceSummary.value && targetSummary.value && (cached.sourceSummary === undefined && cached.sourceObj === undefined)) {
        sourceSummary.value = '';
      }
      targetPoints.value = extractPoints(cached.targetObj || cached.targetSummary);
      sourcePoints.value = extractPoints(cached.sourceObj || cached.sourceSummary);
      originTarget.value = targetSummary.value;
      originSource.value = sourceSummary.value;
      sourceLang.value = cached.sourceLang || '';
      targetLang.value = cached.targetLang || targetLanguage.value;
    } else {
      // 未命中缓存，不自动生成，等待用户点击
    }
  } catch (e) {
    console.warn('[SummaryPanel] load cached summary failed', e);
  } finally {
    loadingSource.value = false;
  }
}

onMounted(()=>{ loadCachedIfAny(); });
watch(()=> props.file?.esId || props.file?.esid, ()=> loadCachedIfAny());

async function copySummary() {
  if (!hasAnySummary.value) return;
  const combined = `【原文摘要】\n${sourceSummary.value}\n\n【目标摘要】\n${targetSummary.value}`.trim();
  try { await navigator.clipboard.writeText(combined); ElMessage.success('已复制'); } catch { ElMessage.error('复制失败'); }
}

async function saveAll(){
  if (!dirty.value) return;
  saving.value = true;
  try {
    const esId = props.file?.esId || props.file?.esid || props.file?._raw?.esId || props.file?._raw?.esid || '';
    if (!esId) { ElMessage.warning('缺少 esId，无法保存'); saving.value=false; return; }
    // If editing, apply edited text first
  if (editingSource.value) { sourceSummary.value = editSource.value; editingSource.value=false; }
  if (editingTarget.value) { targetSummary.value = editTarget.value; editingTarget.value=false; }
  // Build JSON string payloads preserving key_points
  await aiService.saveSummary(esId, { sourceSummary: sourceSummary.value, targetSummary: targetSummary.value, sourceLang: sourceLang.value, targetLang: targetLang.value || targetLanguage.value });
    originSource.value = sourceSummary.value;
    originTarget.value = targetSummary.value;
    ElMessage.success('已保存');
  } catch (e) { ElMessage.error(e.message || '保存失败'); }
  finally { saving.value=false; }
}
</script>

<style scoped>
.summary-panel {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-select {
  width: 100px;
}

.len-input :deep(.el-input__wrapper) {
  padding: 0 6px;
}

.summary-content {
  flex: 1;
  overflow-y: auto;
}
.dual-wrapper { display:flex; flex-direction:column; gap:16px; }
.single-wrapper { display:flex; flex-direction:column; }
.summary-card { position:relative; }
.summary-input :deep(textarea) { font-family: inherit; line-height:1.55; }
.card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
.card-title { font-weight:600; }
.meta-line { margin-top:8px; font-size:12px; color:#909399; display:flex; gap:12px; flex-wrap:wrap; }
.single-summary-card { position:relative; }
.summary-view { white-space: pre-wrap; line-height:1.55; font-size:13px; }
.summary-text { margin:0; font-family:inherit; white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere; }
.summary-edit :deep(textarea){ font-family:inherit; }
.card-header-line { display:flex; justify-content:space-between; align-items:center; font-weight:600; }
.meta-small { font-size:12px; color:#909399; font-weight:400; }
.points-list { margin:8px 0 0 0; padding-left:18px; font-size:12.5px; line-height:1.5; }
.points-list li { margin:2px 0; }
</style>
