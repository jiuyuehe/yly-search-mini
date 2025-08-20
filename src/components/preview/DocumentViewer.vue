<template>
  <div class="doc-viewer" v-loading="loading">
    <div v-if="error" class="doc-error">
      <el-empty :description="error">
        <el-button type="primary" size="small" @click="load">重试</el-button>
      </el-empty>
    </div>
    <template v-else>
      <!-- 文本内容 -->
      <div v-if="isText" class="text-wrapper">
        <pre>{{ textContent || '暂无内容' }}</pre>
      </div>
      <!-- 图片 -->
      <div v-else-if="isImage" class="media-wrapper">
        <img v-if="previewUrl" :src="previewUrl" class="media-img" />
        <el-empty v-else description="图片预览不可用" />
      </div>
      <!-- PDF (iframe 占位) -->
      <div v-else-if="fileType === 'pdf'" class="media-wrapper">
        <iframe v-if="previewUrl" :src="previewUrl" class="pdf-frame" />
        <el-empty v-else description="PDF预览不可用" />
      </div>
      <!-- 其他类型 -->
      <div v-else class="media-wrapper">
        <el-empty description="此类型暂不支持预览" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useFilePreviewStore } from '../../stores/filePreview';

const props = defineProps({
  fileId: { type: String, required: true },
  fileType: { type: String, default: '' }
});

const store = useFilePreviewStore();
const loading = ref(false);
const error = ref('');
const textContent = ref('');
const previewUrl = ref('');

const isImage = computed(() => ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(props.fileType.toLowerCase()));
const isText = computed(() => ['txt','md','json','xml','csv'].includes(props.fileType.toLowerCase()));

async function load() {
  if (!props.fileId) return;
  loading.value = true; error.value='';
  try {
    const data = await store.loadFile(props.fileId);
    if (isText.value) textContent.value = data?.extractedText || '';
    if (isImage.value || props.fileType === 'pdf') previewUrl.value = `/api/files/${props.fileId}/preview`;
  } catch (e) { error.value = e.message || '加载失败'; }
  finally { loading.value = false; }
}

onMounted(load);
watch(() => props.fileId, load);
</script>

<style scoped>
.doc-viewer { position:relative; width:100%; height:100%; overflow:auto; padding:12px 24px 24px; background:#f5f7fa; }
.text-wrapper pre { margin:0; font-family:Consolas,monospace; font-size:13px; line-height:1.55; white-space:pre-wrap; word-break:break-word; background:#fff; border:1px solid #ebeef5; border-radius:8px; padding:18px 20px; box-shadow:0 1px 2px rgba(0,0,0,.05); }
.media-wrapper { display:flex; align-items:center; justify-content:center; min-height:400px; }
.media-img { max-width:100%; max-height:82vh; object-fit:contain; border-radius:8px; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.08); }
.pdf-frame { width:100%; height:82vh; border:0; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.08); border-radius:8px; }
.doc-error { padding:40px 0; }
</style>
