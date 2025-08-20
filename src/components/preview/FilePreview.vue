<template>
  <div class="preview-shell">
    <!-- 顶部 Header 区域 -->
    <div v-if="!hideHeader" class="preview-header-bar">
      <div class="left-meta">
        <h2 class="filename" :title="fileData?.name">{{ fileData?.name || '文件预览' }}</h2>
        <div class="meta-line">
          <span>{{ fileData?.creator }}</span>
          <span>{{ fileData?.modifiedTime }}</span>
          <span>{{ fileData?.size ? formatSize(fileData.size) : '' }}</span>
        </div>
      </div>
      <div class="center-switch">
        <el-segmented v-model="contentMode" :options="contentModes" size="small" />
      </div>
      <div class="right-actions">
        <el-button size="small" @click="retryPreview" :loading="loading">刷新</el-button>
        <el-button size="small" type="primary" @click="downloadFile">下载</el-button>
      </div>
    </div>

    <!-- 主内容区：左侧内容 + 右侧 AI 工具插槽（由父组件放置 AIToolbar） -->
    <div class="preview-main">
      <div class="doc-area" :class="{ 'with-ai': showAISide }">
        <div class="doc-scroll">
          <!-- 加载 / 错误 -->
          <div v-if="loading" class="state-holder"><el-skeleton :rows="8" animated /></div>
          <div v-else-if="error" class="state-holder">
            <el-alert type="error" :title="error" show-icon />
            <el-button size="small" @click="retryPreview">重试</el-button>
          </div>

          <!-- 内容切换：原文 / 翻译 / 预览 -->
          <template v-else>
            <!-- 文本类显示（原文 / 翻译） -->
            <div v-if="isTextType && (contentMode === 'original' || contentMode === 'translated')" class="text-wrapper">
              <div class="text-block" v-if="contentMode === 'original'">
                <pre>{{ textContent || '暂无文本内容' }}</pre>
              </div>
              <div class="text-block" v-else>
                <pre>{{ translatedText || '（翻译结果占位）' }}</pre>
              </div>
            </div>

            <!-- 图片 -->
            <div v-else-if="isImageType" class="media-wrapper">
              <img v-if="previewUrl" :src="previewUrl" class="media-img" />
              <el-empty v-else description="图片预览不可用" />
            </div>

            <!-- PDF iframe -->
            <div v-else-if="fileType === 'pdf'" class="media-wrapper">
              <iframe v-if="previewUrl" :src="previewUrl" class="pdf-frame" />
              <el-empty v-else description="PDF预览不可用" />
            </div>

            <!-- 不支持 -->
            <div v-else class="state-holder">
              <el-empty description="此类型暂不支持预览" />
            </div>
          </template>
        </div>
      </div>
      <!-- 右侧 AI 工具由外层布局放，这里仅预留 class 协调，所以不再内置 -->
      <slot name="ai" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useFilePreviewStore } from '../../stores/filePreview';

const props = defineProps({
  fileId: { type: String, required: true },
  fileType: { type: String, default: '' },
  showAISide: { type: Boolean, default: true },
  hideHeader: { type: Boolean, default: false } // 新增：隐藏内部头部，父级自定义统一头部
});

const filePreviewStore = useFilePreviewStore();

const loading = ref(false);
const error = ref(null);
const previewUrl = ref('');
const textContent = ref('');
const translatedText = ref('');
const fileData = ref(null);
const contentMode = ref('original');

const contentModes = [
  { label: '原文', value: 'original' },
  { label: '翻译', value: 'translated' },
  { label: '预览', value: 'preview' }
];

const isImageType = computed(() => ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(props.fileType?.toLowerCase()));
const isTextType = computed(() => ['txt','md','json','xml','csv'].includes(props.fileType?.toLowerCase()));

async function loadPreview() {
  if (!props.fileId) return;
  loading.value = true;
  error.value = null;
  try {
    fileData.value = await filePreviewStore.loadFile(props.fileId);
    if (isTextType.value) {
      textContent.value = fileData.value?.extractedText || '暂无文本内容';
    } else if (isImageType.value || props.fileType === 'pdf') {
      previewUrl.value = `/api/files/${props.fileId}/preview`;
    }
  } catch (e) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

function retryPreview() { loadPreview(); }
function downloadFile() { filePreviewStore.downloadFile(props.fileId); }
function formatSize(size) {
  if (!size) return '';
  const units = ['B','KB','MB','GB'];
  let i = 0; let val = size;
  while (val >= 1024 && i < units.length-1) { val/=1024; i++; }
  return val.toFixed(1) + ' ' + units[i];
}

onMounted(loadPreview);
watch(() => props.fileId, loadPreview);
</script>

<style scoped>
.preview-shell { display:flex; flex-direction:column; height:100%; background:#fff; }
.preview-header-bar { display:flex; align-items:center; padding:10px 18px; border-bottom:1px solid #e6e8eb; background:#fff; gap:24px; }
.filename { font-size:16px; font-weight:600; margin:0 0 4px; max-width:380px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.left-meta { flex:1; min-width:0; }
.meta-line { display:flex; gap:16px; font-size:12px; color:#808089; }
.center-switch { display:flex; }
.right-actions { display:flex; gap:8px; }

.preview-main { flex:1; display:flex; overflow:hidden; }
.doc-area { flex:1; position:relative; display:flex; flex-direction:column; }
.doc-area.with-ai { margin-right:0; }
.doc-scroll { flex:1; overflow:auto; padding:18px 28px 28px; background:#f5f7fa; }

.state-holder { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 0; color:#909399; gap:12px; }
.media-wrapper { display:flex; align-items:center; justify-content:center; min-height:400px; }
.media-img { max-width:100%; max-height:80vh; object-fit:contain; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.08); background:#fff; }
.pdf-frame { width:100%; height:80vh; border:0; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.08); border-radius:8px; }

.text-wrapper { display:flex; flex-direction:column; gap:16px; }
.text-block pre { margin:0; font-family:Consolas,Menlo,monospace; font-size:13px; line-height:1.55; white-space:pre-wrap; word-break:break-word; background:#fff; padding:18px 20px; border:1px solid #ebeef5; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,.04); }

/* 滚动条美化 */
.doc-scroll::-webkit-scrollbar { width:8px; }
.doc-scroll::-webkit-scrollbar-track { background:transparent; }
.doc-scroll::-webkit-scrollbar-thumb { background:rgba(0,0,0,.15); border-radius:4px; }
.doc-scroll::-webkit-scrollbar-thumb:hover { background:rgba(0,0,0,.28); }
</style>
