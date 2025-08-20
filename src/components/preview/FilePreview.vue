<template>
  <div class="file-preview">
    <div v-if="loading" class="preview-loading">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="error" class="preview-error">
      <el-empty description="预览失败">
        <el-button type="primary" @click="retryPreview">重试</el-button>
      </el-empty>
    </div>
    
    <div v-else class="preview-content">
      <!-- PDF预览 -->
      <div v-if="fileType === 'pdf'" class="pdf-preview">
        <iframe 
          v-if="previewUrl"
          :src="previewUrl" 
          width="100%" 
          height="100%"
          frameborder="0"
        />
        <el-empty v-else description="PDF预览不可用" />
      </div>
      
      <!-- 图片预览 -->
      <div v-else-if="isImageType" class="image-preview">
        <img 
          v-if="previewUrl"
          :src="previewUrl" 
          alt="图片预览"
          style="max-width: 100%; max-height: 100%; object-fit: contain;"
        />
        <el-empty v-else description="图片预览不可用" />
      </div>
      
      <!-- 文本预览 -->
      <div v-else-if="isTextType" class="text-preview">
        <pre v-if="textContent">{{ textContent }}</pre>
        <el-empty v-else description="文本内容为空" />
      </div>
      
      <!-- 默认预览 -->
      <div v-else class="unsupported-preview">
        <el-empty description="此文件类型暂不支持在线预览">
          <template #image>
            <div style="font-size: 48px; color: #909399;">📄</div>
          </template>
          <template #description>
            <p>{{ fileData?.name || '未知文件' }}</p>
            <p>文件类型：{{ fileType || '未知' }}</p>
            <el-button type="primary" @click="downloadFile">下载文件</el-button>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useFilePreviewStore } from '../../stores/filePreview';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: ''
  }
});

const filePreviewStore = useFilePreviewStore();

const loading = ref(false);
const error = ref(null);
const previewUrl = ref('');
const textContent = ref('');
const fileData = ref(null);

// 计算属性
const isImageType = computed(() => {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(props.fileType?.toLowerCase());
});

const isTextType = computed(() => {
  return ['txt', 'md', 'json', 'xml', 'csv'].includes(props.fileType?.toLowerCase());
});

// 方法
async function loadPreview() {
  if (!props.fileId) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    // 获取文件数据
    fileData.value = await filePreviewStore.loadFile(props.fileId);
    
    // 根据文件类型加载预览
    if (isTextType.value) {
      // 加载文本内容
      textContent.value = fileData.value?.extractedText || '暂无文本内容';
    } else if (isImageType.value || props.fileType === 'pdf') {
      // 生成预览URL（模拟）
      previewUrl.value = `/api/files/${props.fileId}/preview`;
    }
  } catch (err) {
    error.value = err.message;
    console.error('Preview loading failed:', err);
  } finally {
    loading.value = false;
  }
}

function retryPreview() {
  loadPreview();
}

function downloadFile() {
  filePreviewStore.downloadFile(props.fileId);
}

// 生命周期
onMounted(() => {
  loadPreview();
});

// 监听文件ID变化
watch(() => props.fileId, () => {
  loadPreview();
}, { immediate: true });
</script>

<style scoped>
.file-preview {
  flex: 1;
  height: 100%;
  overflow: hidden;
  background-color: #f8f9fa;
}

.preview-loading,
.preview-error {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-content {
  height: 100%;
  overflow: auto;
}

.pdf-preview,
.image-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-preview {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

.text-preview pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.unsupported-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
