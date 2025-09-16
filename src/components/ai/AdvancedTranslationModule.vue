<template>
  <div class="advanced-translation-module" :class="{ 'theme-dark': settings.theme === 'dark' }">
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
            <el-option label="Italiano" value="it" />
            <el-option label="한국어" value="ko" />
            <el-option label="Português" value="pt" />
          </el-select>
        </div>
        <div class="swap-languages">
          <el-button 
            size="small" 
            circle 
            disabled
            title="当前仅支持翻译为中文"
          >
            <el-icon>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 7H4l3-3-3 3 3 3-3-3" stroke="currentColor" fill="none" />
                <path d="M16 17h4l-3 3 3-3-3-3 3 3" stroke="currentColor" fill="none" />
                <path d="M5 12h14" stroke-width="1.5" opacity="0.5" />
              </svg>
            </el-icon>
          </el-button>
        </div>
        <div class="language-selector">
          <label>目标语言</label>
          <el-select 
            v-model="targetLanguage" 
            size="small" 
            disabled
            placeholder="中文"
          >
            <el-option label="中文" value="zh" />
          </el-select>
        </div>
      </div>
      <div class="lang-display">{{ languageSummary }}</div>
      <div v-if="translating" class="top-progress">
        <el-progress :percentage="translationProgress" :stroke-width="6" style="width:160px" />
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
          v-if="translating"
          type="danger"
          size="small"
          @click="cancelTranslation"
        >
          取消
        </el-button>
        <el-button 
          size="small" 
          @click="showTerminologyManager = true"
        >
          <el-icon><Collection /></el-icon>
          术语库
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
          <div style="display:flex;align-items:center;gap:8px">
            <span class="panel-title">源文本</span>
            <el-button size="mini" type="text" v-if="!sourceEditable" @click="enterSourceEdit">编辑</el-button>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="char-count">{{ sourceText.length }}</span>
            <cloud-save v-if="!sourceEditable" :file="file" type="create" :defaultFileName="(file && file.fileName) ? (file.fileName.replace(/\.[^/.]+$/, '') + '-文本.txt') : ''" ref="sourceCloudSaveRef" @confirm="onSourceCloudSaveConfirm" />
            <el-button size="mini" type="primary" v-if="sourceEditable" @click="finishSourceEdit">完成</el-button>
            <!-- <el-button size="mini" type="text" v-else @click="saveSource" title="保存">下载</el-button> -->
          </div>
        </div>
        <div 
          ref="sourceTextRef"
          class="text-editor" 
          :contenteditable="sourceEditable"
          @input="onSourceTextInput"
          @scroll="onSourceScroll"
          @mouseup="onTextSelection"
          @keyup="onTextSelection"
          @mousemove="onEditorHover($event, 'source')"
          @contextmenu.prevent.stop="onEditorContextMenu($event, 'source')"
          :placeholder="'请输入要翻译的文本...'"
        ></div>
      </div>
      <div class="text-panel target-panel">
        <div class="panel-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="panel-title">译文</span>
            <el-button size="mini" type="text" v-if="!targetEditable" @click="enterEdit">
              编辑
            </el-button>
         
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            
            <span class="char-count">{{ translatedText.length }}</span>
            <cloud-save v-if="!targetEditable" :file="file" type="create" ref="cloudSaveRef" @confirm="onCloudSaveConfirm" />
             <el-button size="mini" type="primary" v-else @click="finishEdit">
              保存
            </el-button>
          </div>
        </div>
        <div 
          ref="targetTextRef"
          class="text-editor target" 
          :class="{loading: translating}"
          :contenteditable="targetEditable"
          @input="onTargetInput"
          @mousemove="onEditorHover($event, 'target')"
          @contextmenu.prevent.stop="onEditorContextMenu($event, 'target')"
        >{{ translatedText }}</div>
      </div>
    </div>

    <!-- Context Menu for Text Selection (temporarily disabled) -->
    <div v-if="false" ref="contextMenuRef" class="context-menu" :style="contextMenuStyle">
      <!-- menu intentionally disabled during debugging -->
    </div>

    <!-- Settings Modal -->
    <el-dialog v-model="showSettings" title="翻译设置" width="600px">
      <el-form :model="settings" label-width="120px">
        <el-form-item label="翻译接口">
          <el-select v-model="settings.provider" placeholder="选择翻译接口">
            <el-option label="系统内置API" value="builtin" />
            <el-option label="讯飞翻译API" value="xunfei" />
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

    <!-- Terminology Manager Dialog -->
    <el-dialog v-model="showTerminologyManager" title="术语库管理" width="800px">
      <div class="terminology-manager">
        <div class="terminology-toolbar">
          <el-button 
            type="primary" 
            size="small" 
            @click="showAddTermDialog = true"
          >
            <el-icon><Plus /></el-icon>
            添加术语
          </el-button>
          <el-button 
            size="small" 
            @click="refreshGlossary"
            :loading="glossaryPagination.loading"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-select
            v-model="glossaryPagination.typeFilter"
            size="small"
            placeholder="类型"
            style="width:110px"
            @change="onGlossaryFilterChange"
            clearable
          >
            <el-option label="术语" value="terminology" />
            <el-option label="记忆" value="memory" />
            <el-option label="语料" value="corpus" />
          </el-select>
          <el-input
            v-model="glossaryPagination.keyword"
            size="small"
            placeholder="关键词 (原文)"
            style="width:180px"
            clearable
            @keyup.enter="onGlossaryFilterChange"
          >
            <template #suffix>
              <el-icon style="cursor:pointer" @click="onGlossaryFilterChange"><Search /></el-icon>
            </template>
          </el-input>
          <el-button size="small" @click="onGlossaryFilterChange">查询</el-button>
          <el-button 
            size="small" 
            @click="exportTerminology"
          >
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button 
            size="small" 
            @click="importTerminology"
          >
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
        </div>
        
        <el-table 
          :data="terminologyList"
          v-loading="glossaryPagination.loading"
          height="400" 
          style="width: 100%"
        >
          <el-table-column prop="type" label="类型" width="80">
            <template #default="scope">
              <el-tag 
                :type="getTermTypeTagType(scope.row.type)"
                size="small"
              >
                {{ getTermTypeLabel(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="originalText" label="原文内容" width="200" />
          <el-table-column prop="translatedText" label="译文内容" width="200" />
          <el-table-column prop="language" label="语种" width="100">
            <template #default="scope">
              {{ getLanguageLabel(scope.row.language) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center" class-name="operation-col">
            <template #default="scope">
              <div class="op-btns">
                <el-button size="small" link type="primary" @click="editTerminology(scope.row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteTerminology(scope.row.id)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="glossary-pagination">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="glossaryPagination.total"
            :page-size="glossaryPagination.pageSize"
            :current-page="glossaryPagination.pageNo"
            :page-sizes="[10,20,30,50]"
            @size-change="onGlossarySizeChange"
            @current-change="onGlossaryPageChange"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTerminologyManager = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Add/Edit Terminology Dialog -->
    <el-dialog v-model="showAddTermDialog" :title="editingTerm ? '编辑术语' : '添加术语'" width="500px">
      <el-form :model="terminologyForm" label-width="100px">
        <el-form-item label="类型">
          <el-select v-model="terminologyForm.type" placeholder="选择类型">
            <el-option label="术语" value="terminology" />
            <el-option label="记忆" value="memory" />
            <el-option label="语料" value="corpus" />
          </el-select>
        </el-form-item>
        <el-form-item label="原文内容">
          <el-input 
            v-model="terminologyForm.originalText" 
            type="textarea" 
            :rows="3"
            placeholder="输入原文内容" 
          />
        </el-form-item>
        <el-form-item label="译文内容">
          <el-input 
            v-model="terminologyForm.translatedText" 
            type="textarea" 
            :rows="3"
            placeholder="输入译文内容" 
          />
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
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddTermDialog = false">取消</el-button>
          <el-button type="primary" @click="saveTerminology">保存</el-button>
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
  Setting, 
  Search, 
  Warning, 
  Document as Tag,
  Star as BookmarkIcon,
  Collection,
  Plus,
  Download,
  Upload,
  Refresh
} from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { aiService } from '../../services/aiService';
import CloudSave from '../preview/CloudSave.vue';
import { uploadStream } from '../../services/uploadStream';

const props = defineProps({
  file: { type: Object, default: null },
  fileId: { type: String, required: true },
  esId: { type: String, default: '' },
  active: { type: Boolean, default: false },
  initialSourceText: { type: String, default: '' },
  initialTranslation: { type: String, default: '' }
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
function enterSourceEdit(){ sourceEditable.value = true; nextTick(()=>{ if (sourceTextRef.value) { sourceTextRef.value.focus(); placeCaretAtEnd(sourceTextRef.value); } }); }
async function finishSourceEdit(){
  sourceEditable.value = false; // preserve model
  // push model back to DOM
  nextTick(()=>{ updateSourceTextContent(); });
  // emit extracted text so parent can update fileData.fileContents
  try {
    // notify parent/view to update file contents (source)
    emit('text-extracted', sourceText.value);
    // also emit a generic update event for file contents
    emit('update-file-contents', { fileId: props.fileId, content: sourceText.value });
    ElMessage.success('源文本已保存并同步');
  } catch (e) { console.warn('finishSourceEdit emit failed', e); }
}

// save source text locally as file download
function saveSource(){
  try {
    const data = sourceText.value || '';
    const filename = (file && file.fileName) ? (file.fileName.replace(/\.[^/.]+$/, '') + '-文本.txt') : `source_${new Date().toISOString().slice(0,10)}.txt`;
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    ElMessage.success('已下载源文本');
  } catch(e){ console.error('saveSource error', e); ElMessage.error('保存失败'); }
}

// handler for source cloud save confirm
async function onSourceCloudSaveConfirm(targetNode){
  if(!targetNode) { ElMessage.error('未选择目标目录'); return; }
  try {
    const data = sourceText.value || '';
    const filename = (targetNode && targetNode.fileName) ? targetNode.fileName : ((file && file.fileName) ? (file.fileName.replace(/\.[^/.]+$/, '') + '-文本.txt') : `source_${new Date().toISOString().slice(0,10)}.txt`);
    const fileObj = new File([data], filename, { type: 'text/plain', lastModified: Date.now() });
    const param = { fileCategory: targetNode.fileCategory || 'personal', fileSize: fileObj.size, fileName: fileObj.name, uoType: 2 };
    ElMessage.info('开始上传源文本到云盘...');
    const resp = await uploadStream({ file: fileObj, param });
    if (resp && (resp.status && String(resp.status).startsWith('err_'))) {
      ElMessage.error('上传失败: ' + (resp.msg || resp.message || resp.status));
    } else {
      ElMessage.success('已保存到云盘');
    }
  } catch(e){ console.error('uploadStream error', e); ElMessage.error('上传失败'); }
}

// target editable state
const targetEditable = ref(false);

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
  } catch (e) { /* ignore */ }
}

function enterEdit(){ targetEditable.value = true; nextTick(()=>{ if (targetTextRef.value) { targetTextRef.value.focus(); placeCaretAtEnd(targetTextRef.value); } }); }
async function finishEdit(){
  targetEditable.value = false; // preserve model
  // push model back to DOM
  nextTick(()=>{ updateTargetTextContent(); });
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
    emit('update-file-contents', { fileId: props.fileId, content: translatedText.value });
  } catch (e) {
    console.warn('finishEdit save failed', e);
    ElMessage.error('保存译文失败');
  }
}

function onTargetInput(e){ translatedText.value = e.target.innerText || ''; }

// handler invoked when CloudSave confirm triggers save (we'll call upload here)
async function onCloudSaveConfirm(targetNode){
  // targetNode is selected folder data from CloudSave
  if(!targetNode) { ElMessage.error('未选择目标目录'); return; }
  try {
    const data = translatedText.value || '';
    const filename = (targetNode && targetNode.fileName) ? targetNode.fileName : `translation_${new Date().toISOString().slice(0,10)}.txt`;
    const file = new File([data], filename, { type: 'text/plain', lastModified: Date.now() });
    const param = { fileCategory: targetNode.fileCategory || 'personal', fileSize: file.size, fileName: file.name, uoType: 2 };
    ElMessage.info('开始上传到云盘...');
    const resp = await uploadStream({ file, param });
    // check response for error pattern
    if (resp && (resp.status && String(resp.status).startsWith('err_'))) {
      ElMessage.error('上传失败: ' + (resp.msg || resp.message || resp.status));
    } else {
      ElMessage.success('已保存到云盘');
    }
  } catch(e){ console.error('uploadStream error', e); ElMessage.error('上传失败'); }
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
import { computed } from 'vue';
const languageNameMap = { auto:'自动检测', zh:'中文', en:'English', fr:'Français', es:'Español', de:'Deutsch', ja:'日本語', ru:'Русский', it:'Italiano', ko:'한국어', pt:'Português' };
const languageSummary = computed(()=>`${languageNameMap[sourceLanguage.value]||sourceLanguage.value} → ${languageNameMap[targetLanguage.value]||targetLanguage.value}`);

// Custom tag dialog
const showCustomTagDialog = ref(false);
const customTagName = ref('');
const customTagColor = ref('#409EFF');

// Terminology management
const showTerminologyManager = ref(false);
const showAddTermDialog = ref(false);
const editingTerm = ref(null);
const terminologyList = ref([]);
const glossaryPagination = reactive({ pageNo:1, pageSize:20, total:0, loading:false, typeFilter:'', keyword:'' });
const terminologyForm = reactive({
  type: 'terminology',
  originalText: '',
  translatedText: '',
  language: 'zh'
});

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
  if (props.active) { await initLoad(); }
});
watch(()=>props.fileId, ()=>{ initTried=false; if (props.active) initLoad(); });
watch(()=>props.active, (v)=>{
  if (v) {
    // 每次激活时优先从 localStorage 读取配置并应用
    loadSettings();
    applyFontSize();
  applyTheme();
    initLoad();
  }
});

async function initLoad(){
  if (initTried) return; initTried = true;
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
  // 加载术语库
  loadGlossary();
}

function detectSourceLang(){
  if (sourceLanguage.value !== 'auto') return; // 只有 auto 才自动检测
  const txt = sourceText.value || '';
  if (!txt.trim()) return;
  const chineseChars = (txt.match(/[\u4e00-\u9fa5]/g)||[]).length;
  const ratio = chineseChars / Math.max(1, txt.length);
  if (ratio > 0.25) {
    sourceLanguage.value='zh';
  } else {
    sourceLanguage.value='en';
  }
}

async function loadCachedOrTranslate(){
  if (!props.active) return; // 仅在激活时执行
  if (!sourceText.value.trim()) return;
  try {
    const esId = props.esId || props.fileId; // 正确传递 esId
    if (esId) {
      const { aiService } = await import('../../services/aiService');
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
  } catch (e) { console.warn('loadCachedOrTranslate failed', e); }
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
  // don't overwrite DOM while user is actively editing to preserve caret/selection
  if (sourceEditable && sourceEditable.value) return;
  if (sourceTextRef.value) {
    sourceTextRef.value.innerHTML = sourceText.value;
  }
}

// Update translated text content in DOM
function updateTargetTextContent() {
  // don't overwrite DOM while user is editing target (preserve caret)
  if (targetEditable && targetEditable.value) return;
  if (targetTextRef.value) {
    targetTextRef.value.innerHTML = translatedText.value;
  }
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
    translatedText.value = sourceText.value; updateTargetTextContent(); return;
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
      const { aiService } = await import('../../services/aiService');
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
        const { aiService } = await import('../../services/aiService');
        const xfResPromise = aiService.translateWithXunfei(sourceText.value, sourceLanguage.value === 'auto' ? '' : sourceLanguage.value, targetLanguage.value);
        const xfRes = await xfResPromise;
        if (cancelRequested.value) throw new Error('cancelled');
        if (xfRes?.sentences && Array.isArray(xfRes.sentences)) {
          translatedParagraphs = xfRes.sentences.map(s=>s.target || s.tgt || s.translation || '');
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
        const { aiService: aiSvcFallback } = await import('../../services/aiService');
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
          const { aiService } = await import('../../services/aiService');
          await aiService.saveTranslation(esId, translatedText.value, targetLanguage.value);
        }
      } catch (e) { console.warn('save translation cache failed', e); }
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

function cancelTranslation(){
  if (!translating.value) return;
  cancelRequested.value = true;
  ElMessage.info('正在取消翻译...');
}

// Split text into paragraphs (空行或连续换行分隔)
function splitIntoParagraphs(text) {
  if (!text) return [];
  // 先归一化换行
  const norm = text.replace(/\r\n/g,'\n');
  const parts = norm.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    // 如果没有空行，用单换行尝试聚合；保持与原行一致
    return norm.split(/\n/).map(l=>l.trim()).filter(Boolean);
  }
  return parts;
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

// onTargetScroll 移除（译文外部展示）

// Text selection and context menu
function onTextSelection(event) {
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    const txt = selection.toString().trim();
    selectedText.value = txt;
    // attempt to get a range that overlaps editor and wrap it directly
    try { selectedRange.value = selection.getRangeAt(0).cloneRange(); } catch { selectedRange.value = null; }
    // Prefer Range-based wrapping in the editor that contains the range.
    const editorsToTry = [];
    if (selectedRange.value) {
      try {
        if (sourceTextRef.value && sourceTextRef.value.contains(selectedRange.value.commonAncestorContainer)) editorsToTry.push(sourceTextRef.value);
        if (targetTextRef.value && targetTextRef.value.contains(selectedRange.value.commonAncestorContainer)) editorsToTry.push(targetTextRef.value);
      } catch (e) { /* ignore */ }
    }
    // also add the event target's editor first if available
    const evtEditor = event && event.target ? (event.target.closest && event.target.closest('.text-editor')) : null;
    if (evtEditor) editorsToTry.unshift(evtEditor);

    let wrapped = false;
    for (const ed of editorsToTry) {
      const rr = extractSelectionRange(ed) || selectedRange.value;
      if (rr) {
        clearSelectionHighlights();
        try { wrapped = wrapSelectionRange(ed, rr, SELECTION_CLASS) || wrapped; } catch (e) { wrapped = wrapped; }
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
  } catch (e) { return null; }
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
    try { Object.assign(settings, JSON.parse(saved)); } catch { /* ignore */ }
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
      setTimeout(() => { translateText().catch(()=>{}); }, 50);
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

// Show context menu at specified event
function showContextMenuAt(event) {
  // prevent the immediate document click from closing the menu/highlight
  _ignoreNextDocumentClick = true;
  _suppressSelectionClear = true;
  showContextMenu.value = true;
  nextTick(() => {
    contextMenuStyle.value = { position:'fixed', left: event.clientX + 'px', top: event.clientY + 'px', zIndex: 9999 };
    // small timeout to allow any native click to finish; then allow clears again when appropriate
    setTimeout(() => { _suppressSelectionClear = false; }, 200);
  });
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

// Terminology Management Functions
function getTermTypeLabel(type) {
  const labels = {
    terminology: '术语',
    memory: '记忆',
    corpus: '语料'
  };
  return labels[type] || type;
}

function getTermTypeTagType(type) {
  const types = {
    terminology: 'primary',
    memory: 'success',
    corpus: 'warning'
  };
  return types[type] || 'info';
}

function getLanguageLabel(lang) {
  const labels = {
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
  return labels[lang] || lang;
}

async function loadGlossary(){
  try {
    glossaryPagination.loading = true;
    const { aiService } = await import('../../services/aiService');
    const { list, total } = await aiService.getGlossaryPage({
      pageNo: glossaryPagination.pageNo,
      pageSize: glossaryPagination.pageSize,
      type: glossaryPagination.typeFilter,
      originalText: glossaryPagination.keyword,
      language: 'zh'
    });
    terminologyList.value = list.map(it=>({
      id: it.id,
      type: it.type || 'terminology',
      originalText: it.originalText || it.source || '',
      translatedText: it.translatedText || it.target || '',
      language: it.language || 'zh',
      status: it.status
    }));
    glossaryPagination.total = total;
  } catch(e){ console.warn('loadGlossary failed', e); }
  finally { glossaryPagination.loading = false; }
}

function editTerminology(term) {
  editingTerm.value = term;
  Object.assign(terminologyForm, { ...term });
  showAddTermDialog.value = true;
}

async function deleteTerminology(id) {
  try {
    await ElMessageBox.confirm('确认删除该术语？','提示',{ type:'warning', confirmButtonText:'删除', cancelButtonText:'取消' });
    const { aiService } = await import('../../services/aiService');
    const res = await aiService.deleteGlossaryEntry(id);
    if (res && res.success) {
      ElMessage.success('删除成功');
      await loadGlossary();
    } else {
      ElMessage.error(res?.message || '删除失败');
    }
  } catch(e){ if (e !== 'cancel') ElMessage.error('删除失败'); }
}

async function saveTerminology() {
  if (!terminologyForm.originalText || !terminologyForm.translatedText) {
    ElMessage.error('请填写完整信息');
    return;
  }
  try {
    const { aiService } = await import('../../services/aiService');
    if (editingTerm.value) {
      const res = await aiService.updateGlossaryEntry({
        id: editingTerm.value.id,
        type: terminologyForm.type,
        originalText: terminologyForm.originalText,
        translatedText: terminologyForm.translatedText,
        language: terminologyForm.language,
        status: 1
      });
      if (res && res.success) {
        ElMessage.success('更新成功');
        await loadGlossary();
      } else {
        ElMessage.error('更新失败');
      }
    } else {
      const res = await aiService.createGlossaryEntry({
        type: terminologyForm.type,
        originalText: terminologyForm.originalText,
        translatedText: terminologyForm.translatedText,
        language: terminologyForm.language,
        status: 1
      });
      if (res && res.success) {
        ElMessage.success('创建成功');
        await loadGlossary();
      } else {
        ElMessage.error('创建失败');
      }
    }
  } catch{ ElMessage.error('保存失败'); }
  finally {
    terminologyForm.type = 'terminology';
    terminologyForm.originalText = '';
    terminologyForm.translatedText = '';
    terminologyForm.language = 'zh';
    editingTerm.value = null;
    showAddTermDialog.value = false;
  }
}

function refreshGlossary(){ loadGlossary(); }

function onGlossaryFilterChange(){
  glossaryPagination.pageNo = 1;
  loadGlossary();
}
function onGlossaryPageChange(page){
  glossaryPagination.pageNo = page; loadGlossary();
}
function onGlossarySizeChange(size){
  glossaryPagination.pageSize = size; glossaryPagination.pageNo = 1; loadGlossary();
}

function exportTerminology() {
  const data = JSON.stringify(terminologyList.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terminology_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success('术语库导出成功');
}

function importTerminology() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            terminologyList.value = data;
            ElMessage.success('术语库导入成功');
          } else {
            ElMessage.error('文件格式不正确');
          }
        } catch {
          ElMessage.error('文件解析失败');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// 组件卸载清理
onUnmounted(() => { document.removeEventListener('click', onDocumentClick); });
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
.lang-display { font-size:13px; color:#606266; margin-left:12px; padding:4px 8px; background:#ffffffcc; border:1px solid #e5e7eb; border-radius:6px; box-shadow:0 1px 2px rgba(0,0,0,.04); white-space:nowrap; }
.translation-content { display:flex; flex:1; overflow:hidden; width:100%; min-width:0; }
.text-panel { flex:1 1 50%; display:flex; flex-direction:column; border-right:1px solid #e5e7eb; min-width:0; }
.text-panel:last-child { border-right:none; }
.panel-header { height:42px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; border-bottom:1px solid #e5e7eb; background:#fafafa; }
.panel-title { font-weight:600; font-size:14px; color:#303133; }
.char-count { font-size:12px; color:#909399; }
.text-editor { flex:1; padding:16px; border:none; outline:none; resize:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; font-size:14px; line-height:1.6; overflow:auto; white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere; min-width:0; box-sizing:border-box; }
.text-editor:focus { outline:none; }
.text-editor:empty:before { content:attr(placeholder); color:#c0c4cc; pointer-events:none; }
.text-editor::-webkit-scrollbar { width:8px; }
.top-progress { margin-left:16px; }
.translation-progress { padding:4px 16px; }
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

/* Terminology Manager Styles */
.terminology-manager { width: 100%; }
.terminology-toolbar { 
  display: flex; 
  gap: 8px; 
  margin-bottom: 16px; 
  padding-bottom: 12px; 
  border-bottom: 1px solid #e5e7eb; 
}
.op-btns { display:flex; align-items:center; justify-content:center; gap:4px; }
.op-btns .el-button { padding:0 4px; margin:0 !important; line-height:1; }
.op-btns .el-button + .el-button { margin-left:0 !important; }
.operation-col .cell { padding:0 4px !important; }

@media (max-width:768px){
  .translation-content { flex-direction:column; }
  .text-panel { border-right:none; border-bottom:1px solid #e5e7eb; }
  .text-panel:last-child { border-bottom:none; }
  .language-selectors { flex-wrap:wrap; gap:8px; }
}

/* Dark theme overrides */
.advanced-translation-module.theme-dark { background: #1f2937; color: #e5e7eb; }
.advanced-translation-module.theme-dark .translation-toolbar { background: #111827; border-bottom-color: #2d3748; color: #e6eef8; }
.advanced-translation-module.theme-dark .translation-toolbar label { color: #cbd5e1; }
.advanced-translation-module.theme-dark .panel-header { background: #111827; border-bottom-color: #2d3748; color: #e6eef8; }
.advanced-translation-module.theme-dark .panel-header .panel-title { color: #f3f4f6; }
.advanced-translation-module.theme-dark .panel-header .char-count { color: #cbd5e1; }
.advanced-translation-module.theme-dark .text-editor { background: #0b1220; color:#e6eef8; }
.advanced-translation-module.theme-dark .lang-display { background: rgba(255,255,255,0.03); border-color: #374151; color: #cbd5e1; }
.advanced-translation-module.theme-dark .toolbar-actions .el-button { color: #e6eef8; }
.advanced-translation-module.theme-dark .context-menu { background: #0b1220; color: #e6eef8; border-color: #2d3748; }
.advanced-translation-module.theme-dark .menu-item { color: #e6eef8; }
.app-theme-dark { background: #0b1220; color: #e6eef8; }
</style>