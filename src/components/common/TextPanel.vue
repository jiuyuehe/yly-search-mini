<template>
  <div class="text-panel">
    <div class="panel-header">
      <span class="panel-title">{{ title }}

        <el-select
        v-model="fileLangDisplay"
        size="small"
        class="file-lang-select"
        @change="onFileLangChange"
        :disabled="!esId"
      >
        <el-option v-for="opt in langOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      </span>

      <div class="header-actions">
        <span class="char-count">{{ textContent.length }}{{ maxLength ? `/${maxLength}` : '' }}</span>
        <el-button
          v-if="showDownload"
          size="small"
          type="text"
          class="s-button"
          @click="handleHeaderOcr"
        >
          <el-icon><Image /></el-icon>
          OCR识别
        </el-button>
        <el-button 
          v-if="showDownload" 
          size="small" 
          type="text" 
          class="s-button"
          @click="downloadText"
        >
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </div>
    </div>
  <div 
      ref="textEditorRef"
      class="text-editor" 
      :contenteditable="editable"
      @input="onTextInput"
      @mouseup="onTextSelection"
      @keyup="onTextSelection"
      @contextmenu.prevent.stop="onContextMenu"
      :placeholder="placeholder"
      v-html="renderedContent"
    ></div>

    <!-- Context Menu for Text Selection -->
    <div 
      v-if="showContextMenu" 
      ref="contextMenuRef"
      class="context-menu"
      :style="contextMenuStyle"
    >
      <div class="menu-item" @click="lookupEncyclopedia">
        <el-icon><Search /></el-icon>
        百科查询
      </div>
      <div class="menu-item" @click.stop="openTranslateDialog">
        <el-icon><ChatLineRound /></el-icon>
        划词翻译
      </div>
      <div class="menu-item" @click="copySelectedText">
        <el-icon><CopyDocument /></el-icon>
        复制文本
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" @click="markAsTerminology">
        <el-icon><Collection /></el-icon>
        术语入库
      </div>
      <div class="menu-item" @click="addCustomTag">
        <el-icon><CollectionTag /></el-icon>
        标签入库
      </div>
      <div class="menu-item" @click="openNERDialog">
        <el-icon><Connection /></el-icon>
        实体标注
      </div>
    </div>

    <!-- Custom Tag Dialog -->
    <el-dialog v-model="showCustomTagDialog" title="添加标签" width="400px">
      <el-form>
        <el-form-item label="标签名称">
          <el-input v-model="customTagName" placeholder="输入标签名称" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <el-color-picker v-model="customTagColor" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCustomTagDialog = false">取消</el-button>
          <el-button type="primary" @click="saveCustomTag">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- OCR Dialog -->
  <el-dialog v-model="showOcrDialog" title="OCR 识别" :width="ocrDialogFullscreen ? '98%' : '720px'" :class="ocrDialogFullscreen ? 'ocr-dialog-fullscreen' : ''">
      <template #title>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%">
          <div style="display:flex;align-items:center;gap:8px">
            <el-button size="small" type="primary" @click="performOcr" :loading="ocring" :disabled="ocring">识别</el-button>
            <div>OCR 识别</div>
          </div>
          <div>
            <el-button size="small" type="text" @click="toggleOcrFullscreen">{{ ocrDialogFullscreen ? '还原' : '全屏' }}</el-button>
          </div>
        </div>
      </template>
      <div style="min-height:160px;max-height:60vh;overflow:auto;">
        <el-input type="textarea" :rows="10" v-model="ocrResultText" placeholder="识别结果将在此显示" />
      </div>
  <!-- footer removed as requested -->
    </el-dialog>

    <!-- Terminology Dialog -->
    <el-dialog v-model="showTerminologyDialog" title="术语入库" width="500px">
      <el-form>
        <el-form-item label="原文内容">
          <el-input v-model="terminologyForm.originalText" readonly />
        </el-form-item>
        <el-form-item label="译文内容">
          <el-input v-model="terminologyForm.translatedText" placeholder="输入译文" />
        </el-form-item>
        <el-form-item label="语种">
          <el-select v-model="terminologyForm.language" placeholder="选择语种">
            <el-option v-for="opt in langOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="terminologyForm.type" placeholder="选择类型">
            <el-option label="术语" value="terminology" />
            <el-option label="记忆" value="memory" />
            <el-option label="语料" value="corpus" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTerminologyDialog = false">取消</el-button>
          <el-button type="primary" @click="saveTerminology">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- NER Mark Dialog -->
    <el-dialog v-model="showNERDialog" title="实体标注" width="420px">
      <el-form label-width="80px">
        <el-form-item label="文本">
          <el-input type="textarea" :rows="3" v-model="nerText" readonly />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="nerType" placeholder="选择实体类型">
            <el-option v-for="t in nerTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="showNERDialog=false">取消</el-button>
        <el-button size="small" type="primary" :loading="nerSaving" @click="saveNERMark" :disabled="!nerText || !nerType">保存</el-button>
      </template>
    </el-dialog>

    <!-- Quick Translate Dialog -->
    <el-dialog v-model="showTranslateDialog" title="划词翻译" width="640px">
      <div style="display:flex;flex-direction:column;gap:12px;min-height:120px;max-height:60vh;overflow:auto;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="min-width:80px;color:#606266">原语言</div>
            <div style="width:160px;padding:6px 10px;background:#f5f7fa;border-radius:4px;color:#303133;box-sizing:border-box">{{ translateSourceLangDisplay }}</div>
          <div style="min-width:80px;color:#606266">目标语言</div>
          <el-select v-model="translateTargetLang" placeholder="选择目标语言" style="width:160px">
            <el-option v-for="opt in langOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>

        <div>
          <div style="font-weight:600;margin-bottom:6px">原文</div>
          <el-input type="textarea" :rows="4" v-model="translateSourceText" readonly />
        </div>

        <div>
          <div style="font-weight:600;margin-bottom:6px">译文</div>
          <el-input type="textarea" :rows="6" v-model="translateResult" readonly />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTranslateDialog=false">关闭</el-button>
          <el-button type="primary" :loading="translating" @click="doTranslate">翻译</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Tag Save Dialog -->
    <el-dialog v-model="showTagDialog" title="标签入库" width="440px">
      <el-form label-width="70px">
        <el-form-item label="原文本">
          <el-input type="textarea" :rows="2" v-model="tagText" readonly />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="tagValue" placeholder="选择或输入" filterable allow-create default-first-option style="width:100%">
            <el-option v-for="t in existingTagValues" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="权重">
          <el-slider v-model="tagWeight" :min="0" :max="1" :step="0.05" show-input size="small" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="showTagDialog=false">取消</el-button>
        <el-button size="small" type="primary" :loading="tagSaving" @click="saveTag" :disabled="!tagValue">保存</el-button>
      </template>
    </el-dialog>

      <!-- Wiki Dialog -->
      <el-dialog v-model="showWikiDialog" title="百科查询" width="900px">
        <div style="margin-bottom:8px;">查询词：<span class="wiki-header-term">{{ wikiQuery }}</span></div>
        <div v-if="wikiError" class="wiki-error">{{ wikiError }}</div>
        <div v-else class="wiki-output" v-html="wikiResultHtml || (wikiLoading ? '<span class=\'wiki-loading\'><svg class=\'loading-icon\'></svg> 正在思考中...</span>' : '')"></div>
        <template #footer>
          <div style="display:flex;justify-content:space-between;width:100%;">
            <div style="display:flex;gap:8px;align-items:center;">
              <el-button size="small" type="primary" @click="startWikiStream" :disabled="wikiLoading">重新查询</el-button>
              <el-button size="small" @click="cancelWiki" v-if="wikiLoading">取消</el-button>
              <el-button size="small" @click="copyWikiResult" :disabled="!wikiResult">复制结果</el-button>
            </div>
            <el-button size="small" @click="showWikiDialog=false">关闭</el-button>
          </div>
        </template>
      </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Iphone, Search, CopyDocument, Collection, CollectionTag, Connection,Loading,ChatLineRound  } from '@element-plus/icons-vue';

