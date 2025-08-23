<template>
  <div class="search-result-item" @click="$emit('click')">
    <div class="item-header">
      <el-checkbox 
        :model-value="selected" 
        @click.stop
        @change="$emit('update:selected', $event)"
      />
      <!-- 直接使用统一 FileMetaInfo，增加高亮 -->
      <div class="file-info">
        <FileMetaInfo :file="metaFile" :highlight="searchQuery" @open-path="openPath" />
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
import FileMetaInfo from '../preview/FileMetaInfo.vue';

const props = defineProps({
  item: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' }
});
const emit = defineEmits(['click', 'update:selected']);

const metaFile = computed(() => ({
  name: props.item.name || props.item.fileName,
  fileName: props.item.fileName || props.item.name,
  creator: props.item.creator,
  modifiedTime: props.item.updateTime || props.item.modifiedTime,
  size: props.item.size || props.item.fileSize,
  filePath: props.item.filePath || props.item.path || '',
  fileType: props.item.fileType || props.item.type || ''
}));

function openPath(p) { emit('open-path', p); }

const rawPreview = computed(() => (props.item && typeof props.item.preview === 'string') ? props.item.preview : '');
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

.item-header { display:flex; align-items:center; gap:12px; }

.file-info { flex:1; min-width:0; }

.file-name { display:none; }

.file-meta { display:none; }

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
</style>
