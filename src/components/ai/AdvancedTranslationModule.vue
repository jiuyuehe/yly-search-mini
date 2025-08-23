<template>
  <div class="advanced-translation-module">
    <!-- Top Toolbar (50px height) -->
    <div class="translation-toolbar">
      <div class="language-selectors">
        <div class="language-selector">
          <label>源语言</label>
          <el-select 
            v-model="sourceLanguage" 
            size="small" 
            @change="onSourceLanguageChange"
          >
            <el-option label="自动检测" value="auto" />
            <el-option label="English" value="en" />
            <el-option label="中文" value="zh" />
            <el-option label="Français" value="fr" />
            <el-option label="Español" value="es" />
            <el-option label="Deutsch" value="de" />
            <el-option label="日本語" value="ja" />
            <el-option label="Русский" value="ru" />
          </el-select>
        </div>
        <div class="swap-languages">
          <el-button 
            size="small" 
            circle 
            @click="swapLanguages"
            :disabled="sourceLanguage === 'auto'"
          >
            <el-icon><Sort /></el-icon>
          </el-button>
        </div>
        <div class="language-selector">
          <label>目标语言</label>
          <el-select 
            v-model="targetLanguage" 
            size="small" 
            @change="onTargetLanguageChange"
          >
            <el-option label="English" value="en" />
            <el-option label="中文" value="zh" />
            <el-option label="Français" value="fr" />
            <el-option label="Español" value="es" />
            <el-option label="Deutsch" value="de" />
            <el-option label="日本語" value="ja" />
            <el-option label="Русский" value="ru" />
          </el-select>
        </div>
      </div>
      <div class="toolbar-actions">
        <el-button 
          type="primary" 
          size="small" 
          @click="translateText"
          :loading="translating"
          :disabled="!sourceText.trim()"
        >
          翻译
        </el-button>
        <el-button 
          size="small" 
          circle 
          @click="showSettings = true"
        >
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Translation Text Boxes -->
    <div class="translation-content">
      <div class="text-panel source-panel">
        <div class="panel-header">
          <span class="panel-title">源文本</span>
          <span class="char-count">{{ sourceText.length }}/10000</span>
        </div>
        <div 
          ref="sourceTextRef"
          class="text-editor" 
          contenteditable
          @input="onSourceTextInput"
          @scroll="onSourceScroll"
          @mouseup="onTextSelection"
          @keyup="onTextSelection"
          @mousemove="onEditorHover($event, 'source')"
          @contextmenu.prevent.stop="onEditorContextMenu($event, 'source')"
          :placeholder="'请输入要翻译的文本...'"
        ></div>
        <div v-if="translating" class="translation-progress">
          <el-progress :percentage="translationProgress" size="small" />
        </div>
      </div>

      <div class="text-panel target-panel">
        <div class="panel-header">
          <span class="panel-title">翻译结果</span>
          <span class="char-count">{{ translatedText.length }}</span>
        </div>
        <div 
          ref="targetTextRef"
          class="text-editor" 
          contenteditable
          @input="onTargetTextInput"
          @scroll="onTargetScroll"
          @mouseup="onTextSelection"
          @keyup="onTextSelection"
          @mousemove="onEditorHover($event, 'target')"
          @contextmenu.prevent.stop="onEditorContextMenu($event, 'target')"
          :placeholder="'翻译结果将显示在这里...'"
        ></div>
      </div>
    </div>

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
      <div class="menu-item" @click="markAsTerminology">
        <el-icon><BookmarkIcon /></el-icon>
        标记术语
      </div>
      <div class="menu-item" @click="markAsWarning">
        <el-icon><Warning /></el-icon>
        标记警告
      </div>
      <div class="menu-item" @click="addCustomTag">
        <el-icon><Tag /></el-icon>
        自定义标签
      </div>
    </div>

    <!-- Settings Modal -->
    <el-dialog v-model="showSettings" title="翻译设置" width="600px">
      <el-form :model="settings" label-width="120px">
        <el-form-item label="翻译模型">
          <el-select v-model="settings.translationModel" placeholder="选择翻译模型">
            <el-option label="GPT-4" value="gpt-4" />
            <el-option label="Claude-3" value="claude-3" />
            <el-option label="Google Translate" value="google" />
          </el-select>
        </el-form-item>
        <el-form-item label="主题">
          <el-select v-model="settings.theme" placeholder="选择主题">
            <el-option label="亮色" value="light" />
            <el-option label="暗色" value="dark" />
          </el-select>
        </el-form-item>
        <el-form-item label="字体大小">
          <el-slider 
            v-model="settings.fontSize" 
            :min="12" 
            :max="20" 
            :step="1"
            show-input
          />
        </el-form-item>
        <el-form-item label="自动翻译">
          <el-switch v-model="settings.autoTranslate" />
          <span class="setting-desc">输入后自动触发翻译</span>
        </el-form-item>
        <el-form-item label="翻译延迟">
          <el-input-number 
            v-model="settings.translateDelay" 
            :min="0" 
            :max="5000" 
            :step="100"
            placeholder="毫秒"
          />
          <span class="setting-desc">自动翻译的延迟时间（毫秒）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Custom Tag Dialog -->
    <el-dialog v-model="showCustomTagDialog" title="添加自定义标签" width="400px">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';