import { aiService } from '../../services/aiService';
import { wikiStream } from '../../services/wiki';
import { resolveEsId } from '../../utils/esid';
import api from '../../services/api';
import { getLangLabel, getLangOptions } from '../../utils/language';

const props = defineProps({
  title: {
    type: String,
    default: '文本内容'
  },
  fileId: { type:[String,Number], default: null },
  file: { type: Object, default: null },
  content: {
    type: String,
    default: ''
  },
  editable: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: '请输入文本内容...'
  },
  showDownload: {
    type: Boolean,
    default: true
  },
  maxLength: {
    type: Number,
    default: null
  },
  enableMarkdown: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:content', 'text-selected', 'update:imageOcrText']);

// Refs
const textEditorRef = ref(null);
const contextMenuRef = ref(null);

// Text content
const textContent = ref(props.content);

// Context menu
const showContextMenu = ref(false);
const contextMenuStyle = ref({});
const selectedText = ref('');
const selectedRange = ref(null);
// NER mark dialog
const showNERDialog = ref(false);
const nerText = ref('');
const nerType = ref('person');
const nerSaving = ref(false);
const nerTypeOptions = [
  { value:'person', label:'人员' },
  { value:'organization', label:'组织' },
  { value:'location', label:'地点' },
  { value:'date', label:'日期' },
  { value:'other', label:'其它' }
];

// Wiki dialog state
const showWikiDialog = ref(false);
const wikiQuery = ref('');
const wikiResult = ref(''); // 原始 markdown
const wikiResultHtml = ref(''); // 渲染后的 HTML
const wikiLoading = ref(false);
const wikiError = ref('');
let wikiAbortController = null;


// Custom tag legacy dialog (deprecated by new tag saving) retained temporarily
const showCustomTagDialog = ref(false);
const customTagName = ref('');
const customTagColor = ref('#409EFF');

// New Tag dialog (integrated with index saving)
const showTagDialog = ref(false);
const tagText = ref('');
const tagValue = ref('');
const tagWeight = ref(0.5);
const tagSaving = ref(false);
const existingTagValues = ref([]); // loaded from cached tags
// OCR loading state
const ocring = ref(false);
// OCR dialog state
const showOcrDialog = ref(false);
const ocrResultText = ref('');
const ocrDialogFullscreen = ref(false);

// preload existing file.imageOcrText when dialog opens
watch(() => showOcrDialog.value, (v) => {
  if (v) {
    const existing = props.file?.imageOcrText || '';
    ocrResultText.value = existing;
  }
});

// Terminology dialog
const showTerminologyDialog = ref(false);
const terminologyForm = ref({
  originalText: '',
  translatedText: '',
  language: 'zh',
  type: 'terminology'
});

// Watch for content prop changes
watch(() => props.content, (newContent) => {
  textContent.value = newContent;
  if (textEditorRef.value) {
    textEditorRef.value.innerHTML = props.enableMarkdown ? renderMarkdown(newContent) : newContent;
  }
});

// Computed rendered content for markdown support
const renderedContent = computed(() => {
  if (props.enableMarkdown) {
    return renderMarkdown(textContent.value);
  }
  return textContent.value;
});

// Simple markdown renderer (basic implementation)
function renderMarkdown(text) {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// Text input handler
function onTextInput(event) {
  const newContent = event.target.innerText || '';
  textContent.value = newContent;
  emit('update:content', newContent);
}

// Text selection handler
function onTextSelection(event) {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    const txt = selection.toString().trim();
    selectedText.value = txt;
    try { 
      selectedRange.value = selection.getRangeAt(0).cloneRange(); 
    } catch { 
      /* ignore */ 
    }
    showContextMenuAt(event);
    emit('text-selected', txt);
  } else {
    hideContextMenu();
  }
}

// Context menu handler
function onContextMenu(event) {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    onTextSelection(event);
  }
}

