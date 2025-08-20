<template>
  <div class="search-result-item" @click="$emit('click')">
    <div class="item-header">
      <el-checkbox 
        :model-value="selected" 
        @click.stop
        @change="$emit('update:selected', $event)"
      />
      <div class="file-icon">
        <div class="icon-placeholder">{{ getFileIcon(item.type) }}</div>
      </div>
      <div class="file-info">
        <h4 class="file-name">{{ item.name }}</h4>
        <div class="file-meta">
          <span>{{ formatFileSize(item.size) }}</span>
          <span>{{ formatDate(item.modifiedTime) }}</span>
          <span>{{ item.creator }}</span>
        </div>
      </div>
      <div class="item-actions">
        <el-button size="small" type="primary" link>预览</el-button>
        <el-button size="small" link>下载</el-button>
      </div>
    </div>
    
    <div v-if="item.preview" class="item-preview">
      <p>{{ item.preview }}</p>
    </div>
    
    <div v-if="item.tags && item.tags.length" class="item-tags">
      <el-tag 
        v-for="tag in item.tags" 
        :key="tag" 
        size="small" 
        type="info"
      >
        {{ tag }}
      </el-tag>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click', 'update:selected']);

function getFileIcon(type) {
  switch (type) {
    case 'document': return '📄';
    case 'image': return '🖼️';
    case 'multimedia': return '🎬';
    case 'archive': return '📁';
    default: return '📋';
  }
}

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
.search-result-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.search-result-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-info {
  flex: 1;
}

.file-name {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.file-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #909399;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-preview {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}

.item-tags {
  margin-top: 10px;
  display: flex;
  gap: 6px;
}

.icon-placeholder {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background-color: #f0f0f0;
  border-radius: 4px;
}
</style>
