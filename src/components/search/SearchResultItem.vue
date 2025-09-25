<template>
  <div class="search-result-item" :class="{ 'grid-mode': displayMode === 'grid' }">
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
          class="grid-thumb clickable" 
          @error="onThumbError"
          @click.stop="handleThumbClick"
        />
        <div v-else class="grid-thumb-fallback">
          <img :src="fallbackIcon" class="fallback-icon" />
        </div>
      </div>
      
      <!-- Grid file info -->
        <div class="grid-file-info">
  <div class="grid-file-name" :title="metaFile.name" @click.stop="$emit('click', item, $event)">{{ metaFile.name }}</div>
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
          <img v-if="thumbSrc" :src="thumbSrc" class="thumb clickable" @error="onThumbError" @click.stop="handleThumbClick" />
          <img v-else :src="fallbackIcon" class="thumb fallback" />
        </div>
        <!-- 文件信息 -->
        <div class="file-info">
          <!-- 传入 highlight 字段给 FileMetaInfo 以使用前端高亮，保持 metaFile 不变 -->
          <!-- 使用 props.searchQuery 优先，回退到 store.query 以确保高亮在所有情况下生效 -->
          <FileMetaInfo :file="metaFile" :highlight="highlightTerm" :show-icon="!isImageSearch" @open-path="openPath" @open-preview="(f,e) => $emit('click', item, e)" />
          <!-- 当前文件语种 -->
          <div v-if="displayFileLang" class="lang-line">
            <el-tag size="small" type="info">{{ getLangLabel(displayFileLang) }}</el-tag>
          </div>
          <!-- 标签行：替换原先的得分行 -->
          <div v-if="item.tags && item.tags.length" class="tags-line">
            <el-tag
              v-for="tag in item.tags"
              :key="tag"
              size="small"
              type="primary"
              class="clickable"
              @click.stop="onTagClick(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        <div class="item-actions">
          <el-button size="small" type="primary" link @click.stop="$emit('click', item, $event)">预览</el-button>
          <!-- <el-button size="small" link>下载</el-button> -->
        </div>
      </div>
      
  <!-- 使用前端高亮处理 preview，移除后端可能带的 <em> 标签的样式并用本地高亮替换 -->
  <div v-if="item.preview" class="item-preview" :class="{ clamped: !expanded }" v-html="frontendPreview"></div>
      <div v-if="showToggle" class="preview-toggle">
        <el-button type="text" size="small" @click.stop="expanded = !expanded">{{ expanded ? '收起' : '展开' }}</el-button>
      </div>
      
      
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useSearchStore } from '../../stores/search';
import { goCloudPath } from '../../services/navigation';
import FileMetaInfo from '../preview/FileMetaInfo.vue';
import { parseftsIcon } from '../../filters/filters';
import { getLangLabel } from '../../utils/language';

const props = defineProps({
  item: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  displayMode: { type: String, default: 'list' }, // 'list' or 'grid'
  isImageSearch: { type: Boolean, default: false }
});
const _emit = defineEmits(['click', 'update:selected', 'tag-click']);

const searchStore = useSearchStore();

function onTagClick(tag) {
  try {
  // Emit event to parent so it can route to TagCloud handler (no global events)
  _emit('tag-click', tag);
  } catch {}
}

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

// normalized display language for this item (check multiple nested locations, including _raw)
const displayFileLang = computed(() => {
  try {
    const v1 = props.item?.file?.fileLang;
    const v2 = props.item?.fileLang;
    const v3 = props.item?.lang;
    const raw = props.item?._raw || props.item?._source || null;
    const v4 = raw?.file?.fileLang || raw?.fileLang || raw?._source?.fileLang || null;
    // treat empty string as missing
    const pick = (x) => (x != null && String(x).trim() !== '' ? String(x).trim() : null);
    return pick(v1) || pick(v2) || pick(v3) || pick(v4) || null;
  } catch (e) { return null; }
});

// Debug: if displayFileLang is missing, print the item and raw payload for investigation
watch(() => props.item, (it) => {
  if (!displayFileLang.value) {
    console.debug('[SearchResultItem] missing fileLang for item', {
      id: it?.id || it?.documentId || it?.fileId,
      file: it?.file,
      fileLang: it?.file?.fileLang,
      itemFileLang: it?.fileLang,
      itemLang: it?.lang,
      raw: it?._raw || it?._source || null
    });
  }
}, { immediate: true });


function openPath() { goCloudPath(props.item); }

