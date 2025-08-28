<template>
  <div class="new-preview-layout">
    <div class="top-bar" v-if="fileData">
      <el-button class="back-btn" v-if="showReturnBtn" @click="goBack">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        <span class="txt">返回搜索</span>
      </el-button>
      <FileMetaInfo :file="fileData" @open-path="openPath" />
      <span class="flex-spacer"></span>
      <div class="mode-switch">
        <el-button-group>
          <el-button :type="contentMode === 'preview' ? 'primary' : 'default'"
            @click="contentMode = 'preview'">AI阅读</el-button>
          <el-button :type="contentMode === 'text' ? 'primary' : 'default'" @click="contentMode = 'text'">文本模式</el-button>
          <el-button :type="contentMode === 'translate' ? 'primary' : 'default'" @click="switchToTranslate">翻译模式</el-button>
        </el-button-group>
      </div>
      <div class="actions" v-if="hasPerm">
        <el-button @click="reload" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="downloadFile">下载</el-button>
      </div>
    </div>
    <div class="body-area">
      <!-- Preview Mode: Two panels (FilePreview + AIToolsPanel) -->
      <div v-if="contentMode === 'preview'" class="split-wrapper">
        <el-splitter style="height:100%; width:100%;">
          <el-splitter-panel v-model:size="splitSize">
            <div class="doc-wrapper">
              <FilePreview v-if="fileData && hasPerm" :file-id="fileId" :file-type="fileData.fileType" :file-data="fileData"
                hide-header class="file-preview-shell" />
              <div v-else class="no-access-placeholder">
                <el-empty description="演示模式 - 文件预览区域" />
              </div>
            </div>
          </el-splitter-panel>
          <el-splitter-panel>
            <div class="ai-wrapper">
              <AIToolsPanel :file-id="fileId" @switch-translate="switchToTranslate" />
            </div>
          </el-splitter-panel>
        </el-splitter>
      </div>
      
      <!-- Text Mode: Three panels (FilePreview + TextPanel + AIToolsPanel) -->
      <div v-else-if="contentMode === 'text'" class="split-wrapper">
        <el-splitter style="height:100%; width:100%;">
          <el-splitter-panel v-model:size="textModeSplitSize1">
            <div class="doc-wrapper">
              <FilePreview v-if="fileData && hasPerm" :file-id="fileId" :file-type="fileData.fileType" :file-data="fileData"
                hide-header class="file-preview-shell" />
              <div v-else class="no-access-placeholder">
                <el-empty description="演示模式 - 文件预览区域" />
              </div>
            </div>
          </el-splitter-panel>
          <el-splitter-panel v-model:size="textModeSplitSize2">
            <div class="text-wrapper">
              <TextPanel 
                title="文档文本"
                :content="demoText"
                :editable="false"
                placeholder="文档文本内容将显示在这里..."
                :enable-markdown="true"
                @text-selected="onTextSelected"
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
      
      <!-- Translation Mode: Two panels (TextPanel + TranslatePanel) -->
      <div v-else class="translate-full">
        <translation-workspace class="tw-root" :file-id="fileId" />
      </div>
    </div>
    <FileAccessApply v-if="!hasPerm" :file-id="fileId" :file-category="props.fc || route.params.fc" :is-folder="false"
      @applied="reload" />
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
import TextPanel from '../components/common/TextPanel.vue';
import { ArrowLeft } from '@element-plus/icons-vue';
import FileMetaInfo from '../components/preview/FileMetaInfo.vue';
import { appsApi } from '../services/api';
import FileAccessApply from '../components/preview/FileAccessApply.vue';
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
const textModeSplitSize1 = ref("40%"); // First panel size in text mode
const textModeSplitSize2 = ref("30%"); // Second panel size in text mode  
const hasPerm = ref(true);
const applyStatus = ref('none');

// Extracted text content
const extractedText = computed(() => {
  return fileData.value?.extractedText || '';
});

