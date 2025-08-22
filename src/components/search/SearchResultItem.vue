<template>
  <div class="search-result-item" @click="$emit('click')">
    <div class="item-header">
      <el-checkbox 
        :model-value="selected" 
        @click.stop
        @change="$emit('update:selected', $event)"
      />
      <div class="file-icon">
        <img :src="fileIcon" alt="icon" class="file-icon-img" />
      </div>
      <div class="file-info">
        <h4 class="file-name" v-html="highlightName"></h4>
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
    
    <div v-if="item.preview" class="item-preview" v-html="rawPreview"></div>
    
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
import { computed } from 'vue';
import { parseftsIcon } from '../../filters/filters';

const props = defineProps({
  item: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' }
});
defineEmits(['click', 'update:selected']);

const fileIcon = computed(() => {
  const compat = { ...props.item };
  if (!compat.fileName && props.item.name) compat.fileName = props.item.name;
  try { return parseftsIcon(compat); } catch { return new URL('../../assets/ftsicon/unknown.png', import.meta.url).href; }
});

function formatFileSize(size) {
  if (!size) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0; let fileSize = size;
  while (fileSize >= 1024 && unitIndex < units.length - 1) { fileSize /= 1024; unitIndex++; }
  return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
}
function formatDate(date) { if (!date) return ''; return new Date(date).toLocaleDateString('zh-CN'); }

const rawPreview = computed(() => {
  if (!props.item) return '';
  return typeof props.item.preview === 'string' ? props.item.preview : '';
});

const highlightName = computed(() => {
  const name = props.item?.name || '';
  const q = (props.searchQuery || '').trim();
  if (!q) return name;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return name.replace(new RegExp(escaped, 'gi'), m => `<span style="background:#FBD9A7;">${m}</span>`);
  } catch { return name; }
});
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
/* 若后端未内联背景，可给 font 标签一个统一高亮背景（可选） */
.item-preview :deep(font) {
  background:#FBD9A7;
  padding:0 2px;
  border-radius:3px;
  font-weight:600;
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

/* 文件名高亮与预览统一 */
.hl {
  background:#ffeb3b;
  padding:0 2px;
  border-radius:3px;
  font-weight:600;
}

.file-icon-img { width:48px; height:48px; object-fit:contain; display:block; }
</style>
