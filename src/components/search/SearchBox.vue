<template>
  <div class="search-box">
    <!-- Main search container (支持拖拽) -->
    <div class="search-container" @dragover.prevent @dragenter.prevent @drop.prevent="handleDrop">
      <div class="search-input-wrapper">
        <el-input ref="inputRef" v-model="searchQuery" type="textarea" rows=3 placeholder="输入搜索关键词或问题（图片可拖入/上传，选择模式可调整策略）..."
          class="search-textarea" @keydown.ctrl.enter="handleSearch" @keydown.meta.enter="handleSearch"
          @keydown.enter.exact.prevent="enterQuickSearch" />

        <!-- 已选择图片预览 -->
        <transition name="fade">
          <div v-if="imagePreview" class="image-preview-chip">
            <img :src="imagePreview" alt="预览" />
            <div class="chip-meta">
              <span class="name" :title="imageFile?.name">{{ imageFile?.name }}</span>
              <span class="size">{{ prettySize }}</span>
            </div>
            <el-icon class="remove-icon" @click="removeImage">
              <Close />
            </el-icon>
          </div>
        </transition>

        <div class="search-footer">
         <div class="left-controls">
           <div class="search-type-selector">
            <el-select v-model="searchType" size="small" class="search-type-select">
              <el-option label="全文搜索" value="fullText" />
              <el-option label="图片搜索" value="image" />
              <el-option label="通用问答" value="qa" />
            </el-select>
          </div>

          <!-- 模式选择：全文(1)/段落(2)/精准(3) 仅文本相关显示 -->
          <div class="mode-select" v-if="!['image','qa'].includes(searchType)">
            <el-select v-model="textSearchMode" size="small" class="mode-select-inner" @change="handleModeChange">
              <el-option label="快速" :value="1" />
              <el-option label="精准" :value="2" />
              <el-option label="模糊" :value="3" />
            </el-select>
          </div>

          <!-- 图片上传按钮（仅图片/问答模式显示） -->
          <div class="extra-actions">
            <el-button v-if="['image'].includes(searchType)" size="small" class="image-upload-btn"
              :disabled="uploading" @click="triggerImageSelect">
              <el-icon class="btn-icon">
                <Upload />
              </el-icon>
              <span>{{ imageFile ? '重新选择' : '上传图片' }}</span>
            </el-button>
          </div>
         </div>

          <el-button type="primary" size="small" :disabled="!canSearch" @click="handleSearch" class="search-btn">
            <el-icon>
              <Search />
            </el-icon>
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
import { useSearchStore } from '../../stores/search';

const emit = defineEmits(['search']);

const props = defineProps({ initialQuery: { type: String, default: '' } });

const searchQuery = ref(props.initialQuery || '');
// sync to store for other components (FilterSidebar) to read
const searchStore = useSearchStore();
const searchType = ref(searchStore.searchType || 'fullText');
const textSearchMode = ref(3); // 

// 图片相关
const fileInput = ref(null);
const inputRef = ref(null);
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
  // allow clicking search even when input is empty for text search
  return true;
});

watch(textSearchMode, (v) => { try { searchStore.precisionMode = Number(v); } catch {} }, { immediate: true });
// keep local select in sync with store (e.g., when returning from preview)
watch(() => searchStore.searchType, (v) => { try { if (v && v !== searchType.value) searchType.value = v; } catch {} });
// when user changes select, sync back to store
watch(searchType, (v) => { try { if (v && v !== searchStore.searchType) searchStore.setSearchType && searchStore.setSearchType(v); } catch {} });

function buildEmitPayload() {
  return { query: searchQuery.value.trim(), searchType: searchType.value, imageFile: imageFile.value, precisionMode: textSearchMode.value };
}

function handleSearch() {
  if (!canSearch.value) return;
  const payload = buildEmitPayload();
  emit('search', payload.query, payload.searchType, payload.imageFile, { precisionMode: payload.precisionMode });
}

// keep internal searchQuery in sync if parent provides initialQuery
watch(() => props.initialQuery, (v) => {
  if (typeof v === 'string' && v !== searchQuery.value) searchQuery.value = v;
});

function handleModeChange() {
  // 选择即搜
  if (canSearch.value) handleSearch();
}

