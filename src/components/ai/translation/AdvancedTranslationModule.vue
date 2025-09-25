<template>
  <div class="advanced-translation-module" :class="{ 'theme-dark': settings.theme === 'dark' }">
    <div class="translation-toolbar">
      <div class="language-selectors">
        <div class="language-selector">
          <label>源语言</label>
          <el-select v-model="sourceLanguage" size="small" @change="onSourceLanguageChange">
            <el-option label="自动检测" value="auto"/>
            <el-option label="English" value="en"/>
            <el-option label="中文" value="zh"/>
            <el-option label="Français" value="fr"/>
            <el-option label="Español" value="es"/>
            <el-option label="Deutsch" value="de"/>
            <el-option label="日本語" value="ja"/>
            <el-option label="Русский" value="ru"/>
            <el-option label="Italiano" value="it"/>
            <el-option label="한국어" value="ko"/>
            <el-option label="Português" value="pt"/>
          </el-select>
        </div>
        <div class="swap-languages">
          <el-button size="small" circle disabled title="当前仅支持翻译为中文">
            <el-icon>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 7H4l3-3-3 3 3 3-3-3" stroke="currentColor" fill="none"/>
                <path d="M16 17h4l-3 3 3-3-3-3 3 3" stroke="currentColor" fill="none"/>
                <path d="M5 12h14" stroke-width="1.5" opacity="0.5"/>
              </svg>
            </el-icon>
          </el-button>
        </div>
        <div class="language-selector">
          <label>目标语言</label>
          <el-select v-model="targetLanguage" size="small" disabled placeholder="中文">
            <el-option label="中文" value="zh"/>
          </el-select>
        </div>
      </div>
      <div class="lang-display">{{ languageSummary }}</div>
      <div v-if="translating" class="top-progress">
        <el-progress :percentage="translationProgress" :stroke-width="6" style="width:160px"/>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" size="small" @click="translateText" :loading="translating" :disabled="!sourceText.trim()">翻译</el-button>
        <el-button v-if="translating" type="danger" size="small" @click="cancelTranslation">取消</el-button>
        <el-button size="small" @click="openGlossaryManager"><el-icon><Collection/></el-icon>术语库</el-button>
        <el-button size="small" circle @click="showSettings = true"><el-icon><Setting/></el-icon></el-button>
      </div>
    </div>

    <div class="translation-content">
      <div class="text-panel source-panel">
        <div class="panel-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="panel-title">源文本</span>
            <el-button size="mini" type="text" v-if="!sourceEditable" @click="enterSourceEdit">编辑</el-button>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="char-count">{{ sourceText.length }}</span>
            <cloud-save v-if="!sourceEditable" :file="file" type="create" :defaultFileName="(file && file.fileName) ? (file.fileName.replace(/\.[^/.]+$/, '') + '-文本.txt') : ''" ref="sourceCloudSaveRef" @confirm="onSourceCloudSaveConfirm"/>
            <el-button size="mini" type="primary" v-if="sourceEditable" @click="finishSourceEdit">完成</el-button>
          </div>
        </div>
  <div ref="sourceTextRef" class="text-editor markdown-body markdown-body-root" :contenteditable="sourceEditable" @input="onSourceTextInput" @scroll="onSourceScroll" @mouseup="onSourceMouseUp" @keyup="onSourceMouseUp" @contextmenu.prevent.stop="onEditorContextMenu($event, 'source')" :placeholder="'请输入要翻译的文本...'"></div>
      </div>
      <div class="text-panel target-panel">
        <div class="panel-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="panel-title">译文</span>
            <el-button size="mini" type="text" v-if="!targetEditable" @click="enterEdit">编辑</el-button>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="char-count">{{ translatedText.length }}</span>
            <cloud-save v-if="!targetEditable" :file="file" type="create" ref="cloudSaveRef" @confirm="onCloudSaveConfirm"/>
            <el-button size="mini" type="primary" v-else @click="finishEdit">保存</el-button>
          </div>
        </div>
  <div ref="targetTextRef" class="text-editor target markdown-body markdown-body-root" :class="{loading: translating}" :contenteditable="targetEditable" @input="onTargetInput" @scroll="onTargetScroll" @mouseup="onTargetMouseUp" @keyup="onTargetMouseUp" @contextmenu.prevent.stop="onEditorContextMenu($event, 'target')"></div>
      </div>
    </div>

    <el-dialog v-model="showSettings" title="翻译设置" width="600px">
      <el-form :model="settings" label-width="120px">
        <el-form-item label="翻译接口">
          <el-select v-model="settings.provider" placeholder="选择翻译接口">
            <el-option label="系统内置API" value="builtin"/>
            <el-option label="讯飞翻译API" value="xunfei"/>
          </el-select>
        </el-form-item>
        <el-form-item label="主题">
          <el-select v-model="settings.theme" placeholder="选择主题">
            <el-option label="亮色" value="light"/>
            <el-option label="暗色" value="dark"/>
          </el-select>
        </el-form-item>
        <el-form-item label="字体大小"><el-slider v-model="settings.fontSize" :min="12" :max="20" :step="1" show-input /></el-form-item>
        <el-form-item label="自动翻译">
          <el-switch v-model="settings.autoTranslate"/>
          <span class="setting-desc">输入后自动触发翻译</span>
        </el-form-item>
        <el-form-item label="翻译延迟">
          <el-input-number v-model="settings.translateDelay" :min="0" :max="5000" :step="100" placeholder="毫秒" />
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

    <el-dialog v-model="showCustomTagDialog" title="添加自定义标签" width="400px">
      <el-form>
        <el-form-item label="标签名称"><el-input v-model="customTagName" placeholder="输入标签名称"/></el-form-item>
        <el-form-item label="标签颜色"><el-color-picker v-model="customTagColor"/></el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCustomTagDialog = false">取消</el-button>
          <el-button type="primary" @click="saveCustomTag">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <glossary-manager ref="glossaryManagerRef" @changed="onGlossaryChanged" />
  </div>