// Show context menu at position
function showContextMenuAt(event) {
  nextTick(() => {
  // position uses raw event coords; bounding rect kept if future relative calc needed
    contextMenuStyle.value = {
      position: 'fixed',
      left: `${event.clientX}px`,
      top: `${event.clientY}px`,
      zIndex: 9999
    };
    showContextMenu.value = true;
  });
}

// Hide context menu
function hideContextMenu() {
  showContextMenu.value = false;
  selectedText.value = '';
  selectedRange.value = null;
}

function openNERDialog(){
  if(!selectedText.value){ ElMessage.warning('请先选择文本'); return; }
  nerText.value = selectedText.value;
  nerType.value = 'person';
  showNERDialog.value = true;
  hideContextMenu();
}

// Quick translate dialog state
const showTranslateDialog = ref(false);
const translateSourceLang = ref('auto');
const translateTargetLang = ref('zh');
const translateSourceText = ref('');
const translateResult = ref('');
const translating = ref(false);

// language options from util (reduced set per product request)
const langOptions = getLangOptions(['zh','en','ru','fr','hi']);

// file language display & update
const fileLangDisplay = ref('auto');
const esId = computed(() => resolveEsId(props.file, props.fileId));

// keep fileLangDisplay in sync with incoming props
watch(() => props.file, (f) => {
  if (f && f.fileLang) fileLangDisplay.value = f.fileLang;
  else if (props.fileLang) fileLangDisplay.value = props.fileLang || 'auto';
  else fileLangDisplay.value = 'auto';
}, { immediate: true });
watch(() => props.fileLang, (v) => {
  if (v) fileLangDisplay.value = v;
}, { immediate: true });