function enterQuickSearch(e) { if (!e.shiftKey) handleSearch(); }
function triggerImageSelect() { fileInput.value && fileInput.value.click(); }
function handleImageSelect(e) { const file = e.target.files && e.target.files[0]; if (file) processImageFile(file); e.target.value='';
  // focus back to the text input so Enter can trigger search immediately
  setTimeout(()=>{ try{ inputRef.value && inputRef.value.focus && inputRef.value.focus(); }catch(e){} }, 50);
}
function processImageFile(file) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 10 * 1024 * 1024) { ElMessage.warning('图片大小不能超过10MB'); return; }
  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = ev => { imagePreview.value = ev.target.result; };
  reader.readAsDataURL(file);
  // focus input after selecting image so user can press Enter to search
  setTimeout(()=>{ try{ inputRef.value && inputRef.value.focus && inputRef.value.focus(); }catch(e){} }, 50);
}
function handleDrop(e) { const file = e.dataTransfer.files && e.dataTransfer.files[0]; if (file) processImageFile(file); }
function removeImage() { imageFile.value = null; imagePreview.value = '';
  // return focus to input so user can press Enter
  setTimeout(()=>{ try{ inputRef.value && inputRef.value.focus && inputRef.value.focus(); }catch(e){} }, 50);
}

// Listen for global requests to change the search type (e.g., returning from QA)
if (typeof window !== 'undefined') {
  const onSetSearchType = (e) => {
    const t = e && e.detail;
    if (t && ['fullText','image','qa'].includes(t)) {
      searchType.value = t;
    }
  };
  window.addEventListener('set-search-type', onSetSearchType);
}
</script>

<style scoped>
.search-box {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.search-container {
  flex: 1;
  background: #FFFFFF;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.search-container:hover {
  border-color: #3B82F6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.search-container:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.search-input-wrapper {
  width: 100%;
}

:deep(.search-textarea .el-textarea__inner) {
  box-shadow: none;
  padding: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #1F2937;
  background: transparent;
  border: none;
  resize: none;
}

:deep(.search-textarea .el-textarea__inner):focus {
  border: none;
  box-shadow: none;
  outline: none;
}

:deep(.search-textarea .el-textarea__inner)::placeholder {
  color: #9CA3AF;
  font-size: 14px;
}

.search-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
}

.left-controls{
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-type-selector {
  flex: 0 0 auto;
}

.search-type-select {
  width: 130px;
}

:deep(.search-type-select .el-input__wrapper) {
  border-radius: 8px;
  border-color: #E5E7EB;
  background: #F9FAFB;
  transition: all 0.2s;
}

:deep(.search-type-select .el-input__wrapper:hover) {
  border-color: #3B82F6;
  background: #FFFFFF;
}

.search-btn {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-color: #3B82F6;
  border-radius: 8px;
  padding: 8px 24px;
  height: 36px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.3s;
}

.search-btn:hover {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  border-color: #2563EB;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.search-btn:active {
  transform: translateY(0);
}

.search-btn:disabled {
  background: #E5E7EB;
  border-color: #E5E7EB;
  color: #9CA3AF;
  box-shadow: none;
  transform: none;
}

.extra-actions {
  display: flex;
  align-items: center;
}

.image-upload-btn {
  border-radius: 8px;
  border-color: #3B82F6;
  color: #3B82F6;
  background: #EFF6FF;
  transition: all 0.2s;
}

.image-upload-btn:hover {
  background: #3B82F6;
  color: #FFFFFF;
  border-color: #2563EB;
}

.image-upload-btn .btn-icon {
  margin-right: 4px;
}

.mode-select {
  display: flex;
  align-items: center;
}

.mode-select-inner {
  width: 100px;
}

:deep(.mode-select-inner .el-input__wrapper) {
  border-radius: 8px;
  border-color: #E5E7EB;
  background: #F9FAFB;
  transition: all 0.2s;
}

:deep(.mode-select-inner .el-input__wrapper:hover) {
  border-color: #3B82F6;
  background: #FFFFFF;
}

.image-preview-chip {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--background-color-light);
  border: 1px solid var(--border-color-light);
  padding: 6px 10px 6px 6px;
  border-radius: var(--border-radius-md);
  position: relative;
  max-width: 320px;
}

.image-preview-chip img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
}

.image-preview-chip .chip-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.image-preview-chip .name {
  font-size: 12px;
  color: var(--text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.image-preview-chip .size {
  font-size: 11px;
  color: var(--text-color-secondary);
}

.image-preview_chip .remove-icon {
  cursor: pointer;
  color: var(--text-color-secondary);
  position: absolute;
  top: 4px;
  right: 4px;
}

.image-preview_chip .remove-icon:hover {
  color: var(--primary-color);
}

.search-container.dragover {
  border-color: var(--primary-color);
  background: var(--primary-color-lighter);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.mode-select {
  display: flex;
  align-items: center;
}

.mode-select-inner {
  width: 110px;
}
</style>

