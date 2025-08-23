<template>
  <div class="preview-shell">
    <div class="preview-main">
      <div class="doc-area" :class="{ 'with-ai': showAISide }">
        <div class="doc-scroll">
          <div v-if="loading" class="state-holder"><el-skeleton :rows="8" animated /></div>
          <div v-else-if="error" class="state-holder">
            <el-alert type="error" :title="error" show-icon />
            <el-button size="small" @click="retryPreview">重试</el-button>
          </div>
          <!-- 根据文件类型分类展示 -->
          <template v-else>
            <!-- 文本类（shell 分类） -->
            <div v-if="isShellText" class="text-wrapper">
              <div class="text-block">
                <pre>{{ textContent || '暂无文本内容' }}</pre>
              </div>
            </div>
            <!-- 图片：使用 Element Plus Image 支持放大预览 -->
            <div v-else-if="isImage" class="media-wrapper image-wrapper">
              <el-image
                v-if="previewUrl"
                :src="previewUrl"
                :preview-src-list="[previewUrl]"
                fit="contain"
                :initial-index="0"
                class="ep-image"
              >
                <template #error>
                  <el-empty description="图片加载失败" />
                </template>
                <template #placeholder>
                  <div style="padding:20px; color:#909399;">加载中...</div>
                </template>
              </el-image>
              <el-empty v-else description="图片预览不可用" />
            </div>
            <!-- PDF / Office 文档：iframe 方式 -->
            <div v-else-if="isOfficeDoc" class="media-wrapper">
              <iframe v-if="previewUrl" :src="previewUrl" class="doc-frame" />
              <el-empty v-else description="文档预览不可用" />
            </div>
            <!-- 其它暂不支持 -->
            <div v-else class="state-holder">
              <el-empty description="此类型暂不支持预览" />
            </div>
          </template>
        </div>
      </div>
      <slot name="ai" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { FILE_TYPE, getFileExtenName } from '../../constants/fileTypes';
import { APPS_BASE } from '../../constants/server';

const props = defineProps({
  fileId: { type: [String, Number], required: true },
  fileData: { type: Object, default: null },
  fileType: { type: String, default: '' },
  showAISide: { type: Boolean, default: true },
  hideHeader: { type: Boolean, default: false }
});

const loading = ref(false);
const error = ref(null);
const previewUrl = ref('');
const textContent = ref('');
const localFileData = ref(props.fileData);

const ext = computed(() => {
  if (props.fileType) return String(props.fileType).toLowerCase();
  if (localFileData.value?.fileType) return String(localFileData.value.fileType).toLowerCase();
  if (localFileData.value?.ext) return String(localFileData.value.ext).toLowerCase();
  const name = localFileData.value?.fileName || localFileData.value?.name || '';
  return getFileExtenName(name);
});

function inExt(list) { return list.includes(ext.value); }
const isImage = computed(() => inExt(FILE_TYPE.pic));
const isOfficeDoc = computed(() => inExt(FILE_TYPE.doc)); //  office 文档
const isShellText = computed(() => inExt(FILE_TYPE.shell));

function buildFromFileData() {
  if (!localFileData.value) return;
  if (isShellText.value) {
    textContent.value = localFileData.value.extractedText || localFileData.value.text || '';
  }
  const fd = localFileData.value;
  let url = fd.viewUrl || fd.previewUrl || ''; // 去掉 fd.file 以防止触发下载
  if (isOfficeDoc.value) {
    const fi = fd.fileId || fd.id || props.fileId;
    const fc = fd.fileCategory || fd.fc || fd.category || '';
    const fn = encodeURIComponent(fd.fileName || fd.name || 'file');
    if (!url) {
      if (fd.view) {
        url = /^https?:/i.test(fd.view) ? fd.view : `${APPS_BASE.replace(/\/$/, '')}${fd.view.startsWith('/') ? '' : '/'}${fd.view}`;
      } else {
        url = `${APPS_BASE.replace(/\/$/, '')}/views.html?fi=${fi}&fc=${fc}&fn=${fn}`;
      }
    }
  }
  previewUrl.value = url;
}

watch(() => props.fileData, (v) => {
  localFileData.value = v;
  if (v) buildFromFileData();
}, { immediate: true });

async function loadPreview() {
  if (!props.fileId) return;
  loading.value = true; error.value = null;
  try {
    if (!localFileData.value) { /* 预留远程加载 */ }
    buildFromFileData();
  } catch (e) { error.value = e.message || '加载失败'; } finally { loading.value = false; }
}

function retryPreview() { loadPreview(); }

onMounted(loadPreview);
watch(() => props.fileId, () => loadPreview());
</script>

<style scoped>
.preview-shell { display:flex; flex-direction:column; height:100%; background:#fff; }
.preview-header-bar { display:flex; align-items:center; padding:10px 18px; border-bottom:1px solid #e6e8eb; background:#fff; gap:24px; }
.filename { font-size:16px; font-weight:600; margin:0 0 4px; max-width:380px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.left-meta { flex:1; min-width:0; }
.meta-line { display:flex; gap:16px; font-size:12px; color:#808089; }
.center-switch { display:flex; }
.right-actions { display:flex; gap:8px; }

.preview-main { flex:1; display:flex; overflow:hidden; }
.doc-area { flex:1; position:relative; display:flex; flex-direction:column; }
.doc-area.with-ai { margin-right:0; }
.doc-scroll { flex:1; overflow:auto; padding:18px 28px 28px; background:#f5f7fa; }

.state-holder { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 0; color:#909399; gap:12px; }
.media-wrapper { display:flex; align-items:center; justify-content:center; min-height:400px; height:100%; }
.ep-image { max-width:100%; max-height:80vh; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.08); background:#fff; }
.doc-frame { width:100%; height:92vh; border:0; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.08); border-radius:8px; }

.text-wrapper { display:flex; flex-direction:column; gap:16px; }
.text-block pre { margin:0; font-family:Consolas,Menlo,monospace; font-size:13px; line-height:1.55; white-space:pre-wrap; word-break:break-word; background:#fff; padding:18px 20px; border:1px solid #ebeef5; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,.04); }

/* 滚动条美化 */
.doc-scroll::-webkit-scrollbar { width:8px; }
.doc-scroll::-webkit-scrollbar-track { background:transparent; }
.doc-scroll::-webkit-scrollbar-thumb { background:rgba(0,0,0,.15); border-radius:4px; }
.doc-scroll::-webkit-scrollbar-thumb:hover { background:rgba(0,0,0,.28); }
</style>
