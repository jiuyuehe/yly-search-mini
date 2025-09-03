<template>
  <div class="search-result-item" :class="{ 'grid-mode': displayMode === 'grid' }" @click="$emit('click')">
    <!-- Grid layout for image search -->
    <template v-if="displayMode === 'grid'">
      <div class="grid-item-header">
        <el-checkbox 
          :model-value="selected" 
          @click.stop
          @change="$emit('update:selected', $event)"
          class="grid-checkbox"
        />
        <div v-if="hasScore" class="grid-score">
          <el-tag size="small" type="warning" effect="light">{{ displayScore }}</el-tag>
        </div>
      </div>
      
      <!-- Large thumbnail for grid view -->
      <div class="grid-thumb-container">
        <img 
          v-if="thumbSrc && !thumbBroken" 
          :src="thumbSrc" 
          class="grid-thumb" 
          @error="onThumbError" 
        />
        <div v-else class="grid-thumb-fallback">
          <img :src="fallbackIcon" class="fallback-icon" />
        </div>
      </div>
      
      <!-- Grid file info -->
      <div class="grid-file-info">
        <div class="grid-file-name" :title="metaFile.name">{{ metaFile.name }}</div>
        <div class="grid-file-meta">
          <span class="grid-file-size">{{ prettySize(metaFile.size) }}</span>
          <span class="grid-file-creator">{{ metaFile.creator }}</span>
        </div>
      </div>
    </template>
    
    <!-- List layout for regular search -->
    <template v-else>
      <div class="item-header">
        <el-checkbox 
          :model-value="selected" 
          @click.stop
          @change="$emit('update:selected', $event)"
        />
        <!-- 缩略图（图片类型） -->
        <div v-if="isImage" class="thumb-box">
          <img v-if="thumbSrc" :src="thumbSrc" class="thumb" @error="onThumbError" />
          <img v-else :src="fallbackIcon" class="thumb fallback" />
        </div>
        <!-- 文件信息 -->
        <div class="file-info">
          <FileMetaInfo :file="metaFile" :highlight="searchQuery" @open-path="openPath" />
          <div v-if="hasScore" class="score-line">
            <el-tag size="small" type="warning" effect="light">Score: {{ displayScore }}</el-tag>
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
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { goCloudPath } from '../../services/navigation';
import FileMetaInfo from '../preview/FileMetaInfo.vue';
import { parseftsIcon } from '../../filters/filters';

const props = defineProps({
  item: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  displayMode: { type: String, default: 'list' } // 'list' or 'grid'
});
const _emit = defineEmits(['click', 'update:selected']);

const metaFile = computed(() => ({
  name: props.item.name || props.item.fileName,
  fileName: props.item.fileName || props.item.name,
  creator: props.item.creator,
  modifiedTime: props.item.updateTime || props.item.modifiedTime,
  size: props.item.size || props.item.fileSize,
  filePath: props.item.filePath || props.item.path || '',
  fileType: props.item.fileType || props.item.type || '',
  fileCategory: props.item.fileCategory || props.item.fc || ''
}));


function openPath() { goCloudPath(props.item); }

const rawPreview = computed(() => (props.item && typeof props.item.preview === 'string') ? props.item.preview : '');

// 图片判定与缩略图
const isImage = computed(() => props.item.type === 'image' || ['png','jpg','jpeg','gif','bmp','webp','tiff','svg'].includes((props.item.fileType||'').toLowerCase()));
const thumbSrc = computed(() => props.item.thumbUrl || props.item.fsFileThumb || props.item.thumb || '');
const fallbackIcon = computed(() => { try { return parseftsIcon(props.item); } catch { return ''; } });
const thumbBroken = ref(false);
function onThumbError() { thumbBroken.value = true; }

// 得分显示（0~1）
const hasScore = computed(() => typeof props.item.score === 'number');
const displayScore = computed(() => {
  if (!hasScore.value) return '';
  // 保留两位小数
  return props.item.score.toFixed(2);
});

// 文件大小格式化
function prettySize(size) {
  if (!size) return '';
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / 1024 / 1024).toFixed(2) + ' MB';
}
</script>

<style scoped>
.search-result-item { border: 1px solid #e4e7ed; border-radius: 8px; padding: 15px; margin-bottom: 10px; cursor: pointer; transition: all 0.3s; }
.search-result-item:hover { border-color: #409eff; box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1); }

/* List layout (default) */
.item-header { display:flex; align-items:center; gap:12px; }
.file-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
.item-actions { display: flex; gap: 8px; }
.item-preview { margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; font-size: 14px; color: #606266; }
.item-preview :deep(font) { background:#FBD9A7; padding:0 2px; border-radius:3px; font-weight:600; }
.item-tags { margin-top: 10px; display: flex; gap: 6px; }
.hl { background:#ffeb3b; padding:0 2px; border-radius:3px; font-weight:600; }
.thumb-box { width:64px; height:64px; flex:0 0 64px; display:flex; align-items:center; justify-content:center; border:1px solid #e5e7eb; border-radius:6px; background:#fff; overflow:hidden; position:relative; }
.thumb { width:100%; height:100%; object-fit:cover; transition:.25s; }
.thumb:hover { transform:scale(1.06); }
.score-line { display:flex; align-items:center; gap:6px; }

/* Grid layout for image search */
.search-result-item.grid-mode {
  margin-bottom: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 320px;
}

.grid-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.grid-checkbox {
  flex: 0 0 auto;
}

.grid-score {
  flex: 0 0 auto;
}

.grid-thumb-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
  min-height: 180px;
}

.grid-thumb {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s;
}

.grid-thumb:hover {
  transform: scale(1.05);
}

.grid-thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f0f0f0;
}

.fallback-icon {
  width: 64px;
  height: 64px;
  opacity: 0.6;
}

.grid-file-info {
  flex: 0 0 auto;
}

.grid-file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.grid-file-size, .grid-file-creator {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-file-creator {
  max-width: 100px;
}
</style>