</template>

<script setup>
// 高级翻译模块（补充：引入 GitHub Markdown 样式使表格/代码块显示更清晰）
import {ref, reactive, onMounted, watch, onUnmounted, nextTick} from 'vue';
import MarkdownIt from 'markdown-it';
import {useAiToolsStore} from '../../../stores/aiTools';
import {ElMessage} from 'element-plus';
import { Setting, Collection } from '@element-plus/icons-vue';
import {aiService} from '../../../services/aiService';
import CloudSave from '../../preview/CloudSave.vue';
import {uploadStream} from '../../../services/uploadStream';
import GlossaryManager from './GlossaryManager.vue';
import 'github-markdown-css/github-markdown.css';

const props = defineProps({
  file: {type: Object, default: null},
  fileId: {type: String, required: true},
  esId: {type: String, default: ''},
  active: {type: Boolean, default: false},
  initialSourceText: {type: String, default: ''},
  initialTranslation: {type: String, default: ''}
});

const emit = defineEmits(['text-extracted']);
// Expose methods for parent components (e.g., re-translate trigger)
defineExpose({
  translateText
});

// Store
const aiStore = useAiToolsStore();

// Refs
const sourceTextRef = ref(null);
const targetTextRef = ref(null);
const contextMenuRef = ref(null);
const cloudSaveRef = ref(null);
const sourceCloudSaveRef = ref(null);

// source editable state
const sourceEditable = ref(false);
const targetEditable = ref(false);

// markdown 渲染实例 & 行定位
const md = new MarkdownIt({ html:false, linkify:true, breaks:true });
function renderMarkdown(text){
  if(!text) return '';
  try { return md.render(text); } catch { return text.replace(/</g,'&lt;'); }
}

// 高亮行的 class
const LINE_HIGHLIGHT_CLASS = 'line-highlight-active';

function splitLines(text){
  return (text||'').replace(/\r\n/g,'\n').split(/\n/);
}

function rebuildEditorHtml(editor, text){
  // 根据编辑状态决定使用纯文本还是 markdown 渲染
  if(!editor) return;
  if(editor.getAttribute('contenteditable') === 'true'){
    editor.innerText = text;
    return;
  }
  editor.innerHTML = renderMarkdown(text);
}

function enterSourceEdit() {
  sourceEditable.value = true;
  nextTick(() => {
    if (sourceTextRef.value) {
      // 进入编辑模式时将之前渲染后的 HTML 恢复为原始 Markdown 源文
      // 这样可以看到诸如 **加粗**、`代码`、# 标题 等原始标记
      sourceTextRef.value.innerText = sourceText.value || '';
      sourceTextRef.value.focus();
      placeCaretAtEnd(sourceTextRef.value); // 光标定位末尾，方便继续编辑
    }
  });
}

async function finishSourceEdit() {
  // 结束源文本编辑并保存到后端（固定 esId = 19public226）
  const esId = props.esId || props.fileId;
  sourceEditable.value = false;
  // 保存后再重新渲染为 Markdown（延迟一个 tick 等 contenteditable 关闭）
  nextTick(() => updateSourceTextContent());
  try {
    const res = await aiService.saveSourceContent(esId, sourceText.value);
    if(res?.success){
      ElMessage.success('源文本已保存');
    } else {
      ElMessage.warning(res?.message || '源文本保存失败');
    }
  } catch(e){
    console.warn('save source failed', e);
    ElMessage.error('保存源文本异常');
  }
  try {
    emit('text-extracted', sourceText.value);
    emit('update-file-contents', {fileId: props.fileId, content: sourceText.value});
  } catch(e){
    console.warn('finishSourceEdit emit failed', e);
  }
}