import { ElMessage } from 'element-plus';
import { 
  Sort, 
  Setting, 
  Search, 
  Warning, 
  Document as Tag,
  Star as BookmarkIcon
} from '@element-plus/icons-vue';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  },
  initialSourceText: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['text-extracted']);

// Store
const aiStore = useAiToolsStore();

// Refs
const sourceTextRef = ref(null);
const targetTextRef = ref(null);
const contextMenuRef = ref(null);

// Language settings
const sourceLanguage = ref('auto');
const targetLanguage = ref('en');

// Text content
const sourceText = ref('');
const translatedText = ref('');

// Translation state
const translating = ref(false);
const translationProgress = ref(0);

// Context menu
const showContextMenu = ref(false);
const contextMenuStyle = ref({});
const selectedText = ref('');
const selectedRange = ref(null);

// Settings
const showSettings = ref(false);
const settings = reactive({
  translationModel: 'gpt-4',
  theme: 'light',
  fontSize: 14,
  autoTranslate: false,
  translateDelay: 500
});

// Custom tag dialog
const showCustomTagDialog = ref(false);
const customTagName = ref('');
const customTagColor = ref('#409EFF');

// Auto translate timer
let autoTranslateTimer = null;

// Text alignment maps for synchronized highlighting
const textAlignmentMap = ref({});

onMounted(async () => {
  // Initialize source text from props or extract from file
  if (props.initialSourceText) {
    sourceText.value = props.initialSourceText;
    updateSourceTextContent();
  } else if (props.fileId) {
    await extractTextFromFile();
  }
  
  // Load settings from localStorage
  loadSettings();
  
  // Apply font size
  applyFontSize();
  
  // Add click listener to hide context menu
  document.addEventListener('click', hideContextMenu);
});

// Watch for auto translate
watch(sourceText, () => {
  if (settings.autoTranslate && sourceText.value.trim()) {
    clearTimeout(autoTranslateTimer);
    autoTranslateTimer = setTimeout(() => {
      translateText();
    }, settings.translateDelay);
  }
});

// Extract text from file
async function extractTextFromFile() {
  try {
    const extractedText = await aiStore.extractText(props.fileId);
    sourceText.value = extractedText || '';
    updateSourceTextContent();
    emit('text-extracted', extractedText);
  } catch (error) {
    ElMessage.error('文本提取失败');
    console.error('Failed to extract text:', error);
  }
}

// Update source text content in DOM
function updateSourceTextContent() {
  if (sourceTextRef.value) {
    sourceTextRef.value.innerHTML = sourceText.value;
  }
}

