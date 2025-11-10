<template>
  <div class="search-box">
    <!-- Main search container (支持拖拽) -->
    <div class="search-container" @dragover.prevent @dragenter.prevent @drop.prevent="handleDrop">
      <div class="search-input-wrapper">
        <div class="search-row">
          <el-input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search"
            class="search-pill"
            @keydown.enter.exact.prevent="enterQuickSearch"
          >
            <template #prefix>
              <el-icon class="prefix-icon"><Search /></el-icon>
            </template>
            <template #suffix>
              <div class="suffix-actions">
                <el-tooltip content="上传图片（也可拖入）" placement="bottom">
                  <el-button link class="img-suffix-btn" :disabled="uploading" @click.stop="triggerImageSelect">
                    <el-icon><Picture /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-button type="primary" size="small" circle class="search-btn" @click.stop="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
                <el-tooltip content="AI 问答" placement="bottom">
                  <el-button link class="ai-suffix-btn" @click.stop="handleAskAI">
                    <el-icon><MagicStick /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-input>
        </div>

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

        <!-- 隐藏文件输入 -->
        <input ref="fileInput" type="file" accept="image/*" hidden @change="handleImageSelect" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Search, Picture, Close, MagicStick } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useSearchStore } from '../../stores/search';

const emit = defineEmits(['search','qa-request']);

const props = defineProps({ initialQuery: { type: String, default: '' } });

const searchQuery = ref(props.initialQuery || '');
// sync to store for other components (FilterSidebar) to read
const searchStore = useSearchStore();
// 精简后不在本组件内提供模式与类型选择

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
  // 允许空查询触发默认搜索；如选择了图片则将进行图片搜索
  return true;
});

function handleSearch() {
  if (!canSearch.value) return;
  const query = searchQuery.value.trim();
  const type = imageFile.value ? 'image' : 'fullText';
  const precisionMode = Number(searchStore.precisionMode || 3);
  emit('search', query, type, imageFile.value, { precisionMode });
}

// keep internal searchQuery in sync if parent provides initialQuery
watch(() => props.initialQuery, (v) => {
  if (typeof v === 'string' && v !== searchQuery.value) searchQuery.value = v;
});

function enterQuickSearch(e) { if (!e.shiftKey) handleSearch(); }
function triggerImageSelect() { fileInput.value && fileInput.value.click(); }
function handleImageSelect(e) { const file = e.target.files && e.target.files[0]; if (file) processImageFile(file); e.target.value='';
  // focus back to the text input so Enter can trigger search immediately
  setTimeout(()=>{ try { inputRef.value && inputRef.value.focus && inputRef.value.focus(); } catch { /* 输入框可能不存在，忽略 */ } }, 50);
}
function processImageFile(file) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 10 * 1024 * 1024) { ElMessage.warning('图片大小不能超过10MB'); return; }
  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = ev => { imagePreview.value = ev.target.result; };
  reader.readAsDataURL(file);
  // focus input after selecting image so user can press Enter to search
  setTimeout(()=>{ try{ inputRef.value && inputRef.value.focus && inputRef.value.focus(); }catch{ /* 输入框可能不存在，忽略 */ } }, 50);
}
function handleDrop(e) { const file = e.dataTransfer.files && e.dataTransfer.files[0]; if (file) processImageFile(file); }
function removeImage() { imageFile.value = null; imagePreview.value = '';
  // return focus to input so user can press Enter
  setTimeout(()=>{ try{ inputRef.value && inputRef.value.focus && inputRef.value.focus(); }catch{ /* 输入框可能不存在，忽略 */ } }, 50);
}

// AI 问答入口：向父级发出 qa-request 事件
function handleAskAI(){
  const q = (searchQuery.value || '').trim();
  if(!q){ ElMessage.warning('请输入问题'); return; }
  emit('qa-request', q);
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
  /* 外框视觉去掉，改由内部 input 胶囊承载 */
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
}

.search-input-wrapper {
  width: 100%;
}

.search-row{ display:flex; align-items:center; }

:deep(.search-pill .el-input__wrapper){
  border-radius: 9999px;
  padding-left: 12px;
  padding-right: 10px;
  height: 50px;
}

.prefix-icon{ color: var(--text-color-secondary); }
.suffix-actions{ display:flex; align-items:center; gap:8px; }
.img-suffix-btn{ color: var(--text-color-secondary); }
.img-suffix-btn:hover{ color: var(--primary-color); }
.ai-suffix-btn{ color: var(--text-color-secondary); }
.ai-suffix-btn:hover{ color: var(--primary-color); }

:deep(.search-textarea .el-textarea__inner) {
  box-shadow: none;
  padding: 0;
  font-size: var(--font-size-md-plus);
  line-height: 1.6;
  color: var(--text-color-primary);
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
  color: var(--text-color-placeholder);
  font-size: var(--font-size-md);
}

/* === 胶囊输入框承载原外框效果 === */
:deep(.search-pill .el-input__wrapper){
  border: 2px solid var(--border-color);
  background: var(--background-color);
  box-shadow: 0 2px 8px rgba(var(--color-black-rgb), 0.06);
  transition: all .25s ease;
}
:deep(.search-pill .el-input__wrapper:hover){
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.18);
}
:deep(.search-pill .el-input__wrapper.is-focus),
:deep(.search-pill .el-input__wrapper.is-focus:hover){
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(var(--primary-color-rgb), 0.12), 0 4px 14px rgba(var(--primary-color-rgb),0.18);
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
}

.left-controls{
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-actions{ display:flex; align-items:center; gap:8px; }
.img-btn{ color: var(--text-color-secondary); border-color: var(--border-color); }
.img-btn:hover{ color: var(--primary-color); border-color: var(--primary-color); }
.ai-ask-btn{ display:flex; align-items:center; gap:6px; border-radius: 18px; padding:6px 10px; color:#fff; border:none;
  background: linear-gradient(120deg,#6d5dfc 0%, #5f8bff 38%, #ff5fb7 100%);
}
.ai-ask-btn:disabled{ filter: grayscale(0.4); opacity: 0.7; }
.ai-icon{ color: #fff; }

.search-btn{
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  border-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(var(--primary-color-rgb), 0.2);
}
.search-btn:hover{ background: linear-gradient(135deg, var(--primary-color-dark) 0%, var(--primary-color-darker) 100%); border-color: var(--primary-color-dark); box-shadow: 0 4px 8px rgba(var(--primary-color-rgb), 0.3); }
.search-btn.el-button.is-circle{ width:34px; height:34px; padding:0; display:inline-flex; align-items:center; justify-content:center; }
.search-btn:disabled{ background: var(--border-color); border-color: var(--border-color); box-shadow:none; }

.extra-actions {
  display: flex;
  align-items: center;
}

.image-upload-btn {
  border-radius: var(--border-radius-md);
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--background-info-light);
  transition: all 0.2s;
}

.image-upload-btn:hover {
  background: var(--primary-color);
  color: var(--text-color-inverse);
  border-color: var(--primary-color-dark);
}

.image-upload-btn .btn-icon {
  margin-right: 4px;
}

/* removed mode select styles after refactor */

.image-preview-chip {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--background-color-light);
  border: var(--border-width-thin) solid var(--border-color-light);
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
  border: var(--border-width-thin) solid var(--border-color);
}

.image-preview-chip .chip-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.image-preview-chip .name {
  font-size: var(--font-size-xs);
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

/* removed legacy duplicates */
</style>

