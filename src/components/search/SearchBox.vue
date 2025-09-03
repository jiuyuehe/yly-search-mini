<template>
  <div class="search-box">
    <!-- Main search container (支持拖拽) -->
    <div class="search-container"
         @dragover.prevent
         @dragenter.prevent
         @drop.prevent="handleDrop">
      <div class="search-input-wrapper">
        <el-input
          v-model="searchQuery"
          type="textarea"
          rows=3
          placeholder="输入搜索关键词或问题（图片可拖入/上传，精准搜索可调精度）..."
          class="search-textarea"
          @keydown.ctrl.enter="handleSearch"
          @keydown.meta.enter="handleSearch"
          @keydown.enter.exact.prevent="enterQuickSearch"
        />

        <!-- 已选择图片预览 -->
        <transition name="fade">
          <div v-if="imagePreview" class="image-preview-chip">
            <img :src="imagePreview" alt="预览" />
            <div class="chip-meta">
              <span class="name" :title="imageFile?.name">{{ imageFile?.name }}</span>
              <span class="size">{{ prettySize }}</span>
            </div>
            <el-icon class="remove-icon" @click="removeImage"><Close /></el-icon>
          </div>
        </transition>
        
        <div class="search-footer">
          <div class="search-type-selector">
            <el-select 
              v-model="searchType" 
              size="small" 
              class="search-type-select"
            >
              <el-option label="全文搜索" value="fullText" />
              <el-option label="精准搜索" value="precision" />
              <el-option label="图片搜索" value="image" />
              <el-option label="通用问答" value="qa" />
            </el-select>
          </div>

          <!-- 精准搜索 精度控制 -->
          <div v-if="searchType==='precision'" class="precision-box">
            <span class="label">精准度</span>
            <el-slider v-model="precision" :min="0.6" :max="1" :step="0.01" class="precision-slider" :show-tooltip="true" />
            <el-input-number v-model="precision" :min="0.6" :max="1" :step="0.01" size="small" :precision="2" class="precision-input" />
          </div>

          <!-- 图片上传按钮（仅图片/问答模式显示） -->
          <div class="extra-actions">
            <el-button 
              v-if="['image','qa'].includes(searchType)" 
              size="small" 
              class="image-upload-btn"
              :disabled="uploading"
              @click="triggerImageSelect">
              <el-icon class="btn-icon"><Upload /></el-icon>
              <span>{{ imageFile ? '重新选择' : '上传图片' }}</span>
            </el-button>
          </div>
          
          <el-button 
            type="primary" 
            size="small"
            :disabled="!canSearch"
            @click="handleSearch"
            class="search-btn"
          >
            <el-icon><Search /></el-icon>
          </el-button>
        </div>

        <!-- 隐藏文件输入 -->
        <input ref="fileInput" type="file" accept="image/*" hidden @change="handleImageSelect" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Search, Upload, Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const emit = defineEmits(['search']);

const searchQuery = ref('');
const searchType = ref('fullText');
const precision = ref(0.9); // 0.6~1

// 图片相关
const fileInput = ref(null);
const imageFile = ref(null);
const imagePreview = ref('');
const uploading = ref(false);

const prettySize = computed(() => {
  if (!imageFile.value) return '';
  const size = imageFile.value.size;
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / 1024 / 1024).toFixed(2) + ' MB';
});

const canSearch = computed(() => {
  if (['image'].includes(searchType.value)) {
    return !!imageFile.value || !!searchQuery.value.trim();
  }
  return !!searchQuery.value.trim();
});

function buildEmitPayload() {
  return { query: searchQuery.value.trim(), searchType: searchType.value, imageFile: imageFile.value, precision: precision.value };
}

function handleSearch() {
  if (!canSearch.value) return;
  const payload = buildEmitPayload();
  // 兼容旧签名: (query, searchType, imageFile)
  emit('search', payload.query, payload.searchType, payload.imageFile, { precision: payload.precision });
}