async function onFileLangChange(newLang) {
  const target = newLang || 'auto';
  if (!esId.value) {
    ElMessage.warning('缺少文档标识，无法设置语种');
    return;
  }
  try {
    // optimistic update
    fileLangDisplay.value = target;
    const resp = await api.post('/admin-api/rag/documents/indexes/update/lang', { esId: esId.value, fileLang: target });
    // if backend returns updated fileLang, use it
    const returned = resp?.data?.fileLang || resp?.fileLang;
    if (returned) fileLangDisplay.value = returned;
    ElMessage.success('语种已更新');
  } catch (e) {
    ElMessage.error('更新语种失败');
  }
}

// Display mapping for source language (show human-readable labels, non-editable)
const translateSourceLangDisplay = computed(() => {
  if (!translateSourceLang.value || translateSourceLang.value === 'auto') return getLangLabel('auto');
  return getLangLabel(translateSourceLang.value);
});

function detectLanguageSample(text){
  if(!text) return 'auto';
  // very small heuristic: presence of CJK characters
  if (/\p{Script=Han}/u.test(text)) return 'zh';
  // detect latin letters predominant -> en
  const alphaRatio = (text.replace(/[^A-Za-z]/g,'').length) / Math.max(1, text.length);
  if (alphaRatio > 0.6) return 'en';
  return 'auto';
}

function openTranslateDialog(){
  if(!selectedText.value) { ElMessage.warning('请先选择文本'); return; }
  translateSourceText.value = selectedText.value;
  // Prefer backend-provided file language when available
  translateSourceLang.value = (props.file && props.file.fileLang) ? props.file.fileLang : (props.fileLang || detectLanguageSample(selectedText.value));
  translateTargetLang.value = 'zh';
  translateResult.value = '';
  showTranslateDialog.value = true;
  hideContextMenu();
  // auto-trigger translation shortly after opening for quick UX
  setTimeout(() => { doTranslate().catch(()=>{}); }, 60);
}

async function doTranslate(){
  if (!translateSourceText.value) return ElMessage.warning('无可翻译文本');
  translating.value = true;
  translateResult.value = '';
  try {
    // 如果源语言与目标语言相同则跳过翻译，直接显示原文
    let srcLang = translateSourceLang.value || 'auto';
    if (srcLang === 'auto') srcLang = detectLanguageSample(translateSourceText.value);
    if (srcLang && translateTargetLang.value && srcLang === translateTargetLang.value) {
      translateResult.value = translateSourceText.value;
    } else {
      // Use aiService.translateText(text, targetLang) - do not pass esId
      const res = await aiService.translateText(translateSourceText.value, translateTargetLang.value);
      // aiService returns string
      translateResult.value = String(res || '');
    }
  } catch (e) {
    translateResult.value = '';
    ElMessage.error(e?.message || '翻译失败');
  } finally {
    translating.value = false;
  }
}

// Encyclopedia lookup
function lookupEncyclopedia() {
  if (!selectedText.value) return;
  // 截取 100 字
  let term = selectedText.value.trim();
  if (term.length > 100) {
    term = term.slice(0, 100);
    ElMessage.info('选择内容超过100字，已自动截断');
  }
  wikiQuery.value = term;
  wikiResult.value = '';
  wikiError.value = '';
  showWikiDialog.value = true;
  hideContextMenu();
  startWikiStream();
}