// helpers
function escapeHtml(str='') {
  return String(str).replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));
}
function escapeReg(str='') { return String(str).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

// 确定用于高亮的关键词：优先使用组件 prop（例如来自父组件的即时输入），回退到 store 的 query
const highlightTerm = computed(() => {
  const local = (props.searchQuery || '').trim();
  if (local) return local;
  try { return (searchStore.query || '').trim(); } catch { return ''; }
});

// 原始后端 preview 可能包含 <em> 标签或其他 HTML，我们不会直接使用后端的高亮样式。
// frontendPreview 会：
// 1) 先将后端的 <em> 标签去掉（保留文本）
// 2) 基于 highlightTerm 在前端匹配关键词并用 <span class="hl">...</span> 包裹
// 3) 不改变 props.item.preview 原始内容
const frontendPreview = computed(() => {
  if (!props.item || typeof props.item.preview !== 'string') return '';
  try {
    // 1) remove <em> and any tags but keep inner text
    let src = props.item.preview.replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, '$1');
    // also strip other tags but preserve their inner text
    src = src.replace(/<[^>]+>/g, '');
    // escape HTML
    let escaped = escapeHtml(src);
  const kw = (highlightTerm.value || '').trim();
    if (!kw) return escaped;
    // 2) build regex from keywords (support multiple words separated by spaces)
    const parts = kw.split(/\s+/).filter(Boolean).map(p => escapeReg(p));
    if (parts.length === 0) return escaped;
    const reg = new RegExp('(' + parts.join('|') + ')', 'gi');
    return escaped.replace(reg, m => `<span class="hl">${m}</span>`);
  } catch (e) {
    // fallback to sanitized raw preview
    try { return escapeHtml(props.item.preview); } catch { return props.item.preview || ''; }
  }
});

// 控制展开/收起（默认收起）
const expanded = ref(false);
// 使用 rawPreview（已处理高亮的 HTML）来判断展示按钮：去除 HTML 标签后按字符数判断
const plainPreviewText = computed(() => {
  const html = frontendPreview.value || '';
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
});
// 如果纯文本超过阈值则显示展开按钮（阈值可调整）
const showToggle = computed(() => plainPreviewText.value.length > 180);

// 图片判定与缩略图
const isImage = computed(() => {
  try {
    if (!props.item) return false;
    if (props.item.type === 'image') return true;
    if (props.item.isImage === true) return true;
    const ft = (props.item.fileType || '').toLowerCase();
    const imgExts = ['png','jpg','jpeg','gif','bmp','webp','tiff','svg'];
    if (ft && imgExts.includes(ft)) return true;
    const name = (props.item.fileName || props.item.name || '').toLowerCase();
    const parts = name.split('.');
    const ext = parts.length > 1 ? parts[parts.length-1] : '';
    if (ext && imgExts.includes(ext)) return true;
    // backend may provide thumbnails even when fileType is absent
    if (props.item.imageThumbnail || props.item.image_thumb || props.item.fsFileThumb || props.item.thumb) return true;
    return false;
  } catch (e) { return false; }
});
const thumbSrc = computed(() => {
  // Prefer backend-provided imageThumbnail (may be base64 string or data URL)
  const t = props.item && (props.item.imageThumbnail || props.item.image_thumb || props.item.thumbnail);
  if (t && typeof t === 'string') {
    const trimmed = t.trim();
    if (/^data:\w+\/[a-zA-Z+.-]+;base64,/.test(trimmed)) return trimmed;
    // if it's pure base64 (may optionally start with '/'), assume jpeg
    const compact = trimmed.replace(/\s+/g,'');
    if (/^\/?[A-Za-z0-9+/=]+$/.test(compact) && compact.length > 50) {
      return 'data:image/jpeg;base64,' + compact;
    }
  }
  let url = props.item.thumbUrl || props.item.fsFileThumb || props.item.thumb || '';
  const abs = /^https?:/i.test(url) ? url : (window.location.origin.replace(/\/$/,'') + '/' + url.replace(/^\//,''));
  return abs;
});
const fallbackIcon = computed(() => { try { return parseftsIcon(props.item); } catch { return ''; } });
const thumbBroken = ref(false);
function onThumbError() { thumbBroken.value = true; }

function handleThumbClick(e) {
  e && e.stopPropagation && e.stopPropagation();
  _emit('click', props.item, e);
}

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
/* Prevent stretching when parent is a grid/flex container (single item case) */
.search-result-item { align-self: start; }

/* List layout (default) */
.item-header { display:flex; align-items:center; gap:12px; }
.file-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
.item-actions { display: flex; gap: 8px; }
.item-preview { margin-top: 10px;  margin-left: 20px;   padding: 2px 10px; background-color: #f8f9fa; border-radius: 4px; font-size: 14px; color: #606266; }
.item-preview :deep(font) { background:#FBD9A7; padding:0 2px; border-radius:3px; font-weight:600; }
.item-tags { margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
.tags-line { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px; }
.lang-line { margin-top: 6px; display: flex; gap: 6px; align-items: center; }
.item-preview :deep(.hl) { background:#ffeb3b; padding:0 2px; border-radius:3px; font-weight:600; }

/* clamp to two lines when not expanded */
.item-preview.clamped{
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
.preview-toggle{ margin-top:6px; display:flex; justify-content:flex-end; }
.thumb-box { width:64px; height:64px; flex:0 0 64px; display:flex; align-items:center; justify-content:center; border:1px solid #e5e7eb; border-radius:6px; background:#fff; overflow:hidden; position:relative; }
.thumb { width:100%; height:100%; object-fit:cover; transition:.25s; }
.thumb:hover { transform:scale(1.06); }
.clickable { cursor: pointer; }
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