// Demo text for demonstration
const demoText = ref(`# 项目需求文档

这是一个**项目需求文档**的示例文本内容。包含了详细的功能需求说明、技术规范、用户界面设计要求等内容。

## 主要功能模块

1. **用户管理系统**
   - 用户注册与登录
   - 权限管理
   - 用户配置文件

2. **文件搜索与预览**
   - 全文搜索功能
   - 文件预览支持
   - 批量操作

3. **AI辅助分析工具**
   - 文档摘要生成
   - 关键词提取
   - 实体识别

4. **多语言翻译支持**
   - 实时翻译
   - 术语管理
   - 翻译记忆

## 技术要求

- **前端**: Vue 3 + Element Plus
- **后端**: Spring Boot  
- **数据库**: MySQL
- **缓存**: Redis

*这是一个示例markdown文档，用于演示文本模式的功能。*
`);

// 返回按钮
const showReturnBtn = computed(() => props.retureBtn !== false);

function switchToTranslate() { contentMode.value = 'translate'; }
function reload() { load(true); }
function downloadFile() { filePreviewStore.downloadFile(fileId.value); }
function goBack() { if (window.history.length > 1) router.back(); else router.push({ name: 'search' }).catch(() => { }); }
function openPath(path) { router.push({ name: 'search', query: { path: path || '' } }).catch(() => { }); }

// Text selection handler for TextPanel
function onTextSelected(text) {
  console.log('Selected text:', text);
  // Handle text selection if needed
}

// 防止 splitSize 越界导致面板不可见
watch(splitSize, (v) => {
  if (v < 5) splitSize.value = 5;
  else if (v > 95) splitSize.value = 95;
});

watch(textModeSplitSize1, (v) => {
  if (v < 10) textModeSplitSize1.value = 10;
  else if (v > 70) textModeSplitSize1.value = 70;
});

watch(textModeSplitSize2, (v) => {
  if (v < 10) textModeSplitSize2.value = 10;
  else if (v > 60) textModeSplitSize2.value = 60;
});

const TEXT_TYPES = ['txt', 'md', 'json', 'xml', 'csv', 'log'];
function isTextExt(ext) { return !!ext && TEXT_TYPES.includes(String(ext).toLowerCase()); }
function decodeBufferToText(buf) {
  try {
    if (!buf) return '';
    const arr = new Uint8Array(buf);
    // 简单 BOM 检测
    if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) {
      return new TextDecoder('utf-8').decode(arr.subarray(3));
    }
    // utf-8 直接解码
    return new TextDecoder('utf-8').decode(arr);
  } catch { return ''; }
}

