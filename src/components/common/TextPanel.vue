<template>
  <div class="text-panel">
    <div class="panel-header">
      <span class="panel-title">{{ title }}</span>
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
            <el-option label="中文" value="zh" />
            <el-option label="English" value="en" />
            <el-option label="Français" value="fr" />
            <el-option label="Español" value="es" />
            <el-option label="Deutsch" value="de" />
            <el-option label="日本語" value="ja" />
            <el-option label="Русский" value="ru" />
            <el-option label="Italiano" value="it" />
            <el-option label="한국어" value="ko" />
            <el-option label="Português" value="pt" />
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
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Iphone, Search, CopyDocument, Collection, CollectionTag, Connection } from '@element-plus/icons-vue';

import { aiService } from '../../services/aiService';
import { resolveEsId } from '../../utils/esid';

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

// Encyclopedia lookup
function lookupEncyclopedia() {
  if (selectedText.value) {
    let rawSel = selectedText.value.trim();
    const full = textContent.value || '';
    // 尝试扩展为段落（当选择较短时）
    let paragraph = rawSel;
    if(rawSel.length < 40 && full.includes(rawSel)){
      const idx = full.indexOf(rawSel);
      if(idx>-1){
        let start = idx;
        let end = idx + rawSel.length;
        while(start>0 && full[start-1] !== '\n' && (idx - start) < 600) start--;
        while(end < full.length && full[end] !== '\n' && (end - idx) < 600) end++;
        paragraph = full.slice(start,end).trim();
      }
    }
    // 过长截断
    const MAX_LEN = 600;
    let clippedPara = paragraph.length > MAX_LEN ? (paragraph.slice(0,MAX_LEN) + '...') : paragraph;
    let clippedSel = rawSel.length > 200 ? (rawSel.slice(0,200)+'...') : rawSel;
  const esId = resolveEsId(props.file, props.fileId);
  const question = `[百科] 请基于文档内容回答与以下内容相关的背景、定义、关键要点：\n“${clippedSel}”\n\n原文片段：\n${clippedPara}`;
    ElMessage.info('已发送百科查询');
    hideContextMenu();
    // 打开 chat 面板，让 FileChatPanel 挂载并注册事件处理器
    window.dispatchEvent(new Event('activate-qa'));
    // 延迟发送百科查询事件，确保 FileChatPanel 能接收到（首次打开时可能尚未完成 mounted）
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('encyclopedia-qa', { detail: { text: question, selection: rawSel, paragraph, esId } }));
    }, 150);
  }
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
    console.log('ocrText result', txt);
    const finalText = (txt && typeof txt === 'string') ? txt : (txt?.text || txt?.result || txt?.content || '');
    ElMessage.info(finalText);
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