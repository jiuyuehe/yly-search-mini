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
      <div v-if="contentMode!=='translate'" class="split-wrapper">
        <el-splitter  style="height:100%; width:100%;">
          <el-splitter-panel v-model:size="splitSize">
            <div class="doc-wrapper">
              <FilePreview
                v-if="fileData"
                :file-id="fileId"
                :file-type="fileData.fileType"
                hide-header
                class="file-preview-shell"
              />
            </div>
          </el-splitter-panel>
          <el-splitter-panel>
            <div class="ai-wrapper">
              <AIToolsPanel :file-id="fileId" @switch-translate="switchToTranslate" />
            </div>
          </el-splitter-panel>
        </el-splitter>
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
import AIToolsPanel from '../components/ai/AIToolsPanel.vue';
import { ChatLineSquare, Box, ChatRound, RefreshRight, ArrowLeft } from '@element-plus/icons-vue';
import FileMetaInfo from '../components/preview/FileMetaInfo.vue';
// 不需要显式局部注册 splitter，ElementPlus 全局已注册；如需按需可保留 import { ElSplitter } from 'element-plus'

// 接收路由 props
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
const splitSize = ref("75%"); // 0-100 百分比（ElementPlus Splitter 默认使用百分比）
const hasPerm = ref(true);
const applying = ref(false);
const applyStatus = ref('none');

// 返回按钮
const showReturnBtn = computed(() => props.retureBtn !== false);

function switchToTranslate() { contentMode.value = 'translate'; }
function reload() { load(true); }
function downloadFile() { filePreviewStore.downloadFile(fileId.value); }
function goBack() { if (window.history.length > 1) router.back(); else router.push({ name: 'search' }).catch(()=>{}); }
function openPath(path) { router.push({ name: 'search', query: { path: path || '' } }).catch(()=>{}); }

// 防止 splitSize 越界导致面板不可见
watch(splitSize, (v, ov) => {
  if (v < 5) splitSize.value = 5;
  else if (v > 95) splitSize.value = 95;
});

async function load(forceRefresh = false) {
  if (!fileId.value && !props.file) {
    fileData.value = { id: '', name: '未指定文件', fileType: '', hasAccess: true };
    hasPerm.value = true;
    return;
  }
  try {
    loading.value = true;
    if (props.file && !forceRefresh) {
      fileData.value = props.file;
    }
    const numericId = Number(fileId.value);
    const canFetchMock = !isNaN(numericId) && numericId >= 1 && numericId <= 5;
    if (canFetchMock && (!props.file || forceRefresh)) {
      fileData.value = await filePreviewStore.loadFile(fileId.value);
    }
    if (!fileData.value) {
      fileData.value = { id: fileId.value, name: '文件', fileType: '', hasAccess: false };
    }
    if (fileData.value && fileData.value.hasAccess === false) {
      hasPerm.value = false;
      applyStatus.value = fileData.value.applyStatus || 'none';
    } else {
      hasPerm.value = true;
      applyStatus.value = 'approved';
    }
    console.debug('[PreviewView] loaded fileData:', fileData.value);
  } catch (err) {
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
  } catch { /* 忽略 */ } finally { applying.value = false; }
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
.mode-switch { display:flex; }
.actions { display:flex; gap:8px; }
.body-area { flex:1; display:flex; overflow:hidden; min-height:0; }
.split-wrapper { flex:1; min-height:0; height:100%; width:100%; display:flex; }
/* 让 splitter 两侧区域都撑满高度 */
:deep(.el-splitter) { --ep-splitter-border-color:#ebeef5; }
:deep(.el-splitter__panel) { display:flex; flex-direction:column; min-width:0; }
.doc-wrapper { width:100%; height:100%; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
.file-preview-shell { flex:1; min-height:0; }
.ai-wrapper { display:flex; flex-direction:column; height:100%; min-width:260px; max-width:520px; }
.no-perm-wrapper { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; }
.apply-actions { display:flex; gap:12px; }
</style>