async function load(forceRefresh = false) {
  if (!fileId.value && !props.file) {
    fileData.value = { id: '', name: '未指定文件', fileType: '', hasAccess: true };
    hasPerm.value = true;
    return;
  }
  loading.value = true;
  if (props.file && !forceRefresh) fileData.value = props.file;

  const fc = props.fc || route.params.fc;
  const fid = fileId.value;
  const preExt = (fileData.value?.fileType || props.file?.fileType || '').toLowerCase();
  const expectTextStream = isTextExt(preExt);

  if (fc && fid) {
    try {
      const resp = await appsApi.get('/apps/file/view', { params: { fc, fi: fid }, responseType: expectTextStream ? 'arraybuffer' : undefined });

      console.log("resp:", resp);

      if (expectTextStream && resp instanceof ArrayBuffer) {
        const text = decodeBufferToText(resp);
        let parsed; try { parsed = JSON.parse(text); } catch { /* not json */ }
        if (parsed?.status === 'err_no_permission') throw { response: { status: 403, data: parsed } };
        fileData.value = { ...(fileData.value || {}), id: fid, fileType: preExt || 'txt', extractedText: text, hasAccess: true };
        hasPerm.value = true; applyStatus.value = 'approved';
        return;
      }

      if (resp?.status === 'err_no_permission') {
        throw { response: { status: 403, data: resp } };
      }
      if (resp?.status === 'ok') {
        const view = resp.data || {};
        const { buildAppsUrl } = await import('../constants/server.js');
        const ext = (view.fileType || view.ext || view.extname || fileData.value?.fileType || preExt || '').toLowerCase();
        const merged = { ...(fileData.value || {}), ...view, id: fid, fileType: ext };
        // 只将 view 字段作为预览 URL，避免 file(下载接口) 触发浏览器直接下载
        if (view.view) merged.viewUrl = buildAppsUrl(view.view);
        // file 始终作为下载地址保留
        if (view.file) merged.downloadUrl = buildAppsUrl(view.file);
        if (view.thumb) merged.thumbUrl = buildAppsUrl(view.thumb);
        if (isTextExt(ext) && !merged.extractedText && typeof view.content === 'string') merged.extractedText = view.content;
        merged.hasAccess = true;
        fileData.value = merged;
        hasPerm.value = true; applyStatus.value = 'approved';
        return;
      }
      throw new Error('unexpected response');
    } catch (err) {
      console.warn('[PreviewView] load error', err);
      // 标准化无权限判断：支持拦截器包装后的 httpStatus / code / response.status
      const httpStatus = err?.httpStatus || err?.response?.status || err?.status;
      const bizCode = err?.code || err?.response?.data?.status;
      if (httpStatus === 403 || bizCode === 'err_no_permission' || bizCode === 403 || (err?.response?.data?.status === 'err_no_permission')) {
        // 标记无访问权限，显示 FileAccessApply 组件
        hasPerm.value = false;
        applyStatus.value = 'none';
        fileData.value = fileData.value || { id: fid, name: '文件', fileType: preExt || '', hasAccess: false };
      } else {
        // 其它错误：保持已有数据或占位，不弹出申请（可能是网络/服务器错误）
        if (!fileData.value) fileData.value = { id: fid, name: '文件', fileType: preExt || '', hasAccess: false };
        // 若明确不是权限问题，保持原 hasAccess 状态；若 hasAccess 为 false 仍会显示申请组件
        hasPerm.value = fileData.value.hasAccess !== false;
      }
    }
  }

  if (!fileData.value) fileData.value = { id: fid, name: '文件', fileType: preExt || '', hasAccess: false };
  if (fileData.value.hasAccess === false) {
    hasPerm.value = false;
    applyStatus.value = fileData.value.applyStatus || 'none';
  }

}

onMounted(() => { load(); });
watch(() => route.params.id, () => load());
</script>

<style scoped>
.new-preview-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}

.top-bar {
  display: flex;
  align-items: flex-start;
  padding: 10px 16px 8px;
  gap: 32px;
  border-bottom: 1px solid #ebeef5;
}

.file-info,
.meta-line,
.title-line {
  display: none;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #d0d5dd;
  background: #fff;
  color: #303133;
  border-radius: 8px;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .05);
  transition: .18s;
}

.back-btn:hover {
  color: #1671f2;
  border-color: #1671f2;
  box-shadow: 0 2px 6px -2px rgba(22, 113, 242, .35);
  background: #f5f9ff;
}

.back-btn:active {
  transform: translateY(1px);
}

.back-btn :deep(.el-icon) {
  font-size: 18px;
  margin-right: 2px;
}

.back-btn .txt {
  letter-spacing: .5px;
}

.mode-switch {
  display: flex;
}

.actions {
  display: flex;
  gap: 8px;
}

.body-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.split-wrapper {
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  display: flex;
}

.translate-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.translate-full .tw-root,
.translate-full :deep(.translation-workspace),
.translate-full :deep(.advanced-translation-module) {
  flex: 1 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

/* 让 splitter 两侧区域都撑满高度 */
:deep(.el-splitter) {
  --ep-splitter-border-color: #ebeef5;
}

:deep(.el-splitter__panel) {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.doc-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.file-preview-shell {
  flex: 1;
  min-height: 0;
}

.ai-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 260px;
  max-width: 520px;
}

.text-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 200px;
  padding: 8px;
}

.no-access-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f8f9fa;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  margin: 8px;
}

.flex-spacer {
  flex: 1;
}
</style>