<template>
  <div class="new-preview-layout">
    <div class="top-bar" v-if="fileData">
      <el-button class="back-btn" v-if="showReturnBtn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span class="txt">返回搜索</span>
      </el-button>
      <FileMetaInfo :file="fileData" @open-path="openPath" />
      <div class="mode-switch" v-if="hasPerm">
        <el-button-group>
          <el-button :type="contentMode==='preview' ? 'primary':'default'" @click="contentMode='preview'">Preview</el-button>
          <el-button :type="contentMode==='text' ? 'primary':'default'" @click="contentMode='text'">Text</el-button>
          <el-button :type="contentMode==='translate' ? 'primary':'default'" @click="switchToTranslate">Translate</el-button>
        </el-button-group>
      </div>
      <div class="actions" v-if="hasPerm">
        <el-button @click="reload" :loading="loading">Refresh</el-button>
        <el-button type="primary" @click="downloadFile">Download</el-button>
      </div>
    </div>
    <div class="body-area" v-if="hasPerm">
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
    <div class="no-perm-wrapper" v-else>
      <el-empty :description="applyStatus === 'pending' ? '访问申请审核中' : '暂无预览权限'" />
      <div class="apply-actions" v-if="applyStatus==='none'">
        <el-button type="primary" :loading="applying" @click="applyAccess">申请预览权限</el-button>
      </div>
      <div class="apply-actions" v-else-if="applyStatus==='pending'">
        <el-tag type="warning">已提交申请，等待审核</el-tag>
      </div>
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
import { ChatLineSquare, Box, ChatRound, RefreshRight, ArrowLeft } from '@element-plus/icons-vue';
import FileMetaInfo from '../components/preview/FileMetaInfo.vue';

// 接收路由 props（通过 router 中 props 配置）
const props = defineProps({
  fc: { type: String, default: '' },
  id: { type: [String, Number], default: '' },
  retureBtn: { type: Boolean, default: true },
  file: { type: Object, default: null }
});

const route = useRoute();
const router = useRouter();
const filePreviewStore = useFilePreviewStore();
useAiToolsStore();

const fileId = computed(() => props.id || route.params.id);
const fileData = ref(null);
const loading = ref(false);
const contentMode = ref('preview');
const hasPerm = ref(true); // 是否有预览权限
const applying = ref(false);
const applyStatus = ref('none'); // none | pending | approved

// 返回按钮显示控制，兼容历史逻辑（存在 retureBtn 参数即可控制）
const showReturnBtn = computed(() => props.retureBtn !== false);

// AI 工具
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

function selectTool(key) { if (key === 'translation') { switchToTranslate(); return; } activeAITool.value = key; }
function switchToTranslate() { contentMode.value = 'translate'; }
function reload() { load(true); }
function downloadFile() { filePreviewStore.downloadFile(fileId.value); }
function goBack() { if (window.history.length > 1) router.back(); else router.push({ name: 'search' }).catch(()=>{}); }
function openPath(path) { router.push({ name: 'search', query: { path: path || '' } }).catch(()=>{}); }

async function load(forceRefresh = false) {
  if (!fileId.value) return;
  try {
    loading.value = true;
    // 使用传入文件（最小信息）直接渲染标题，避免空白
    if (props.file && !forceRefresh) {
      fileData.value = props.file;
    }
    // 若尚无详细数据且 id 在 mock 范围内再拉取
    const numericId = Number(fileId.value);
    const canFetchMock = !isNaN(numericId) && numericId >= 1 && numericId <= 5;
    if (canFetchMock && (!props.file || forceRefresh)) {
      fileData.value = await filePreviewStore.loadFile(fileId.value);
    }
    if (!fileData.value) {
      // 最后兜底，构造基本对象防止空白
      fileData.value = { id: fileId.value, name: '文件', fileType: '', hasAccess: false };
    }
    if (fileData.value && fileData.value.hasAccess === false) {
      hasPerm.value = false;
      applyStatus.value = fileData.value.applyStatus || 'none';
    } else {
      hasPerm.value = true;
      applyStatus.value = 'approved';
    }
  } catch (err) {
    // 降级：展示基本信息 + 申请入口
    console.warn('Preview load fallback:', err);
    if (!fileData.value) fileData.value = { id: fileId.value, name: '文件不可预览', fileType: '', hasAccess: false };
    hasPerm.value = false;
    applyStatus.value = 'none';
  } finally { loading.value = false; }
}

async function applyAccess() {
  if (applying.value) return;
  applying.value = true;
  try {
    await filePreviewStore.requestAccess(fileId.value, 'view', '需要预览权限');
    applyStatus.value = 'pending';
  } catch { /* 忽略即可 */ }
  finally { applying.value = false; }
}

onMounted(() => { load(); });
watch(() => route.params.id, () => load());
</script>

<style scoped>
.new-preview-layout { display:flex; flex-direction:column; height:100vh; background:#fff; }
.top-bar { display:flex; align-items:flex-start; padding:10px 16px 8px; gap:32px; border-bottom:1px solid #ebeef5; }
.file-info, .meta-line, .title-line { display:none; }
.back-btn { display:inline-flex; align-items:center; gap:6px; height:40px; padding:0 18px; font-size:14px; font-weight:600; border:1px solid #d0d5dd; background:#fff; color:#303133; border-radius:8px; line-height:1; box-shadow:0 1px 2px rgba(0,0,0,.05); transition:.18s; }
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
ai-side { width:380px; border-left:1px solid #ebeef5; display:flex; flex-direction:column; background:#fff; }
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
.no-perm-wrapper { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; }
.apply-actions { display:flex; gap:12px; }
</style>