// handler for source cloud save confirm
async function onSourceCloudSaveConfirm(targetNode) {
  if (!targetNode) {
    ElMessage.error('未选择目标目录');
    return;
  }
  try {
    const data = sourceText.value || '';
    const filename = (targetNode && targetNode.fileName) ? targetNode.fileName : ((file && file.fileName) ? (file.fileName.replace(/\.[^/.]+$/, '') + '-文本.txt') : `source_${new Date().toISOString().slice(0, 10)}.txt`);
    const fileObj = new File([data], filename, {type: 'text/plain', lastModified: Date.now()});
    const param = {
      fileCategory: targetNode.fileCategory || 'personal',
      fileSize: fileObj.size,
      fileName: fileObj.name,
      uoType: 2
    };
    ElMessage.info('开始上传源文本到云盘...');
    const resp = await uploadStream({file: fileObj, param});
    if (resp && (resp.status && String(resp.status).startsWith('err_'))) {
      ElMessage.error('上传失败: ' + (resp.msg || resp.message || resp.status));
    } else {
      ElMessage.success('已保存到云盘');
    }
  } catch (e) {
    console.error('uploadStream error', e);
    ElMessage.error('上传失败');
  }
}

// target editable state
// const targetEditable 重复定义移除（已在上方与 sourceEditable 一起声明）

function placeCaretAtEnd(el) {
  if (!el) return;
  el.focus();
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) { /* ignore */
  }
}

function enterEdit() {
  targetEditable.value = true;
  nextTick(() => {
    if (targetTextRef.value) {
      // 进入译文编辑模式时同样恢复为原始译文 Markdown 源
      targetTextRef.value.innerText = translatedText.value || '';
      targetTextRef.value.focus();
      placeCaretAtEnd(targetTextRef.value);
    }
  });
}

async function finishEdit() {
  targetEditable.value = false; // preserve model
  // push model back to DOM
  // 退出编辑模式后按 Markdown 渲染译文
  nextTick(() => {
    updateTargetTextContent();
  });
  // 保存译文到后端缓存并通知父组件更新 fileContents
  try {
    const esId = props.esId || props.fileId;
    if (esId) {
      // try save translation via aiService (existing endpoint)
      const res = await aiService.saveTranslation(esId, translatedText.value, targetLanguage.value);
      // aiService.saveTranslation returns { success:true } on success
      if (res && res.success) {
        ElMessage.success('译文已保存到后台');
      } else {
        // still continue to emit local update
        ElMessage.info('未能保存到后台，仅本地同步');
      }
    }
    // emit translated to update parent UI and fileData
    emit('translated', translatedText.value);
    emit('update-file-contents', {fileId: props.fileId, content: translatedText.value});
  } catch (e) {
    console.warn('finishEdit save failed', e);
    ElMessage.error('保存译文失败');
  }
}

function onTargetInput(e) {
  translatedText.value = e.target.innerText || '';
}

// handler invoked when CloudSave confirm triggers save (we'll call upload here)
async function onCloudSaveConfirm(targetNode) {
  // targetNode is selected folder data from CloudSave
  if (!targetNode) {
    ElMessage.error('未选择目标目录');
    return;
  }
  try {
    const data = translatedText.value || '';
    const filename = (targetNode && targetNode.fileName) ? targetNode.fileName : `translation_${new Date().toISOString().slice(0, 10)}.txt`;
    const file = new File([data], filename, {type: 'text/plain', lastModified: Date.now()});
    const param = {
      fileCategory: targetNode.fileCategory || 'personal',
      fileSize: file.size,
      fileName: file.name,
      uoType: 2
    };
    ElMessage.info('开始上传到云盘...');
    const resp = await uploadStream({file, param});
    // check response for error pattern
    if (resp && (resp.status && String(resp.status).startsWith('err_'))) {
      ElMessage.error('上传失败: ' + (resp.msg || resp.message || resp.status));
    } else {
      ElMessage.success('已保存到云盘');
    }
  } catch (e) {
    console.error('uploadStream error', e);
    ElMessage.error('上传失败');
  }
}

// Language settings
const sourceLanguage = ref('auto'); // 默认自动检测
const targetLanguage = ref('zh'); // 锁定中文

// Text content
const sourceText = ref('');
const translatedText = ref('');
let initTried = false;

// Translation state
const translating = ref(false);
const translationProgress = ref(0);
const cancelRequested = ref(false);
const sentenceTranslations = ref([]); // 存放每句译文

// Context menu
const showContextMenu = ref(false);
const contextMenuStyle = ref({});
const selectedText = ref('');
const selectedRange = ref(null);

