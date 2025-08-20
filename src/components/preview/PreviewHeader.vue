<template>
  <div class="preview-header">
    <div class="file-info">
      <h2>{{ file?.name || '文件预览' }}</h2>
      <div class="file-meta">
        <span>{{ formatFileSize(file?.size) }}</span>
        <span>{{ formatDate(file?.modifiedTime) }}</span>
        <span>{{ file?.creator }}</span>
      </div>
    </div>
    
    <div class="header-controls">
      <div class="panel-toggles">
        <el-button
          :type="activePanels.filePreview ? 'primary' : 'default'"
          @click="$emit('toggle-panel', 'filePreview')"
        >
          文件预览
        </el-button>
        <el-button
          :type="activePanels.aiTools ? 'primary' : 'default'"
          @click="$emit('toggle-panel', 'aiTools')"
        >
          AI工具
        </el-button>
        <el-button
          :type="activePanels.textExtraction ? 'primary' : 'default'"
          @click="$emit('toggle-panel', 'textExtraction')"
        >
          文本提取
        </el-button>
        <el-button
          :type="activePanels.translation ? 'primary' : 'default'"
          @click="$emit('toggle-panel', 'translation')"
        >
          翻译
        </el-button>
      </div>
      
      <div class="action-buttons">
        <el-button @click="$emit('download')">下载</el-button>
        <el-button @click="$emit('locate')">定位</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  file: {
    type: Object,
    default: () => ({})
  },
  activePanels: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['toggle-panel', 'download', 'locate']);

function formatFileSize(size) {
  if (!size) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let fileSize = size;
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }
  
  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('zh-CN');
}
</script>

<style scoped>
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fff;
}

.file-info h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.file-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #909399;
}

.header-controls {
  display: flex;
  gap: 20px;
  align-items: center;
}

.panel-toggles {
  display: flex;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
