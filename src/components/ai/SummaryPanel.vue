<template>
  <div class="summary-panel">
    <div class="panel-header">
      <h3>文档摘要</h3>
      <div class="controls">
        <el-select v-model="targetLanguage" size="small" class="lang-select" placeholder="目标语言">
          <el-option label="中文" value="zh" />
          <el-option label="英文" value="en" />
          <el-option label="日文" value="ja" />
          <el-option label="韩文" value="ko" />
        </el-select>
        <el-input-number v-model="summaryLength" :min="50" :max="2000" :step="50" size="small" class="len-input" />
        <el-button size="small" type="primary" :loading="loading" @click="generateSummary">{{ loading? '生成中...' : (hasAnySummary? '重新生成' : '生成摘要') }}</el-button>
        <el-button size="small" :disabled="!hasAnySummary" @click="copySummary">复制</el-button>
        <el-button size="small" type="success" :disabled="!dirty || saving" :loading="saving" @click="saveAll">保存</el-button>
      </div>
    </div>
    <div class="summary-content">
      <div v-if="loading" class="loading"><el-skeleton :rows="4" animated /></div>
      <template v-else>
  <div v-if="hasAnySummary && showDual" class="dual-wrapper">
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
              <span class="card-title">目标摘要 <small v-if="targetLang">({{ targetLang }})</small></span>
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
        <div v-else-if="hasAnySummary && !showDual" class="single-wrapper">
          <el-card shadow="never" class="summary-card">
            <div class="card-header">
              <span class="card-title">摘要<small v-if="targetLang"> ({{ targetLang }})</small></span>
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
              <el-input v-model="editTarget" type="textarea" :autosize="{ minRows:6, maxRows:14 }" placeholder="编辑摘要" />
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
const loading = ref(false);
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
          console.log('[SummaryPanel] normalizeSummary parsed object:', obj);
          if (typeof obj.summary === 'string') return cleanupSummaryText(obj.summary);
          if (typeof obj.targetSummary === 'string') return cleanupSummaryText(obj.targetSummary);
          if (typeof obj.content === 'string') return cleanupSummaryText(obj.content);
        }
  } catch { /* JSON parse fallback silently */ }
    }
  return cleanupSummaryText(inner);
  } else if (typeof raw === 'object') {
    console.log('[SummaryPanel] normalizeSummary raw object:', raw);
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
      console.log('[SummaryPanel] extractPoints object:', obj, 'raw arr:', arr);
      if (Array.isArray(arr)) {
        const out=[];
        const pushLines = (text)=>{
          if (!text || typeof text !== 'string') return;
          const raw = text.replace(/\\n/g,'\n');
          console.log('[SummaryPanel] pushLines raw text BEFORE split:', raw);
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
        console.log('[SummaryPanel] extracted points:', out);
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

async function generateSummary() {
  if (loading.value) return;
  loading.value = true;
  error.value='';
  sourceSummary.value = '';
  targetSummary.value = '';
  editingSource.value = false; editingTarget.value=false;
  startTime.value = Date.now();
  try {
  const res = await aiToolsStore.getSummary(String(props.fileId||''), targetLanguage.value, summaryLength.value, props.file||null);
  if (res && typeof res === 'object') {
    console.log('[SummaryPanel] getSummary raw res:', res);
    targetSummary.value = normalizeSummary(res.targetSummary || res.targetObj || '');
    sourceSummary.value = normalizeSummary(res.sourceSummary || res.sourceObj || '');
    if(!sourceSummary.value && targetSummary.value && (res.sourceSummary===undefined && res.sourceObj===undefined)){
      // 后端只返回单摘要，统一放到 targetSummary，source 为空时使用 target 作为唯一摘要
      sourceSummary.value='';
    }
    targetPoints.value = extractPoints(res.targetObj || res.targetSummary);
    sourcePoints.value = extractPoints(res.sourceObj || res.sourceSummary);
    console.log('[SummaryPanel] after generation summaries:', { targetSummary: targetSummary.value, sourceSummary: sourceSummary.value, targetPoints: targetPoints.value, sourcePoints: sourcePoints.value });
    originTarget.value = targetSummary.value;
    originSource.value = sourceSummary.value;
    sourceLang.value = res.sourceLang || '';
    targetLang.value = res.targetLang || targetLanguage.value;
  } else if (typeof res === 'string') {
    targetSummary.value = normalizeSummary(res);
    targetPoints.value = extractPoints(res);
    originTarget.value = targetSummary.value;
  }
  } catch (e) {
    console.error('Failed to generate summary:', e);
    error.value = e?.message || '生成摘要失败';
    ElMessage.error(error.value);
  } finally {
    durationMs.value = Date.now()-startTime.value;
    loading.value = false;
  }
}

async function loadCachedIfAny() {
  const esId = props.file?.esId || props.file?.esid || props.file?._raw?.esId || props.file?._raw?.esid || '';
  if (!esId) return;
  loading.value = true;
  try {
    const cached = await aiService.fetchCachedSummary(esId);
    if (cached && (cached.targetSummary || cached.sourceSummary)) {
      console.log('[SummaryPanel] cached summary raw:', cached);
      targetSummary.value = normalizeSummary(cached.targetSummary || cached.targetObj || '');
      sourceSummary.value = normalizeSummary(cached.sourceSummary || cached.sourceObj || '');
      if(!sourceSummary.value && targetSummary.value && (cached.sourceSummary===undefined && cached.sourceObj===undefined)){
        sourceSummary.value='';
      }
      targetPoints.value = extractPoints(cached.targetObj || cached.targetSummary);
      sourcePoints.value = extractPoints(cached.sourceObj || cached.sourceSummary);
      console.log('[SummaryPanel] after cached load:', { targetSummary: targetSummary.value, sourceSummary: sourceSummary.value, targetPoints: targetPoints.value, sourcePoints: sourcePoints.value });
      originTarget.value = targetSummary.value;
      originSource.value = sourceSummary.value;
      sourceLang.value = cached.sourceLang || '';
      targetLang.value = cached.targetLang || targetLanguage.value;
    } else {
      // 未命中缓存，不自动生成，等待用户点击
    }
    
  } catch (e) {
    console.warn('[SummaryPanel] load cached summary failed', e);
  } finally { loading.value = false; }
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
  const sourceJsonStr = JSON.stringify({ summary: sourceSummary.value, key_points: sourcePoints.value && sourcePoints.value.length ? sourcePoints.value : undefined }, null, 2);
  const targetJsonStr = JSON.stringify({ summary: targetSummary.value, key_points: targetPoints.value && targetPoints.value.length ? targetPoints.value : undefined }, null, 2);
  await aiService.saveSummary(esId, { sourceSummary: sourceJsonStr, targetSummary: targetJsonStr, sourceLang: sourceLang.value, targetLang: targetLang.value || targetLanguage.value });
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