// Settings
const showSettings = ref(false);
const settings = reactive({
  provider: 'builtin', // builtin | xunfei
  theme: 'light',
  fontSize: 14,
  autoTranslate: false,
  translateDelay: 500
});

// 语言名称映射与摘要显示
import {computed} from 'vue';

const languageNameMap = {
  auto: '自动检测',
  zh: '中文',
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  ja: '日本語',
  ru: 'Русский',
  it: 'Italiano',
  ko: '한국어',
  pt: 'Português'
};
const languageSummary = computed(() => `${languageNameMap[sourceLanguage.value] || sourceLanguage.value} → ${languageNameMap[targetLanguage.value] || targetLanguage.value}`);

// Custom tag dialog
const showCustomTagDialog = ref(false);
const customTagName = ref('');
const customTagColor = ref('#409EFF');

// Glossary manager (external component)
const glossaryManagerRef = ref(null);
function openGlossaryManager(){ glossaryManagerRef.value && glossaryManagerRef.value.open && glossaryManagerRef.value.open(); }
function onGlossaryChanged(){ /* 可在此触发重新标注 */ }
// Custom tags storage (simple local list)
const customTags = ref([]);

// Auto translate timer
let autoTranslateTimer = null;

// Text alignment maps for synchronized highlighting
const textAlignmentMap = ref({});

let _ignoreNextDocumentClick = false;
let _suppressSelectionClear = false;

function onDocumentClick(e) {
  if (_ignoreNextDocumentClick) {
    _ignoreNextDocumentClick = false;
    return;
  }
  hideContextMenu();
}

onMounted(async () => {
  loadSettings();
  applyFontSize();
  applyTheme();
  // use a wrapped document click handler so we can ignore the immediate click that
  // sometimes follows contextmenu on some platforms/browsers
  document.addEventListener('click', onDocumentClick);
  if (props.active) {
    await initLoad();
  }
});
watch(() => props.fileId, () => {
  initTried = false;
  if (props.active) initLoad();
});
watch(() => props.active, (v) => {
  if (v) {
    // 每次激活时优先从 localStorage 读取配置并应用
    loadSettings();
    applyFontSize();
    applyTheme();
    initLoad();
  }
});

async function initLoad() {
  if (initTried) return;
  initTried = true;
  // 初始化源文本
  if (props.initialSourceText) {
    sourceText.value = props.initialSourceText;
  } else if (props.fileId) {
    await extractTextFromFile();
  }
  updateSourceTextContent();
  // 初始化已存在翻译
  if (props.initialTranslation) {
    translatedText.value = props.initialTranslation;
    updateTargetTextContent();
  }
  detectSourceLang();
  await loadCachedOrTranslate();
  // 术语逻辑已抽离至 GlossaryManager
}

function detectSourceLang() {
  if (sourceLanguage.value !== 'auto') return; // 只有 auto 才自动检测
  const txt = sourceText.value || '';
  if (!txt.trim()) return;
  const chineseChars = (txt.match(/[\u4e00-\u9fa5]/g) || []).length;
  const ratio = chineseChars / Math.max(1, txt.length);
  if (ratio > 0.25) {
    sourceLanguage.value = 'zh';
  } else {
    sourceLanguage.value = 'en';
  }
}

async function loadCachedOrTranslate() {
  if (!props.active) return; // 仅在激活时执行
  if (!sourceText.value.trim()) return;
  try {
    const esId = props.esId || props.fileId; // 正确传递 esId
    if (esId) {
      const {aiService} = await import('../../../services/aiService');
      const cached = await aiService.fetchCachedTranslation(esId);
      if (cached && cached.translation) {
        translatedText.value = cached.translation;
        emit('translated', translatedText.value);
        updateTargetTextContent();
        return;
      }
    }
    // 如果源目标语言相同，直接复制
    if (sourceLanguage.value === targetLanguage.value) {
      translatedText.value = sourceText.value;
      emit('translated', translatedText.value);
      updateTargetTextContent();
      return;
    }

    // 仅当设置允许自动翻译时才触发翻译
    if (settings.autoTranslate) {
      await translateText();
    }
  } catch (e) {
    console.warn('loadCachedOrTranslate failed', e);
  }
}

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
  if (!sourceTextRef.value) return;
  rebuildEditorHtml(sourceTextRef.value, sourceText.value);
}

// Update translated text content in DOM
function updateTargetTextContent() {
  if (!targetTextRef.value) return;
  rebuildEditorHtml(targetTextRef.value, translatedText.value);
}

// Source text input handler
function onSourceTextInput(event) {
  sourceText.value = event.target.innerText || '';
}

// Target text input handler  
// onTargetTextInput 移除（译文外部展示）

// Language change handlers
function onSourceLanguageChange() {
  if (settings.autoTranslate && sourceText.value.trim()) {
    translateText();
  }
}