async function startWikiStream(){
  if(!wikiQuery.value) return;
  // 取消前一次
  if (wikiAbortController) {
    try { wikiAbortController.abort(); } catch { /* ignore */ }
  }
  wikiAbortController = new AbortController();
  wikiLoading.value = true;
  wikiError.value = '';
  wikiResult.value = '';
  wikiResultHtml.value = '';
  try {
    await wikiStream({
      text: wikiQuery.value,
      signal: wikiAbortController.signal,
      onChunk: chunk => {
        if (chunk === '\n') {
          wikiResult.value += '\n';
        } else if (chunk) {
          // 行内容（不自带换行）直接追加
          wikiResult.value += (wikiResult.value && !wikiResult.value.endsWith('\n') ? '' : '') + chunk;
        }
        wikiResultHtml.value = renderSimpleMarkdown(wikiResult.value);
      },
      onError: err => {
        wikiLoading.value = false;
        wikiError.value = (err && String(err)) || '百科查询失败';
      },
      onComplete: () => {
        wikiLoading.value = false;
        wikiResultHtml.value = renderSimpleMarkdown(wikiResult.value);
      }
    });
  } catch(e){
    wikiLoading.value = false;
    wikiError.value = e?.message || '百科查询失败';
  }
}

function cancelWiki(){
  if (wikiAbortController) {
    try { wikiAbortController.abort(); } catch { /* ignore */ }
  }
  wikiLoading.value = false;
}

function copyWikiResult(){
  if(!wikiResult.value) return;
  const txt = wikiResult.value;
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(txt).then(()=> ElMessage.success('已复制')).catch(()=> fallbackCopy(txt));
  } else fallbackCopy(txt);
}
function fallbackCopy(text){
  try {
    const ta = document.createElement('textarea');
    ta.style.position='fixed';
    ta.style.opacity='0';
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    ElMessage.success('已复制');
  } catch { ElMessage.error('复制失败'); }
}

