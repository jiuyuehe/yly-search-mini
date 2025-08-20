<template>
  <div class="translation-workspace">
    <!-- 当两个都关闭时的占位 -->
    <div v-if="!showSource && !showTarget" class="both-hidden">
      <el-empty description="已隐藏所有面板" />
      <el-button type="primary" size="small" @click="restorePanels">恢复</el-button>
    </div>
    <template v-else>
      <!-- 源文本列 -->
      <div v-if="showSource" class="col source-col">
        <div class="panel-header">
          <div class="left">
            <span class="panel-title">提取文本</span>
            <span class="word-count">{{ sourceWords }} words</span>
          </div>
          <div class="actions">
            <el-tooltip content="隐藏此列" placement="top"><el-button link @click="showSource=false"><el-icon><Close /></el-icon></el-button></el-tooltip>
            <el-tooltip content="复制" placement="top"><el-button link @click="copyToClipboard(sourceContent)"><el-icon><DocumentCopy /></el-icon></el-button></el-tooltip>
            <el-tooltip content="重新提取" placement="top"><el-button link :loading="extracting" @click="extractSource"><el-icon><RefreshRight /></el-icon></el-button></el-tooltip>
          </div>
        </div>
        <div class="editor-wrapper">
          <rich-text-editor v-model="sourceContent" @change="updateSourceCount" />
        </div>
      </div>
      <!-- 翻译设置 + 目标列 -->
      <div v-if="showTarget" class="col target-col">
        <div class="settings-card">
          <div class="settings-header">
            <el-icon><RefreshRight /></el-icon>
            <span>Translation Settings</span>
          </div>
          <div class="settings-body">
            <el-form inline>
              <el-form-item label="From">
                <el-select v-model="sourceLang" size="small" style="width:140px">
                  <el-option v-for="l in languages" :key="l.value" :label="l.label" :value="l.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="To">
                <el-select v-model="targetLang" size="small" style="width:140px">
                  <el-option v-for="l in languages" :key="'t-'+l.value" :label="l.label" :value="l.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button size="small" type="primary" :loading="translating" @click="doTranslate">翻译</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <div class="panel-header compact">
          <div class="left">
            <span class="panel-title">翻译结果</span>
            <span class="word-count">{{ targetWords }} words</span>
          </div>
          <div class="actions">
            <el-tooltip content="隐藏此列" placement="top"><el-button link @click="showTarget=false"><el-icon><Close /></el-icon></el-button></el-tooltip>
            <el-tooltip content="复制" placement="top"><el-button link @click="copyToClipboard(targetContent)"><el-icon><DocumentCopy /></el-icon></el-button></el-tooltip>
          </div>
        </div>
        <div class="editor-wrapper">
          <rich-text-editor v-model="targetContent" @change="updateTargetCount" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';
import RichTextEditor from '../editor/RichTextEditor.vue';
import { RefreshRight, Close, DocumentCopy } from '@element-plus/icons-vue';

const props = defineProps({
  fileId: { type: String, required: true }
});

const aiStore = useAiToolsStore();

const showSource = ref(true);
const showTarget = ref(true);

const sourceContent = ref('');
const targetContent = ref('');
const extracting = ref(false);
const translating = ref(false);

const sourceWords = ref(0);
const targetWords = ref(0);

const sourceLang = ref('auto');
const targetLang = ref('en');
const languages = [
  { label:'Auto', value:'auto' },
  { label:'中文', value:'zh' },
  { label:'English', value:'en' },
  { label:'日本語', value:'ja' },
  { label:'한국어', value:'ko' },
  { label:'Español', value:'es' }
];

function countWords(text) {
  if (!text) return 0;
  return text.replace(/\n/g,' ').split(/\s+/).filter(Boolean).length;
}
function updateSourceCount() { sourceWords.value = countWords(sourceContent.value); }
function updateTargetCount() { targetWords.value = countWords(targetContent.value); }

async function extractSource() {
  if (!props.fileId) return;
  extracting.value = true;
  try {
    const text = await aiStore.extractText(props.fileId);
    sourceContent.value = text || '';
    updateSourceCount();
  } finally { extracting.value = false; }
}

async function doTranslate() {
  if (!sourceContent.value) return;
  translating.value = true;
  try {
    const result = await aiStore.translateText(sourceContent.value, targetLang.value);
    targetContent.value = result;
    updateTargetCount();
  } finally { translating.value = false; }
}

function restorePanels() { showSource.value = true; showTarget.value = true; }
function copyToClipboard(text) { navigator.clipboard?.writeText(text); }

onMounted(() => { extractSource(); });
watch(() => props.fileId, () => { extractSource(); targetContent.value=''; updateTargetCount(); });
</script>

<style scoped>
.translation-workspace { display:flex; width:100%; height:100%; background:#fff; overflow:hidden; }
.col { flex:1; display:flex; flex-direction:column; border-right:1px solid #e5e7eb; }
.col:last-child { border-right:none; }
.panel-header { height:42px; display:flex; align-items:center; justify-content:space-between; padding:0 10px; background:#f8f9fa; border-bottom:1px solid #e5e7eb; font-size:13px; }
.panel-header.compact { margin-top:8px; border-top:1px solid #eceff1; }
.panel-title { font-weight:600; }
.word-count { color:#909399; margin-left:12px; font-weight:400; }
.actions { display:flex; align-items:center; gap:2px; }
.editor-wrapper { flex:1; padding:0 8px 12px; display:flex; }
.settings-card { margin:8px 8px 0; border:1px solid #e5e7eb; border-radius:8px; background:#fff; padding:10px 12px 6px; }
.settings-header { display:flex; align-items:center; gap:6px; font-weight:600; font-size:13px; margin-bottom:6px; }
.both-hidden { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; }
@media (max-width:1200px) { .translation-workspace { flex-direction:column; } .col { border-right:none; border-bottom:1px solid #e5e7eb; } }
</style>