// Swap languages

// Main translation function
async function translateText() {
  if (translating.value) return; // 避免重复触发
  if (!sourceText.value.trim()) {
    ElMessage.warning('请输入要翻译的文本');
    return;
  }
  if (sourceLanguage.value === targetLanguage.value) {
    translatedText.value = sourceText.value;
    updateTargetTextContent();
    return;
  }

  translating.value = true;
  translationProgress.value = 0;
  translatedText.value = '';
  cancelRequested.value = false;
  sentenceTranslations.value = [];

  try {
    // 按段落拆分（空行分隔）
    const paragraphs = splitIntoParagraphs(sourceText.value);
    let translatedParagraphs = [];

    if (settings.provider === 'builtin') {
      const {aiService} = await import('../../../services/aiService');
      for (let i = 0; i < paragraphs.length; i++) {
        if (cancelRequested.value) break;
        const paragraph = paragraphs[i];
        sentenceTranslations.value[i] = '';
        if (paragraph.trim()) {
          await aiService.translateText(paragraph, targetLanguage.value, (chunk) => {
            sentenceTranslations.value[i] = chunk;
            translatedParagraphs[i] = chunk;
            translatedText.value = sentenceTranslations.value.join('\n\n');
            emit('translated', translatedText.value);
            updateTargetTextContent();
          });
          translationProgress.value = Math.round(((i + 1) / paragraphs.length) * 100);
        }
      }
    } else if (settings.provider === 'xunfei') {
      // 调用讯飞批量接口一次性翻译整段
      try {
        const {aiService} = await import('../../../services/aiService');
        const xfResPromise = aiService.translateWithXunfei(sourceText.value, sourceLanguage.value === 'auto' ? '' : sourceLanguage.value, targetLanguage.value);
        const xfRes = await xfResPromise;
        if (cancelRequested.value) throw new Error('cancelled');
        if (xfRes?.sentences && Array.isArray(xfRes.sentences)) {
          translatedParagraphs = xfRes.sentences.map(s => s.target || s.tgt || s.translation || '');
          sentenceTranslations.value = [...translatedParagraphs];
          translatedText.value = translatedParagraphs.join('\n\n');
          emit('translated', translatedText.value);
          updateTargetTextContent();
          translationProgress.value = 100;
        } else if (xfRes?.text) {
          translatedText.value = xfRes.text;
          emit('translated', translatedText.value);
          updateTargetTextContent();
          translationProgress.value = 100;
        } else {
          throw new Error('讯飞返回结构不符合预期');
        }
      } catch (e) {
        console.warn('Xunfei translate failed fallback to builtin', e);
        const {aiService: aiSvcFallback} = await import('../../../services/aiService');
        for (let i = 0; i < paragraphs.length; i++) {
          if (cancelRequested.value) break;
          const paragraph = paragraphs[i];
          sentenceTranslations.value[i] = '';
          if (paragraph.trim()) {
            await aiSvcFallback.translateText(paragraph, targetLanguage.value, (chunk) => {
              sentenceTranslations.value[i] = chunk;
              translatedParagraphs[i] = chunk;
              translatedText.value = sentenceTranslations.value.join('\n\n');
              emit('translated', translatedText.value);
              updateTargetTextContent();
            });
            translationProgress.value = Math.round(((i + 1) / paragraphs.length) * 100);
          }
        }
      }
    }

    // Build text alignment map for synchronized highlighting (按段落)
    buildTextAlignmentMap(paragraphs, translatedParagraphs);

    if (cancelRequested.value) {
      ElMessage.info('翻译已取消');
    } else {
      try {
        const esId = props.esId || props.fileId;
        if (esId) {
          const {aiService} = await import('../../../services/aiService');
          await aiService.saveTranslation(esId, translatedText.value, targetLanguage.value);
        }
      } catch (e) {
        console.warn('save translation cache failed', e);
      }
      ElMessage.success('翻译完成');
    }
  } catch (error) {
    ElMessage.error('翻译失败，请重试');
    console.error('Translation failed:', error);
  } finally {
    translating.value = false;
    if (!cancelRequested.value) translationProgress.value = 100; else translationProgress.value = Math.min(99, translationProgress.value);
  }
}

function cancelTranslation() {
  if (!translating.value) return;
  cancelRequested.value = true;
  ElMessage.info('正在取消翻译...');
}

// 按段落拆分：优先使用两个及以上连续换行作为段落分隔，否则退化为单行列表
function splitIntoParagraphs(text) {
  if (!text) return [];
  const norm = text.replace(/\r\n/g, '\n');
  const parts = norm.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return parts.length <= 1 ? norm.split(/\n/).map(l => l.trim()).filter(Boolean) : parts;
}