function renderSimpleMarkdown(md){
  if(!md) return '';
  let out = md;
  // 代码块
  out = out.replace(/```([\s\S]*?)```/g,(m,p)=>`<pre class=\"mk-code\"><code>${escapeHtml(p.trim())}</code></pre>`);
  // 标题
  out = out.replace(/^######\s+(.*)$/gm,'<h6>$1</h6>')
           .replace(/^#####\s+(.*)$/gm,'<h5>$1</h5>')
           .replace(/^####\s+(.*)$/gm,'<h4>$1</h4>')
           .replace(/^###\s+(.*)$/gm,'<h3>$1</h3>')
           .replace(/^##\s+(.*)$/gm,'<h2>$1</h2>')
           .replace(/^#\s+(.*)$/gm,'<h1>$1</h1>');
  // 列表
  out = out.replace(/^(?:[-*+]\s.*(?:\n|$))+?/gm, block => {
    const items = block.trim().split(/\n/).map(l=> l.replace(/^[-*+]\s+/,'').trim()).filter(Boolean);
    return '<ul>' + items.map(i=>`<li>${i}</li>`).join('') + '</ul>';
  });
  // 粗体 & 斜体
  out = out.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
           .replace(/\*(.+?)\*/g,'<em>$1</em>');
  // 行内代码
  out = out.replace(/`([^`]+?)`/g,'<code>$1</code>');
  // 分隔线
  out = out.replace(/^---$/gm,'<hr />');
  // 段落
  out = out.split(/\n{2,}/).map(seg=>{
    if(/^(<h\d|<ul>|<pre|<hr)/.test(seg.trim())) return seg;
    return `<p>${seg.replace(/\n/g,'<br>')}</p>`;
  }).join('\n');
  return out;
}
function escapeHtml(str){
  return str.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#39;' }[c]||c));
}

// Mark as terminology
function markAsTerminology() {
  if (selectedText.value) {
    terminologyForm.value.originalText = selectedText.value;
    terminologyForm.value.translatedText = '';
    showTerminologyDialog.value = true;
    hideContextMenu();
  }
}

// Add custom tag
function addCustomTag() {
  if (selectedText.value) {
  // Prefer new tag dialog; fallback old if needed
  openTagDialog();
  }
}

// Copy selected text
function copySelectedText() {
  if (selectedText.value) {
    navigator.clipboard.writeText(selectedText.value).then(() => {
      ElMessage.success('文本已复制到剪贴板');
    }).catch(() => {
      ElMessage.error('复制失败');
    });
    hideContextMenu();
  }
}

async function saveNERMark(){
  if(!nerText.value || !nerType.value){ return; }
  const esId = resolveEsId(props.file, props.fileId);
  if(!esId){ ElMessage.error('缺少文件标识，无法保存实体'); return; }
  nerSaving.value = true;
  try {
    // 获取缓存实体W
    let grouped = await aiService.fetchCachedNER(esId);
    if(!grouped){
      grouped = { persons:[], organizations:[], locations:[], dates:[], others:[] };
    }
    const map = { person:'persons', organization:'organizations', location:'locations', date:'dates', other:'others' };
    const key = map[nerType.value] || 'others';
    if(!grouped[key]) grouped[key] = [];
    if(!grouped[key].includes(nerText.value)) grouped[key].push(nerText.value);
    // 去重清洗
    Object.keys(grouped).forEach(k=>{ if(Array.isArray(grouped[k])) grouped[k] = Array.from(new Set(grouped[k].map(v=> (v||'').trim()).filter(Boolean))); });
    const resp = await aiService.saveNER(esId, grouped);
    if(resp.success){
      ElMessage.success('实体已保存');
      showNERDialog.value = false;
      // 触发右侧面板切换
  window.dispatchEvent(new Event('activate-ner'));
  // also request a direct refresh to ensure panel reloads latest cached data
  window.dispatchEvent(new Event('refresh-ner'));
    } else {
      ElMessage.error(resp.message || '保存失败');
    }
  } catch(e){
    ElMessage.error(e?.message || '保存失败');
  } finally {
    nerSaving.value = false;
  }
}

function openTagDialog(){
  const esId = resolveEsId(props.file, props.fileId);
  if(!selectedText.value){ ElMessage.warning('请先选择文本'); return; }
  tagText.value = selectedText.value;
  tagValue.value = selectedText.value.slice(0,40);
  tagWeight.value = 0.5;
  showTagDialog.value = true;
  hideContextMenu();
  // preload existing tags (best-effort)
  if(esId){
    aiService.fetchCachedTags(esId).then(list=>{
      if(Array.isArray(list)) existingTagValues.value = Array.from(new Set(list.map(t=> t.tag).filter(Boolean))).slice(0,200);
    }).catch(()=>{});
  }
}

async function saveTag(){
  if(!tagValue.value){ return; }
  const esId = resolveEsId(props.file, props.fileId);
  if(!esId){ ElMessage.error('缺少文件标识，无法保存标签'); return; }
  tagSaving.value = true;
  try {
    // 获取现有
    let existing = await aiService.fetchCachedTags(esId) || [];
    if(!Array.isArray(existing)) existing = [];
    // normalize
    const normalized = existing.map(t=>({ tag: t.tag || t.keyword || t.key || '', weight: Number(t.weight||0) || 0 })).filter(t=> t.tag);
    // 更新/追加
    const idx = normalized.findIndex(t=> t.tag === tagValue.value);
    if(idx >=0) normalized[idx].weight = tagWeight.value; else normalized.push({ tag: tagValue.value, weight: tagWeight.value });
    // 限制数量
    const cleaned = normalized
      .map(t=>({ tag: t.tag.trim(), weight: Math.min(1, Math.max(0, Number(t.weight||0))) }))
      .filter(t=> t.tag)
      .slice(0,100);
    // 保存
    const resp = await aiService.saveTags(esId, cleaned);
    if(resp.success){
      ElMessage.success('标签已保存');
      showTagDialog.value = false;
      // 通知 TagsPanel 重新加载（自定义事件）
      window.dispatchEvent(new Event('refresh-tags'));
    } else {
      ElMessage.error(resp.message || '保存失败');
    }
  } catch(e){
    ElMessage.error(e?.message || '保存失败');
  } finally { tagSaving.value = false; }
}

// Save custom tag
function saveCustomTag() {
  if (customTagName.value.trim()) {
    ElMessage.success(`标签 "${customTagName.value}" 已保存`);
    // TODO: Implement tag saving API call
    customTagName.value = '';
    customTagColor.value = '#409EFF';
    showCustomTagDialog.value = false;
  }
}

// Save terminology
function saveTerminology() {
  if (terminologyForm.value.originalText && terminologyForm.value.translatedText) {
    ElMessage.success('术语已保存到术语库');
    // TODO: Implement terminology saving API call
    terminologyForm.value = {
      originalText: '',
      translatedText: '',
      language: 'zh',
      type: 'terminology'
    };
    showTerminologyDialog.value = false;
  }
}

async function ocrText(){
  if (ocring.value) return;
  const esId = resolveEsId(props.file, props.fileId);
  if (!esId) { ElMessage.error('缺少文件标识，无法进行 OCR 识别'); return; }
  ocring.value = true;
  try {
  const txt = await aiService.ocrRecognize(esId);
    const finalText = (txt && typeof txt === 'string') ? txt : (txt?.text || txt?.result || txt?.content || '');
  // user-visible messages handled below; avoid echoing raw debug text
    return;
    if (finalText) {
      // 后端可能只返回提示字符串 "OCR识别完成" 表示任务已完成并异步写入结果，
      // 无论后端返回提示还是实际文本，都不应直接写入主编辑内容 (textContent / update:content).
      // 仅将识别结果放入弹窗显示 (ocrResultText) 并通过 update:imageOcrText 通知父组件。
      const trimmed = String(finalText).trim();
      if (trimmed === 'OCR识别完成') {
        // 如果 props.file.imageOcrText 可用，优先在弹窗显示它，但不写回主编辑器
        const existing = props.file?.imageOcrText || ocrResultText.value || '';
        if (existing) {
          ocrResultText.value = existing;
        }
        ElMessage.success('OCR 识别完成');
      } else {
        // 收到实际识别文本：仅更新弹窗与父组件的 imageOcrText，不修改主编辑内容
        ocrResultText.value = finalText;
        emit('update:imageOcrText', finalText);
        ElMessage.success('OCR 识别完成');
      }
    } else {
      ElMessage.error('OCR 未识别到文本');
    }
  } catch (e) {
    ElMessage.error(e?.message || '解析 OCR 失败');
  } finally {
    ocring.value = false;
  }
}

// Called from dialog button
async function performOcr(){
  // reuse ocrText which also fills ocrResultText and props.file.imageOcrText
  await ocrText();
}

// Called from header OCR button: directly invoke OCR and open dialog when result present
async function handleHeaderOcr(){
  if (ocring.value) return;
  // open dialog immediately to show progress and prevent duplicate clicks
  // showOcrDialog.value = true;
  // clear previous result for clarity
  ocrResultText.value = '';
  try {
    await ocrText();
    // if ocrText filled ocrResultText or file has imageOcrText, ensure dialog shows it
    const existing = ocrResultText.value || props.file?.imageOcrText || '';
    if (existing) {
      ocrResultText.value = existing;
      // dialog already opened above
    } else {
      // no immediate text returned; inform user that OCR task completed or is processing
      // ocrText already displays a message; leave dialog open so user can close
    }
  } catch (e) {
    // ocrText handles errors and messages, but ensure dialog is visible for diagnostics
    console.warn('handleHeaderOcr error', e);
  }
}

function copyOcrResult(){
  if (!ocrResultText.value) return ElMessage.warning('没有可复制的识别内容');
  navigator.clipboard.writeText(ocrResultText.value).then(()=> ElMessage.success('已复制')).catch(()=> ElMessage.error('复制失败'));
}

function downloadOcrResult(){
  if (!ocrResultText.value) return ElMessage.warning('没有可下载的识别内容');
  const blob = new Blob([ocrResultText.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ocr_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success('下载完成');
}

function toggleOcrFullscreen(){
  ocrDialogFullscreen.value = !ocrDialogFullscreen.value;
  // Add/remove class on the dialog wrapper (Element Plus wraps dialog in .el-dialog__wrapper)
  nextTick(() => {
    try {
      const wrappers = Array.from(document.querySelectorAll('.el-dialog__wrapper'));
      wrappers.forEach(w => {
        if (w.querySelector('.ocr-dialog')) {
          if (ocrDialogFullscreen.value) w.classList.add('ocr-fullscreen-wrapper'); else w.classList.remove('ocr-fullscreen-wrapper');
          // also ensure dialog element gets a class for styling
          const dlg = w.querySelector('.el-dialog');
          if (dlg) {
            if (ocrDialogFullscreen.value) dlg.classList.add('ocr-dialog-fullscreen-force'); else dlg.classList.remove('ocr-dialog-fullscreen-force');
          }
        }
      });
    } catch (e) { /* ignore DOM errors */ }
  });
}

// ensure cleanup when dialog closes
watch(() => showOcrDialog.value, (open) => {
  if (!open) {
    nextTick(()=>{
      try { document.querySelectorAll('.el-dialog__wrapper.ocr-fullscreen-wrapper').forEach(w => w.classList.remove('ocr-fullscreen-wrapper')); } catch {};
      try { document.querySelectorAll('.el-dialog.ocr-dialog-fullscreen-force').forEach(d => d.classList.remove('ocr-dialog-fullscreen-force')); } catch {};
      // emit current ocrResultText so parent can save edits made in dialog
      if (ocrResultText.value) emit('update:imageOcrText', ocrResultText.value);
    });
  }
});

// Download text content
function downloadText() {
  if (textContent.value) {
    const blob = new Blob([textContent.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.title}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success('文本下载成功');
  }
}

// Close context menu when clicking outside
document.addEventListener('click', (e) => {
  if (showContextMenu.value && contextMenuRef.value && !contextMenuRef.value.contains(e.target)) {
    hideContextMenu();
  }
});
</script>

<style scoped>
.wiki-output {
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.55;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  max-height: 360px;
  overflow-y: auto;
  word-break: break-word;
}
.wiki-error {
  color: #f56c6c;
  padding: 8px 12px;
  background: #fff2f2;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 13px;
}
.wiki-header-term {
  font-weight: 600;
  color: #303133;
}
.wiki-loading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}
.text-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.panel-header {
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.file-lang-select {
  width: 81px;
  margin-left: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-count {
  font-size: 12px;
  color: #909399;
}

.text-editor {
  flex: 1;
  padding: 16px;
  border: none;
  outline: none;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  min-width: 0;
  box-sizing: border-box;
}

.text-editor:focus {
  outline: none;
}

.text-editor[contenteditable="false"] {
  background: #f8f9fa;
  cursor: default;
}

.text-editor:empty:before {
  content: attr(placeholder);
  color: #c0c4cc;
  pointer-events: none;
}

/* Context Menu */
.context-menu {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  min-width: 120px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: #303133;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f5f7fa;
  color: var(--el-color-primary);
}

.menu-item .el-icon {
  font-size: 16px;
}

.menu-separator {
  height: 1px;
  background: #ebeef5;
  margin: 4px 0;
}

/* Dialog styles */
.dialog-footer {
  display: flex;
  gap: 8px;
}

/* Markdown styles */
.text-editor :deep(strong) {
  font-weight: bold;
}

.text-editor :deep(em) {
  font-style: italic;
}

.text-editor :deep(code) {
  background: #f1f2f6;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.s-button {
  padding: 5px 0px;
}

/* OCR dialog fullscreen adjustments */
.ocr-dialog-fullscreen .el-dialog__wrapper {
  align-items: stretch;
}
.ocr-dialog-fullscreen .el-dialog {
  width: 98% !important;
  max-width: 98%;
  margin: 0 auto;
  top: 10px !important;
  height: 94vh !important;
}
.ocr-dialog-fullscreen .el-dialog__body{
  max-height: calc(94vh - 100px) !important;
  overflow: auto !important;
}

/* Force wrapper to occupy full viewport when toggled to avoid parent layout interference */
.ocr-fullscreen-wrapper{
  position: fixed !important;
  inset: 0px !important;
  display: flex !important;
  align-items: stretch !important;
  justify-content: center !important;
  z-index: 2000 !important;
}
.ocr-fullscreen-wrapper .el-dialog{
  height: 94vh !important;
}

/* stronger force class applied directly to .el-dialog when toggled */
.ocr-dialog-fullscreen-force{
  position: relative !important;
  top: 0 !important;
  height: 100vh !important;
  max-height: 100vh !important;
  margin: 0 auto !important;
}
.ocr-dialog-fullscreen-force .el-dialog__body{ max-height: calc(100vh - 120px) !important; overflow:auto !important; }
</style>