function enterQuickSearch(e) {
  // 单行 Enter 快速触发（多行文本时可按 Shift+Enter 换行）
  if (!e.shiftKey) handleSearch();
}

function triggerImageSelect() { fileInput.value && fileInput.value.click(); }
function handleImageSelect(e) { const file = e.target.files && e.target.files[0]; if (file) processImageFile(file); e.target.value = ''; }
function processImageFile(file) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 10 * 1024 * 1024) { ElMessage.warning('图片大小不能超过10MB'); return; }
  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = ev => { imagePreview.value = ev.target.result; };
  reader.readAsDataURL(file);
}
function handleDrop(e) { const file = e.dataTransfer.files && e.dataTransfer.files[0]; if (file) processImageFile(file); }
function removeImage() { imageFile.value = null; imagePreview.value = ''; }

// 约束 precision 范围
watch(precision, (v) => { if (v < 0.6) precision.value = 0.6; else if (v > 1) precision.value = 1; });
</script>

<style scoped>
.search-box { display: flex; align-items: flex-start; gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
.search-container { flex: 1; background: var(--background-color); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); padding: var(--spacing-md); box-shadow: var(--shadow-sm); transition: all 0.2s ease; }
.search-container:hover { border-color: var(--primary-color); box-shadow: var(--shadow-md); }
.search-container:focus-within { border-color: var(--primary-color); box-shadow: 0 0 0 3px var(--primary-color-light); }
.search-input-wrapper { width: 100%; }
:deep(.search-textarea .el-textarea__inner) { box-shadow: none; padding: 0; font-size: 16px; line-height: 1.5; color: var(--text-color-primary); background: transparent; }
:deep(.search-textarea .el-textarea__inner):focus { border: none; box-shadow: none; }
:deep(.search-textarea .el-textarea__inner)::placeholder { color: var(--text-color-placeholder); }
.search-footer { display: flex; justify-content: space-between; align-items: center; width:100%; gap:12px; flex-wrap:wrap; }
.search-type-selector { flex: 0 0 auto; }
.search-type-select { width: 120px; }
:deep(.search-type-select .el-input__wrapper) { border-radius: var(--border-radius-sm); border-color: var(--border-color); }
.search-btn { background-color: var(--primary-color); border-color: var(--primary-color); border-radius: var(--border-radius-sm); padding: var(--spacing-xs) var(--spacing-md); height: 32px; }
.search-btn:hover { background-color: var(--primary-color-dark); border-color: var(--primary-color-dark); }
.search-btn:disabled { background-color: var(--border-color); border-color: var(--border-color); color: var(--text-color-placeholder); }
.extra-actions { display:flex; align-items:center; }
.image-upload-btn { border-radius: var(--border-radius-sm); }
.image-upload-btn .btn-icon { margin-right:4px; }
.image-preview-chip { margin-top: 8px; display: flex; align-items: center; gap: 8px; background: var(--background-color-light); border: 1px solid var(--border-color-light); padding: 6px 10px 6px 6px; border-radius: var(--border-radius-md); position: relative; max-width: 320px; }
.image-preview-chip img { width: 40px; height: 40px; object-fit: cover; border-radius: var(--border-radius-sm); border:1px solid var(--border-color); }
.image-preview-chip .chip-meta { display:flex; flex-direction:column; min-width:0; }
.image-preview-chip .name { font-size:12px; color:var(--text-color-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }
.image-preview-chip .size { font-size:11px; color:var(--text-color-secondary); }
.image-preview_chip .remove-icon { cursor:pointer; color: var(--text-color-secondary); position:absolute; top:4px; right:4px; }
.image-preview_chip .remove-icon:hover { color: var(--primary-color); }
.search-container.dragover { border-color: var(--primary-color); background: var(--primary-color-lighter); }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity:0; }
.precision-box { display:flex; align-items:center; gap:6px; min-width:240px; }
.precision-box .label { font-size:12px; color:var(--text-color-secondary); }
.precision-slider { width:140px; }
.precision-input { width:90px; }
</style>