// 构建段落对齐映射（简化：索引对应）
function buildTextAlignmentMap(sourceSentences, translatedSentences) {
  textAlignmentMap.value = {};
  sourceSentences.forEach((s, i) => { if (translatedSentences[i]) textAlignmentMap.value[s.trim()] = translatedSentences[i].trim(); });
}

// 滚动同步（源 -> 译）
function onSourceScroll(event) {
  if (!targetTextRef.value) return;
  const p = event.target.scrollTop / Math.max(1,(event.target.scrollHeight - event.target.clientHeight));
  targetTextRef.value.scrollTop = p * (targetTextRef.value.scrollHeight - targetTextRef.value.clientHeight);
}
// 滚动同步（译 -> 源）
function onTargetScroll(event){
  if (!sourceTextRef.value) return;
  const p = event.target.scrollTop / Math.max(1,(event.target.scrollHeight - event.target.clientHeight));
  sourceTextRef.value.scrollTop = p * (sourceTextRef.value.scrollHeight - sourceTextRef.value.clientHeight);
}

function onTargetMouseUp(){
  // 点击译文的某一行 => 尝试高亮原文对应行（简单行号映射）
  const selection = window.getSelection();
  if(!selection) return;
  const text = selection.anchorNode ? selection.anchorNode.textContent || '' : '';
  highlightLineByApprox(text);
}
function onSourceMouseUp(){ /* 预留：暂不做 */ }

function highlightLineByApprox(fragment){
  if(!fragment || !sourceTextRef.value) return;
  const src = sourceTextRef.value.innerText || sourceTextRef.value.textContent || '';
  if(!src) return;
  const idx = src.indexOf(fragment.trim().slice(0,20));
  if(idx < 0) return;
  // 简化：暂不逐行包装，通过 selection-highlight class 包裹匹配片段
  clearSelectionHighlights();
  wrapRangeByText(sourceTextRef.value, fragment.trim().slice(0,20), SELECTION_CLASS);
}

// onTargetScroll 移除（译文外部展示）

// Text selection and context menu
function onTextSelection(event) {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    const txt = selection.toString().trim();
    selectedText.value = txt;
    // attempt to get a range that overlaps editor and wrap it directly
    try {
      selectedRange.value = selection.getRangeAt(0).cloneRange();
    } catch {
      selectedRange.value = null;
    }
    // Prefer Range-based wrapping in the editor that contains the range.
    const editorsToTry = [];
    if (selectedRange.value) {
      try {
        if (sourceTextRef.value && sourceTextRef.value.contains(selectedRange.value.commonAncestorContainer)) editorsToTry.push(sourceTextRef.value);
        if (targetTextRef.value && targetTextRef.value.contains(selectedRange.value.commonAncestorContainer)) editorsToTry.push(targetTextRef.value);
      } catch (e) { /* ignore */
      }
    }
    // also add the event target's editor first if available
    const evtEditor = event && event.target ? (event.target.closest && event.target.closest('.text-editor')) : null;
    if (evtEditor) editorsToTry.unshift(evtEditor);

    let wrapped = false;
    for (const ed of editorsToTry) {
      const rr = extractSelectionRange(ed) || selectedRange.value;
      if (rr) {
        clearSelectionHighlights();
        try {
          wrapped = wrapSelectionRange(ed, rr, SELECTION_CLASS) || wrapped;
        } catch (e) {
          // eslint-disable-next-line no-self-assign
          wrapped = wrapped;
        }
        if (wrapped) break;
      }
    }

    // If still not wrapped, try text-based wrapping in both editors as fallback
    if (!wrapped) {
      clearSelectionHighlights();
      // try source first
      if (sourceTextRef.value) {
        wrapRangeByText(sourceTextRef.value, txt, SELECTION_CLASS);
      }
      // then target
      if (targetTextRef.value) {
        wrapRangeByText(targetTextRef.value, txt, SELECTION_CLASS);
      }
    }
    // do not open context menu on mouseup/key selection (only on contextmenu)
  } else {
    if (!_suppressSelectionClear) {
      hideContextMenu();
      clearCrossHighlights();
    }
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

function clearCrossHighlights() {
  unwrapSpans(sourceTextRef.value, CROSS_CLASS);
  unwrapSpans(targetTextRef.value, CROSS_CLASS);
}

function clearSelectionHighlights() {
  unwrapSpans(sourceTextRef.value, SELECTION_CLASS);
  unwrapSpans(targetTextRef.value, SELECTION_CLASS);
}

function getTextNodeByOffset(root, offset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let curOffset = 0;
  let node;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (curOffset + len >= offset) {
      return {node, offset: offset - curOffset};
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
  try {
    range.surroundContents(span);
  } catch { /* ignore */
  }
}

function highlightSentenceBoth(sentence) {
  if (!sentence) return;
  clearCrossHighlights();
  wrapRangeByText(sourceTextRef.value, sentence, CROSS_CLASS);
}

function highlightSelectionBoth(text) {
  if (!text) return;
  clearSelectionHighlights();
  wrapRangeByText(sourceTextRef.value, text, SELECTION_CLASS);
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
  for (let i = offset - 1; i >= 0 && start < 0; i--) {
    if (punct.test(full[i])) {
      start = i;
      break;
    }
  }
  let end = full.indexOf('\n', offset);
  for (let i = offset; i < full.length && end < 0; i++) {
    if (punct.test(full[i])) {
      end = i + 1;
      break;
    }
  }
  if (start < 0) start = 0; else start += 1;
  if (end < 0) end = full.length;
  return full.substring(start, end).trim();
}

// 移除悬停句子高亮，减少闪动
function onEditorHover(){ /* disabled */ }

function extractSelectionRange(editor) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0).cloneRange();
  // ensure range overlaps editor in some way (start or end inside)
  if (!editor) return null;
  try {
    const startContained = editor.contains(range.startContainer);
    const endContained = editor.contains(range.endContainer);
    if (!startContained && !endContained) {
      // maybe the range encloses the editor node itself? check commonAncestor
      if (!editor.contains(range.commonAncestorContainer)) return null;
    }
    return range;
  } catch (e) {
    return null;
  }
}