// Update translated text content in DOM
function updateTargetTextContent() {
  if (targetTextRef.value) {
    targetTextRef.value.innerHTML = translatedText.value;
  }
}

// Source text input handler
function onSourceTextInput(event) {
  sourceText.value = event.target.innerText || '';
}

// Target text input handler  
function onTargetTextInput(event) {
  translatedText.value = event.target.innerText || '';
}

// Language change handlers
function onSourceLanguageChange() {
  if (settings.autoTranslate && sourceText.value.trim()) {
    translateText();
  }
}

function onTargetLanguageChange() {
  if (settings.autoTranslate && sourceText.value.trim()) {
    translateText();
  }
}

// Swap languages
function swapLanguages() {
  if (sourceLanguage.value === 'auto') return;
  
  const temp = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = temp;
  
  // Also swap text content
  const tempText = sourceText.value;
  sourceText.value = translatedText.value;
  translatedText.value = tempText;
  
  updateSourceTextContent();
  updateTargetTextContent();
}

// Main translation function
async function translateText() {
  if (!sourceText.value.trim()) {
    ElMessage.warning('请输入要翻译的文本');
    return;
  }
  
  translating.value = true;
  translationProgress.value = 0;
  translatedText.value = '';
  
  try {
    // Split text into sentences for streaming
    const sentences = splitIntoSentences(sourceText.value);
    let translatedSentences = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (sentence.trim()) {
        let sentenceTranslation = '';
        
        await aiStore.translateText(sentence, targetLanguage.value, (chunk) => {
          sentenceTranslation = chunk;
          translatedSentences[i] = sentenceTranslation;
          translatedText.value = translatedSentences.join(' ');
          updateTargetTextContent();
        });
        
        // Update progress
        translationProgress.value = Math.round(((i + 1) / sentences.length) * 100);
      }
    }
    
    // Build text alignment map for synchronized highlighting
    buildTextAlignmentMap(sentences, translatedSentences);
    
    ElMessage.success('翻译完成');
  } catch (error) {
    ElMessage.error('翻译失败，请重试');
    console.error('Translation failed:', error);
  } finally {
    translating.value = false;
    translationProgress.value = 100;
  }
}

// Split text into sentences
function splitIntoSentences(text) {
  // Simple sentence splitting (can be enhanced with NLP libraries)
  return text.split(/[.!?。！？]+/).filter(s => s.trim());
}

// Build text alignment map for synchronized highlighting
function buildTextAlignmentMap(sourceSentences, translatedSentences) {
  textAlignmentMap.value = {};
  sourceSentences.forEach((sentence, index) => {
    if (translatedSentences[index]) {
      textAlignmentMap.value[sentence.trim()] = translatedSentences[index].trim();
    }
  });
}

// Synchronized scrolling
function onSourceScroll(event) {
  if (targetTextRef.value) {
    const scrollPercentage = event.target.scrollTop / (event.target.scrollHeight - event.target.clientHeight);
    targetTextRef.value.scrollTop = scrollPercentage * (targetTextRef.value.scrollHeight - targetTextRef.value.clientHeight);
  }
}

function onTargetScroll(event) {
  if (sourceTextRef.value) {
    const scrollPercentage = event.target.scrollTop / (event.target.scrollHeight - event.target.clientHeight);
    sourceTextRef.value.scrollTop = scrollPercentage * (sourceTextRef.value.scrollHeight - sourceTextRef.value.clientHeight);
  }
}

// Text selection and context menu
function onTextSelection(event) {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    const txt = selection.toString().trim();
    selectedText.value = txt;
    try { selectedRange.value = selection.getRangeAt(0).cloneRange(); } catch { /* ignore */ }
    highlightSelectionBoth(txt);
    showContextMenuAt(event);
  } else {
    hideContextMenu();
    clearCrossHighlights();
  }
}

