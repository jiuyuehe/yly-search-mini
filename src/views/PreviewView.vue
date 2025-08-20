<template>
  <div class="new-preview-layout">
    <!-- 统一顶部栏 -->
    <div class="top-bar" v-if="fileData">
      <div class="file-info">
        <div class="title-line">
          <el-icon class="file-icon"><Document /></el-icon>
          <span class="name" :title="fileData.name">{{ fileData.name }}</span>
        </div>
        <div class="path-line" :title="fileData.path">{{ fileData.path || fileData.fullPath || '—' }}</div>
      </div>
      <div class="mode-switch">
        <el-button-group>
          <el-button size="small" :type="contentMode==='preview' ? 'primary':'default'" @click="contentMode='preview'">Preview</el-button>
          <el-button size="small" :type="contentMode==='text' ? 'primary':'default'" @click="contentMode='text'">Text</el-button>
          <el-button size="small" :type="contentMode==='translate' ? 'primary':'default'" @click="switchToTranslate">Translate</el-button>
        </el-button-group>
      </div>
      <div class="actions">
        <el-button size="small" @click="reload" :loading="loading">Refresh</el-button>
        <el-button size="small" type="primary" @click="downloadFile">Download</el-button>
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
import { useRoute } from 'vue-router';
import { useFilePreviewStore } from '../stores/filePreview';
import { useAiToolsStore } from '../stores/aiTools';
import FilePreview from '../components/preview/FilePreview.vue';
import TranslationWorkspace from '../components/preview/TranslationWorkspace.vue';
import SummaryPanel from '../components/ai/SummaryPanel.vue';
import TagsPanel from '../components/ai/TagsPanel.vue';
import NERPanel from '../components/ai/NERPanel.vue';
import CustomExtractionPanel from '../components/ai/CustomExtractionPanel.vue';
import DocumentQA from '../components/ai/DocumentQA.vue';
import { ChatLineSquare, Box, ChatRound, RefreshRight, Document } from '@element-plus/icons-vue';

const route = useRoute();
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

async function load() { if (!fileId.value) return; loading.value = true; try { fileData.value = await filePreviewStore.loadFile(fileId.value); } finally { loading.value = false; } }

onMounted(load);
watch(() => route.params.id, () => load());
</script>

<style scoped>
.new-preview-layout { display:flex; flex-direction:column; height:100vh; background:#fff; }
.top-bar { display:flex; align-items:center; padding:10px 16px 8px; gap:32px; border-bottom:1px solid #ebeef5; }
.file-info { min-width:0; flex:1; }
.title-line { display:flex; align-items:center; gap:8px; font-weight:600; font-size:15px; }
.title-line .name { max-width:420px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.path-line { font-size:11px; color:#909399; margin-top:2px; max-width:600px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
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