function wrapSelectionRange(editor, range, className) {
  if (!editor || !range || range.collapsed) return false;
  try {
    const span = document.createElement('span');
    span.className = className;
    range.surroundContents(span);
    return true;
  } catch (e) {
    // surroundContents can fail if range partially selects non-text nodes; fallback to manual method
    try {
      const docFrag = range.extractContents();
      const wrapper = document.createElement('span');
      wrapper.className = className;
      wrapper.appendChild(docFrag);
      range.insertNode(wrapper);
      return true;
    } catch (err) {
      return false;
    }
  }
}

function onEditorContextMenu(e, which) {
  // Temporarily suppress showing the context menu; only perform selection highlighting.
  const editor = which === 'source' ? sourceTextRef.value : targetTextRef.value;
  _ignoreNextDocumentClick = true;
  _suppressSelectionClear = true;
  const selRange = extractSelectionRange(editor);
  if (selRange) {
    clearSelectionHighlights();
    if (wrapSelectionRange(editor, selRange, SELECTION_CLASS)) {
      // menu suppressed: keep highlight
      return;
    }
    const text = selRange.toString().trim();
    if (text) {
      clearSelectionHighlights();
      highlightSelectionBoth(text);
      return;
    }
  }
  // Fallback: highlight sentence under cursor
  const sentence = getSentenceAtPoint(editor, e.clientX, e.clientY);
  if (sentence) highlightSentenceBoth(sentence);
}

// ==== 新高亮实现 END ====

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('translation_settings');
  if (saved) {
    try {
      Object.assign(settings, JSON.parse(saved));
    } catch { /* ignore */
    }
  }
}

function applyTheme() {
  // 目前通过根元素 class 切换（template 绑定），这里做一些全局或 body 级别的需要时可扩展
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('app-theme-dark');
  } else {
    document.documentElement.classList.remove('app-theme-dark');
  }
}

function saveSettings() {
  try {
    const toSave = {
      provider: settings.provider,
      theme: settings.theme,
      fontSize: settings.fontSize,
      autoTranslate: settings.autoTranslate,
      translateDelay: settings.translateDelay
    };
    localStorage.setItem('translation_settings', JSON.stringify(toSave));
    applyFontSize();
    applyTheme();
    showSettings.value = false;
    ElMessage.success('设置已保存');
    // 如果开启了自动翻译且有源文本，则触发一次翻译
    if (settings.autoTranslate && sourceText.value.trim()) {
      // 延迟一小会儿以确保对话框关闭并 DOM 更新
      setTimeout(() => {
        translateText().catch(() => {
        });
      }, 50);
    }
  } catch (e) {
    console.warn('saveSettings failed', e);
    ElMessage.error('保存设置失败');
  }
}

// Apply font size
function applyFontSize() {
  if (sourceTextRef.value) sourceTextRef.value.style.fontSize = settings.fontSize + 'px';
  if (targetTextRef.value) targetTextRef.value.style.fontSize = settings.fontSize + 'px';
}


// Hide context menu
function hideContextMenu() {
  showContextMenu.value = false;
  // allow a short delay before clearing so menu click handlers can run
  setTimeout(() => {
    if (!_suppressSelectionClear) {
      clearSelectionHighlights();
      clearCrossHighlights();
    }
    _suppressSelectionClear = false;
  }, 120);
}

// 术语 CRUD 相关逻辑已迁移至 GlossaryManager 组件