// ==== 新高亮实现（替换旧实现） START ====
const CROSS_CLASS = 'cross-highlight';            // 悬停/句子同步黄色
const SELECTION_CLASS = 'selection-highlight';    // 划词蓝色选中
let hoverRaf = null;

function unwrapSpans(editor, className) {
  if (!editor) return;
  editor.querySelectorAll('span.' + className).forEach(span => {
    const text = document.createTextNode(span.textContent || '');
    span.replaceWith(text);
  });
}
function clearCrossHighlights() { unwrapSpans(sourceTextRef.value, CROSS_CLASS); unwrapSpans(targetTextRef.value, CROSS_CLASS); }
function clearSelectionHighlights() { unwrapSpans(sourceTextRef.value, SELECTION_CLASS); unwrapSpans(targetTextRef.value, SELECTION_CLASS); }

function getTextNodeByOffset(root, offset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let curOffset = 0; let node;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (curOffset + len >= offset) {
      return { node, offset: offset - curOffset };
    }
    curOffset += len;
  }
  return null;
}
function wrapRangeByText(editor, text, className) {
  if (!editor || !text) return;
  const content = editor.textContent;
  const idx = content.indexOf(text);
  if (idx === -1) return;
  const startPos = getTextNodeByOffset(editor, idx);
  const endPos = getTextNodeByOffset(editor, idx + text.length);
  if (!startPos || !endPos) return;
  const range = document.createRange();
  range.setStart(startPos.node, startPos.offset);
  range.setEnd(endPos.node, endPos.offset);
  const span = document.createElement('span');
  span.className = className;
  try { range.surroundContents(span); } catch { /* ignore */ }
}

function highlightSentenceBoth(sentence) {
  if (!sentence) return;
  clearCrossHighlights();
  wrapRangeByText(sourceTextRef.value, sentence, CROSS_CLASS);
  // 简单策略：目标框中尝试同样句子；若未找到且存在映射，用映射
  const mapped = textAlignmentMap.value[sentence.trim()] || sentence;
  wrapRangeByText(targetTextRef.value, mapped, CROSS_CLASS);
}

function highlightSelectionBoth(text) {
  if (!text) return;
  clearSelectionHighlights();
  wrapRangeByText(sourceTextRef.value, text, SELECTION_CLASS);
  const mapped = textAlignmentMap.value[text.trim()] || text;
  wrapRangeByText(targetTextRef.value, mapped, SELECTION_CLASS);
}

function getSentenceAtPoint(editor, clientX, clientY) {
  if (!editor) return '';
  const range = document.caretRangeFromPoint ? document.caretRangeFromPoint(clientX, clientY) : null;
  if (!range) return '';
  const pre = document.createRange();
  pre.selectNodeContents(editor);
  pre.setEnd(range.startContainer, range.startOffset);
  const offset = pre.toString().length;
  const full = editor.textContent || '';
  const punct = /[.!?。！？]/;
  let start = full.lastIndexOf('\n', offset - 1);
  for (let i = offset - 1; i >= 0 && start < 0; i--) { if (punct.test(full[i])) { start = i; break; } }
  let end = full.indexOf('\n', offset);
  for (let i = offset; i < full.length && end < 0; i++) { if (punct.test(full[i])) { end = i + 1; break; } }
  if (start < 0) start = 0; else start += 1;
  if (end < 0) end = full.length;
  return full.substring(start, end).trim();
}

function onEditorHover(e, which) {
  if (hoverRaf) return;
  hoverRaf = requestAnimationFrame(() => {
    hoverRaf = null;
    const editor = which === 'source' ? sourceTextRef.value : targetTextRef.value;
    const sentence = getSentenceAtPoint(editor, e.clientX, e.clientY);
    if (sentence) highlightSentenceBoth(sentence);
  });
}
function onEditorContextMenu(e, which) {
  const sel = window.getSelection();
  if (!sel || !sel.toString().trim()) {
    const editor = which === 'source' ? sourceTextRef.value : targetTextRef.value;
    const sentence = getSentenceAtPoint(editor, e.clientX, e.clientY);
    if (sentence) highlightSentenceBoth(sentence);
  }
  showContextMenuAt(e);
}
// ==== 新高亮实现 END ====

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('translation_settings');
  if (saved) {
    try { Object.assign(settings, JSON.parse(saved)); } catch { /* ignore */ }
  }
}

