<template>
  <div class="new-preview-layout">
    <div class="top-bar" v-if="fileData">
      <el-button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span class="txt">返回搜索</span>
      </el-button>
      <FileMetaInfo :file="fileData" @open-path="openPath" />
      <div class="mode-switch">
        <el-button-group>
          <el-button :type="contentMode==='preview' ? 'primary':'default'" @click="contentMode='preview'">Preview</el-button>
          <el-button :type="contentMode==='text' ? 'primary':'default'" @click="contentMode='text'">Text</el-button>
          <el-button :type="contentMode==='translate' ? 'primary':'default'" @click="switchToTranslate">Translate</el-button>
        </el-button-group>
      </div>
      <div class="actions">
        <el-button @click="reload" :loading="loading">Refresh</el-button>
        <el-button type="primary" @click="downloadFile">Download</el-button>
      </div>
    </div>
    <div class="body-area">
      <div class="doc-wrapper" v-if="contentMode!=='translate'">
        <!-- 预览/文本 + AI -->
        <file-preview
          v-if="fileData"
          :file-id="fileId"
          :file-type="fileData.fileType"
          :show-a-i-side="true"
          hide-header
          class="file-preview-shell"
        >
          <template #ai>
            <div class="ai-side">
              <div class="ai-tools-panel">
                <div class="tools-list">
                  <div
                    v-for="tool in aiTools"
                    :key="tool.key"
                    class="tool-item"
                    :class="{ active: activeAITool===tool.key }"
                    @click="selectTool(tool.key)"
                  >
                    <el-icon><component :is="tool.icon" /></el-icon>
                    <span class="tool-label">{{ tool.label }}</span>
                  </div>
                </div>
                <div class="tool-content" v-if="activeAITool">
                  <template v-if="activeAITool==='summary'">
                    <summary-panel :file-id="fileId" class="stack-panel" />
                    <tags-panel :file-id="fileId" class="stack-panel" />
                    <NERPanel :file-id="fileId" class="stack-panel" />
                  </template>
                  <component v-else :is="currentAIComponent" :file-id="fileId" />
                </div>
                <div class="tool-placeholder" v-else>
                  <el-empty description="选择右侧 AI 工具" />
                </div>
              </div>
            </div>
          </template>
        </file-preview>
      </div>
      <translation-workspace v-else :file-id="fileId" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFilePreviewStore } from '../stores/filePreview';
import { useAiToolsStore } from '../stores/aiTools';
import FilePreview from '../components/preview/FilePreview.vue';
import TranslationWorkspace from '../components/preview/TranslationWorkspace.vue';
import SummaryPanel from '../components/ai/SummaryPanel.vue';
import TagsPanel from '../components/ai/TagsPanel.vue';
import NERPanel from '../components/ai/NERPanel.vue';
import CustomExtractionPanel from '../components/ai/CustomExtractionPanel.vue';
import DocumentQA from '../components/ai/DocumentQA.vue';
import { ChatLineSquare, Box, ChatRound, RefreshRight, Document, ArrowLeft } from '@element-plus/icons-vue';
import FileMetaInfo from '../components/preview/FileMetaInfo.vue';

const route = useRoute();
const router = useRouter();
const filePreviewStore = useFilePreviewStore();
useAiToolsStore(); // 可能用于摘要/标签/实体内部请求

const fileId = computed(() => route.params.id);
const fileData = ref(null);
const loading = ref(false);
const contentMode = ref('preview');

// AI 工具：摘要（同时展示摘要+标签+实体）、自定义提取、问答、翻译
const aiTools = [
  { key: 'summary', label: '摘要', icon: ChatLineSquare },
  { key: 'customExtraction', label: '自定义提取', icon: Box },
  { key: 'qa', label: '问答', icon: ChatRound },
  { key: 'translation', label: '翻译', icon: RefreshRight }
];
const activeAITool = ref('summary');

const currentAIComponent = computed(() => {
  switch (activeAITool.value) {
    case 'customExtraction': return CustomExtractionPanel;
    case 'qa': return DocumentQA;
    case 'translation': return SummaryPanel; // 占位
    default: return SummaryPanel;
  }
});

function selectTool(key) {
  if (key === 'translation') { switchToTranslate(); return; }
  activeAITool.value = key;
}
function switchToTranslate() { contentMode.value = 'translate'; }
function reload() { load(); }
function downloadFile() { filePreviewStore.downloadFile(fileId.value); }
function goBack() {
  // 优先尝试浏览器历史返回
  if (window.history.length > 1) router.back();
  else router.push({ name: 'search' }).catch(()=>{});
}
// 新增：打开路径
function openPath(path) {
  router.push({ name: 'search', query: { path: path || '' } }).catch(()=>{});
}

async function load() { if (!fileId.value) return; loading.value = true; try { fileData.value = await filePreviewStore.loadFile(fileId.value); } finally { loading.value = false; } }

onMounted(load);
watch(() => route.params.id, () => load());
</script>

<style scoped>
.new-preview-layout { display:flex; flex-direction:column; height:100vh; background:#fff; }
.top-bar { display:flex; align-items:flex-start; padding:10px 16px 8px; gap:32px; border-bottom:1px solid #ebeef5; }
/* 移除旧的 .file-info / .meta-line / .title-line 样式 */
.file-info, .meta-line, .title-line { display:none; }
/* 保留返回按钮样式 */
.back-btn {
  display:inline-flex;
  align-items:center;
  gap:6px;
  height:40px;
  padding:0 18px;
  font-size:14px;
  font-weight:600;
  border:1px solid #d0d5dd;
  background:#fff;
  color:#303133;
  border-radius:8px;
  line-height:1;
  box-shadow:0 1px 2px rgba(0,0,0,.05);
  transition:.18s;
}
.back-btn:hover { color:#1671f2; border-color:#1671f2; box-shadow:0 2px 6px -2px rgba(22,113,242,.35); background:#f5f9ff; }
.back-btn:active { transform:translateY(1px); }
.back-btn :deep(.el-icon) { font-size:18px; margin-right:2px; }
.back-btn .txt { letter-spacing:.5px; }
/* 其余保持 */
.mode-switch { display:flex; }
.actions { display:flex; gap:8px; }
.body-area { flex:1; display:flex; overflow:hidden; }
.doc-wrapper { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.file-preview-shell { flex:1; }
.ai-side { width:380px; border-left:1px solid #ebeef5; display:flex; flex-direction:column; background:#fff; }
.ai-tools-panel { display:flex; flex-direction:column; height:100%; }
.tools-list { padding:12px 16px 8px; display:flex; flex-direction:column; gap:6px; border-bottom:1px solid #f0f2f5; }
.tool-item { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px; color:#606266; transition:.15s; }
.tool-item:hover { background:#f5f7fa; color:#1671f2; }
.tool-item.active { background:#1671f2; color:#fff; box-shadow:0 4px 10px -2px rgba(22,113,242,.35); }
.tool-label { flex:1; }
.tool-content { flex:1; overflow:auto; padding:14px 16px 22px; display:flex; flex-direction:column; gap:14px; }
.stack-panel { background:#fff; border:1px solid #ebeef5; border-radius:8px; padding:8px 10px; }
.tool-placeholder { flex:1; display:flex; align-items:center; justify-content:center; }
.tool-content::-webkit-scrollbar { width:8px; }
.tool-content::-webkit-scrollbar-thumb { background:rgba(0,0,0,.18); border-radius:4px; }
</style>