function saveCustomTag(){
  if(!customTagName.value.trim()){
    ElMessage.error('请输入标签名称');
    return;
  }
  customTags.value.push({ name: customTagName.value.trim(), color: customTagColor.value });
  ElMessage.success('标签已添加');
  customTagName.value='';
  customTagColor.value='#409EFF';
  showCustomTagDialog.value=false;
}

// 组件卸载清理
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>

<style scoped>
.markdown-body h1{font-size:1.4em;border-bottom:1px solid #e5e7eb;padding-bottom:.3em;margin-top:1em;}
.markdown-body h2{font-size:1.25em;border-bottom:1px solid #e5e7eb;padding-bottom:.25em;margin-top:1em;}
.markdown-body h3{font-size:1.1em;margin-top:1em;}
.markdown-body pre{background:#f6f8fa;padding:8px 12px;border-radius:6px;overflow:auto;font-size:13px;}
.markdown-body code{background:#f6f8fa;padding:2px 4px;border-radius:4px;font-family:ui-monospace,monospace;font-size:13px;}
.markdown-body ul{padding-left:1.2em;margin:6px 0;}
.markdown-body p{margin:6px 0;line-height:1.55;}
.markdown-body hr{border:none;border-top:1px solid #e5e7eb;margin:12px 0;}
.markdown-body table{border-collapse:collapse;margin:12px 0;width:100%;}
.markdown-body table th,.markdown-body table td{border:1px solid #d0d7de;padding:6px 10px;text-align:left;}
.markdown-body table th{background:#f6f8fa;font-weight:600;}
.theme-dark .markdown-body table th,.theme-dark .markdown-body table td{border-color:#30363d;}
.theme-dark .markdown-body table th{background:#161b22;}
.selection-highlight{background:rgba(64,158,255,0.35);border-radius:2px;}
.line-highlight-active{background:rgba(255,215,0,0.35);}
/* 原样式恢复 + 补充 cross-highlight */
.advanced-translation-module {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

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

.lang-display {
  font-size: 13px;
  color: #606266;
  margin-left: 12px;
  padding: 4px 8px;
  background: #ffffffcc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .04);
  white-space: nowrap;
}

.translation-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  width: 100%;
  min-width: 0;
}

.text-panel {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  min-width: 0;
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

.text-editor:empty:before {
  content: attr(placeholder);
  color: #c0c4cc;
  pointer-events: none;
}

.text-editor::-webkit-scrollbar {
  width: 8px;
}

.top-progress {
  margin-left: 16px;
}

.translation-progress {
  padding: 4px 16px;
}

.context-menu {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .15);
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
  transition: background-color .2s;
}

.menu-item:hover {
  background: #f5f7fa;
}

.terminology-marker {
  text-decoration: underline;
  text-decoration-color: #409EFF;
  text-decoration-thickness: 2px;
}

.warning-marker {
  color: #E6A23C;
}

.custom-tag-marker {
  background: #409EFF;
  color: #fff;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}

.setting-desc {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.cross-highlight {
  background: #ffe98a;
  border-radius: 2px;
  padding: 1px 0;
}

.selection-highlight {
  background: #b3d8ff;
  border-radius: 2px;
  padding: 1px 0;
}

.text-editor span {
  font: inherit;
  white-space: inherit;
}

/* 术语管理相关样式已抽离 */

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

/* Dark theme overrides */
.advanced-translation-module.theme-dark {
  background: #1f2937;
  color: #e5e7eb;
}

.advanced-translation-module.theme-dark .translation-toolbar {
  background: #111827;
  border-bottom-color: #2d3748;
  color: #e6eef8;
}

.advanced-translation-module.theme-dark .translation-toolbar label {
  color: #cbd5e1;
}

.advanced-translation-module.theme-dark .panel-header {
  background: #111827;
  border-bottom-color: #2d3748;
  color: #e6eef8;
}

.advanced-translation-module.theme-dark .panel-header .panel-title {
  color: #f3f4f6;
}

.advanced-translation-module.theme-dark .panel-header .char-count {
  color: #cbd5e1;
}

.advanced-translation-module.theme-dark .text-editor {
  background: #0b1220;
  color: #e6eef8;
}

.advanced-translation-module.theme-dark .lang-display {
  background: rgba(255, 255, 255, 0.03);
  border-color: #374151;
  color: #cbd5e1;
}

.advanced-translation-module.theme-dark .toolbar-actions .el-button {
  color: #e6eef8;
}

.advanced-translation-module.theme-dark .context-menu {
  background: #0b1220;
  color: #e6eef8;
  border-color: #2d3748;
}

.advanced-translation-module.theme-dark .menu-item {
  color: #e6eef8;
}

.app-theme-dark {
  background: #0b1220;
  color: #e6eef8;
}
</style>