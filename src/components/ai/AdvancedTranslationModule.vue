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
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
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
  if (selection.toString().trim()) {
    selectedText.value = selection.toString().trim();
    selectedRange.value = selection.getRangeAt(0).cloneRange();
    showContextMenuAt(event);
    
    // Highlight corresponding text in other panel
    highlightCorrespondingText(selectedText.value);
  } else {
    hideContextMenu();
    clearHighlights();
  }
}

function showContextMenuAt(event) {
  showContextMenu.value = true;
  nextTick(() => {
    contextMenuStyle.value = {
      position: 'fixed',
      left: `${event.clientX}px`,
      top: `${event.clientY}px`,
      zIndex: 9999
    };
  });
}

function hideContextMenu() {
  showContextMenu.value = false;
  clearHighlights();
}

// Highlight corresponding text in the other panel
function highlightCorrespondingText(text) {
  // This is a simplified implementation
  // In a real app, you'd use more sophisticated text alignment
  const correspondingText = textAlignmentMap.value[text];
  if (correspondingText) {
    // Add highlighting logic here
    console.log('Highlighting corresponding text:', correspondingText);
  }
}

function clearHighlights() {
  // Clear all highlighting
  // Implementation depends on how you handle highlighting
}

// Context menu actions
async function lookupEncyclopedia() {
  if (!selectedText.value) return;
  
  try {
    // Open Wikipedia search in new tab
    const query = encodeURIComponent(selectedText.value);
    window.open(`https://zh.wikipedia.org/wiki/Special:Search?search=${query}`, '_blank');
  } catch (error) {
    ElMessage.error('百科查询失败');
  }
  hideContextMenu();
}

function markAsTerminology() {
  if (!selectedText.value) return;
  
  // Save to localStorage
  const terminologies = JSON.parse(localStorage.getItem('translation_terminologies') || '[]');
  if (!terminologies.includes(selectedText.value)) {
    terminologies.push(selectedText.value);
    localStorage.setItem('translation_terminologies', JSON.stringify(terminologies));
    
    // Add visual marker (underline)
    addTerminologyMarker();
    ElMessage.success('已标记为术语');
  }
  hideContextMenu();
}

function markAsWarning() {
  if (!selectedText.value) return;
  
  // Save to localStorage
  const warnings = JSON.parse(localStorage.getItem('translation_warnings') || '[]');
  if (!warnings.includes(selectedText.value)) {
    warnings.push(selectedText.value);
    localStorage.setItem('translation_warnings', JSON.stringify(warnings));
    
    // Add visual marker (warning icon)
    addWarningMarker();
    ElMessage.success('已标记为警告');
  }
  hideContextMenu();
}

function addCustomTag() {
  showCustomTagDialog.value = true;
  hideContextMenu();
}

function addTerminologyMarker() {
  // Add underline style to selected text
  if (selectedRange.value) {
    const span = document.createElement('span');
    span.className = 'terminology-marker';
    span.style.textDecoration = 'underline';
    span.style.textDecorationColor = '#409EFF';
    try {
      selectedRange.value.surroundContents(span);
    } catch (e) {
      // Handle case where range spans multiple elements
      console.warn('Could not add terminology marker');
    }
  }
}

function addWarningMarker() {
  // Add warning icon after selected text
  if (selectedRange.value) {
    const span = document.createElement('span');
    span.className = 'warning-marker';
    span.innerHTML = ' ⚠️';
    span.style.color = '#E6A23C';
    try {
      selectedRange.value.insertNode(span);
    } catch (e) {
      console.warn('Could not add warning marker');
    }
  }
}

// Save custom tag
function saveCustomTag() {
  if (!customTagName.value.trim() || !selectedText.value) return;
  
  const customTags = JSON.parse(localStorage.getItem('translation_custom_tags') || '{}');
  customTags[selectedText.value] = {
    name: customTagName.value,
    color: customTagColor.value,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('translation_custom_tags', JSON.stringify(customTags));
  
  // Add visual marker
  addCustomTagMarker();
  
  ElMessage.success('自定义标签已保存');
  showCustomTagDialog.value = false;
  customTagName.value = '';
  customTagColor.value = '#409EFF';
}

function addCustomTagMarker() {
  if (selectedRange.value) {
    const span = document.createElement('span');
    span.className = 'custom-tag-marker';
    span.style.backgroundColor = customTagColor.value;
    span.style.color = 'white';
    span.style.padding = '2px 4px';
    span.style.borderRadius = '3px';
    span.style.fontSize = '12px';
    span.innerHTML = selectedText.value + ` <small>${customTagName.value}</small>`;
    try {
      selectedRange.value.deleteContents();
      selectedRange.value.insertNode(span);
    } catch (e) {
      console.warn('Could not add custom tag marker');
    }
  }
}

// Settings management
function loadSettings() {
  const savedSettings = localStorage.getItem('translation_settings');
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings));
  }
}

function saveSettings() {
  localStorage.setItem('translation_settings', JSON.stringify(settings));
  applyFontSize();
  ElMessage.success('设置已保存');
  showSettings.value = false;
}

function applyFontSize() {
  if (sourceTextRef.value) {
    sourceTextRef.value.style.fontSize = `${settings.fontSize}px`;
  }
  if (targetTextRef.value) {
    targetTextRef.value.style.fontSize = `${settings.fontSize}px`;
  }
}
</script>

<style scoped>
.advanced-translation-module {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

/* Top Toolbar */
.translation-toolbar {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
}

.language-selectors {
  display: flex;
  align-items: center;
  gap: 12px;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-selector label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.swap-languages {
  display: flex;
  align-items: center;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Translation Content */
.translation-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.text-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
}

.text-panel:last-child {
  border-right: none;
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
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.text-editor:empty:before {
  content: attr(placeholder);
  color: #c0c4cc;
  pointer-events: none;
}

.translation-progress {
  padding: 8px 16px;
  border-top: 1px solid #e5e7eb;
}

/* Context Menu */
.context-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 120px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #303133;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

/* Terminology and warning markers */
.terminology-marker {
  text-decoration: underline;
  text-decoration-color: #409EFF;
  text-decoration-thickness: 2px;
}

.warning-marker {
  color: #E6A23C;
}

.custom-tag-marker {
  background-color: #409EFF;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}

/* Settings */
.setting-desc {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

/* Responsive */
@media (max-width: 768px) {
  .translation-content {
    flex-direction: column;
  }
  
  .text-panel {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .text-panel:last-child {
    border-bottom: none;
  }
  
  .language-selectors {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>