// Apply font size
function applyFontSize() {
  if (sourceTextRef.value) sourceTextRef.value.style.fontSize = settings.fontSize + 'px';
  if (targetTextRef.value) targetTextRef.value.style.fontSize = settings.fontSize + 'px';
}

// Show context menu at specified event
function showContextMenuAt(event) {
  showContextMenu.value = true;
  nextTick(() => {
    contextMenuStyle.value = { position:'fixed', left: event.clientX + 'px', top: event.clientY + 'px', zIndex: 9999 };
  });
}

// Hide context menu
function hideContextMenu() { showContextMenu.value = false; }

// 组件卸载清理
onUnmounted(() => { document.removeEventListener('click', hideContextMenu); });
</script>

<style scoped>
/* 原样式恢复 + 补充 cross-highlight */
.advanced-translation-module { display:flex; flex-direction:column; height:100%; background:#fff; }
.translation-toolbar { height:50px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; border-bottom:1px solid #e5e7eb; background:#f8f9fa; }
.language-selectors { display:flex; align-items:center; gap:12px; }
.language-selector { display:flex; align-items:center; gap:8px; }
.language-selector label { font-size:14px; color:#606266; white-space:nowrap; }
.swap-languages { display:flex; align-items:center; }
.toolbar-actions { display:flex; align-items:center; gap:8px; }
.translation-content { display:flex; flex:1; overflow:hidden; width:100%; min-width:0; }
.text-panel { flex:1; display:flex; flex-direction:column; border-right:1px solid #e5e7eb; min-width:0; }
.text-panel:last-child { border-right:none; }
.panel-header { height:42px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; border-bottom:1px solid #e5e7eb; background:#fafafa; }
.panel-title { font-weight:600; font-size:14px; color:#303133; }
.char-count { font-size:12px; color:#909399; }
.text-editor { flex:1; padding:16px; border:none; outline:none; resize:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; font-size:14px; line-height:1.6; overflow:auto; white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere; min-width:0; box-sizing:border-box; }
.text-editor:focus { outline:none; }
.text-editor:empty:before { content:attr(placeholder); color:#c0c4cc; pointer-events:none; }
.text-editor::-webkit-scrollbar { width:8px; }
.translation-progress { padding:8px 16px; border-top:1px solid #e5e7eb; }
.context-menu { background:#fff; border:1px solid #e5e7eb; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,.15); padding:4px 0; min-width:120px; }
.menu-item { display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; font-size:14px; color:#303133; transition:background-color .2s; }
.menu-item:hover { background:#f5f7fa; }
.terminology-marker { text-decoration:underline; text-decoration-color:#409EFF; text-decoration-thickness:2px; }
.warning-marker { color:#E6A23C; }
.custom-tag-marker { background:#409EFF; color:#fff; padding:2px 4px; border-radius:3px; font-size:12px; }
.setting-desc { margin-left:8px; font-size:12px; color:#909399; }
.cross-highlight { background:#ffe98a; border-radius:2px; padding:1px 0; }
.selection-highlight { background:#b3d8ff; border-radius:2px; padding:1px 0; }
.text-editor span { font:inherit; white-space:inherit; }
@media (max-width:768px){
  .translation-content { flex-direction:column; }
  .text-panel { border-right:none; border-bottom:1px solid #e5e7eb; }
  .text-panel:last-child { border-bottom:none; }
  .language-selectors { flex-wrap:wrap; gap:8px; }
}
</style>