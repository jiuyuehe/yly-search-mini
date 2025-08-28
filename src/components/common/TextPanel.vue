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
      <div class="menu-item" @click="markAsTerminology">
        <el-icon><BookmarkIcon /></el-icon>
        术语入库
      </div>
      <div class="menu-item" @click="addCustomTag">
        <el-icon><Tag /></el-icon>
        标签入库
      </div>
      <div class="menu-item" @click="copySelectedText">
        <el-icon><CopyDocument /></el-icon>
        复制文本
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
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Search, 
  Download,
  CopyDocument,
  Document as Tag,
  Star as BookmarkIcon
} from '@element-plus/icons-vue';

const props = defineProps({
  title: {
    type: String,
    default: '文本内容'
  },
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

const emit = defineEmits(['update:content', 'text-selected']);

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

// Custom tag dialog
const showCustomTagDialog = ref(false);
const customTagName = ref('');
const customTagColor = ref('#409EFF');

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
    const rect = textEditorRef.value.getBoundingClientRect();
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

// Encyclopedia lookup
function lookupEncyclopedia() {
  if (selectedText.value) {
    ElMessage.info(`正在查询: ${selectedText.value}`);
    // TODO: Implement encyclopedia lookup API call
    hideContextMenu();
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
    customTagName.value = selectedText.value;
    showCustomTagDialog.value = true;
    hideContextMenu();
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
</style>