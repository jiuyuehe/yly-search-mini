<template>
  <div class="doc-preview-pane">
    <div class="doc-body">
      <div v-if="loading" class="state"><el-skeleton :rows="8" animated /></div>
      <div v-else-if="error" class="state">
        <el-alert type="error" :title="error" show-icon />
        <el-button size="small" @click="$emit('retry')">重试</el-button>
      </div>
      <template v-else>
        <!-- 优先：若有 previewUrl 并且是 http(s) 地址，优先使用 iframe 加载 -->
        <div v-if="previewUrlHttp" class="media-wrapper">
          <div v-show="iframeLoading" class="iframe-loading-tip">正在加载预览...</div>
          <iframe
            :key="previewUrl + '_' + iframeReloadKey"
            :src="previewUrl"
            class="doc-frame"
            @load="handleIframeLoad"
            ref="iframeRef"
          />
          <div v-if="iframeError" class="iframe-error">
            <el-alert title="文档预览加载失败" type="error" :closable="false" />
            <el-button size="small" @click="retryIframe">重新尝试</el-button>
            <el-button size="small" type="primary" @click="openInNew" plain>新窗口打开</el-button>
          </div>
          <div class="iframe-debug" v-if="showDebug">
            <div>ext: {{ ext }}</div>
            <div>url ok: {{ !!previewUrl }}</div>
            <div>loaded: {{ iframeLoaded }}</div>
            <div>err: {{ iframeError }}</div>
          </div>
        </div>
        <!-- 文本类 -->
        <div v-else-if="isText" class="text-wrapper">
          <pre>{{ textContent || '暂无文本内容' }}</pre>
        </div>
        <!-- 图片 -->
        <div v-else-if="isImage" class="media-wrapper image-wrapper">
          <el-image v-if="previewUrl" :src="previewUrl" :preview-src-list="[previewUrl]" fit="contain" class="ep-image">
            <template #error><el-empty description="图片加载失败" /></template>
            <template #placeholder><div style="padding:20px;color:#909399;">加载中...</div></template>
          </el-image>
          <el-empty v-else description="图片预览不可用" />
        </div>
        <!-- PDF / Office 文档 -->
        <div v-else-if="isOffice" class="media-wrapper">
          <template v-if="previewUrl">
            <div v-show="iframeLoading" class="iframe-loading-tip">正在加载预览...</div>
            <iframe
              :key="previewUrl + '_' + iframeReloadKey"
              :src="previewUrl"
              class="doc-frame"
              @load="handleIframeLoad"
              ref="iframeRef"
            />
            <div v-if="iframeError" class="iframe-error">
              <el-alert title="文档预览加载失败" type="error" :closable="false" />
              <el-button size="small" @click="retryIframe">重新尝试</el-button>
              <el-button size="small" type="primary" @click="openInNew" plain>新窗口打开</el-button>
            </div>
            <div class="iframe-debug" v-if="showDebug">
              <div>ext: {{ ext }}</div>
              <div>url ok: {{ !!previewUrl }}</div>
              <div>loaded: {{ iframeLoaded }}</div>
              <div>err: {{ iframeError }}</div>
            </div>
          </template>
          <el-empty v-else description="文档预览不可用" />
        </div>
        <!-- 其它不支持 -->
        <div v-else class="state"><el-empty description="此类型暂不支持预览" /></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted } from 'vue';
import { FILE_TYPE, getFileExtenName } from '../../constants/fileTypes';

const props = defineProps({
  file: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
});

defineEmits(['retry']);

const ext = computed(() => {
  if (!props.file) return '';
  return (props.file.fileType || props.file.ext || getFileExtenName(props.file.fileName || props.file.name || '') || '').toLowerCase();
});

const previewUrl = computed(() => props.file?.previewUrl || props.file?.viewUrl || '');
const previewUrlHttp = computed(() => {
  const u = previewUrl.value || '';
  return typeof u === 'string' && /^https?:\/\//i.test(u);
});
// 文本内容优先级：fileContents (外层直接返回的原始内容) > extractedText > text
const textContent = computed(() => props.file?.fileContents || props.file?.extractedText || props.file?.text || '');

function inList(list){return list.includes(ext.value);} 
const isImage = computed(() => inList(FILE_TYPE.pic));
const isOffice = computed(() => inList(FILE_TYPE.doc));
// 扩展文本识别: shell 类 + 其它常见纯文本扩展
const EXTRA_TEXT_EXTS = ['csv','xml','log'];

// 简单判断字符串是否像 URL（排除后端把 preview 链接放到 text 字段的情况）
function isLikelyUrl(val) {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim();
  if (/^https?:\/\//i.test(s) || /^\/\//.test(s)) return true;
  if (s.includes('://')) return true;
  if (s.startsWith('/') && s.length > 20) return true;
  return false;
}

// hasTextContent 三态：
// - undefined: 没有候选文本字段（fileContents/extractedText/text 都为空）
// - true: 有候选文本且不是 URL（可视为真实文本）
// - false: 有候选文本但看起来像 URL（不视为真实文本）
const hasTextContent = computed(() => {
  const candidate = props.file?.fileContents || props.file?.extractedText || props.file?.text;
  if (candidate === undefined || candidate === null || candidate === '') return undefined;
  return !isLikelyUrl(candidate);
});

// 文本判断：优先真实文本内容；若存在候选但为 URL（false）则不是文本；
// 若无候选（undefined），再根据 previewUrl / 扩展名回退判断。
const isText = computed(() => {
  if (!props.file) return false;
  const hasText = hasTextContent.value;
  if (hasText === true) return true;
  if (hasText === false) return false;
  // hasText === undefined: 没有候选文本字段
  if (previewUrl.value) return false;
  return inList(FILE_TYPE.shell) || EXTRA_TEXT_EXTS.includes(ext.value);
});

// 调试：跟踪文件类型判定
watch([ext, isOffice, isImage, isText], ([e,o,i,t]) => {
  // debug log removed
});

// iframe 状态管理
const iframeLoaded = ref(false);
const iframeLoading = ref(false);
const iframeError = ref(false);
const iframeReloadKey = ref(0);
const iframeRef = ref(null);
const showDebug = false; // 如需持续展示调试面板可改为 true

watch(previewUrl, (val) => {
  if (val) {
    // 新 URL 重置状态
    iframeLoaded.value = false;
    iframeLoading.value = true;
    iframeError.value = false;
    // 超时检测 12s
    const currentKey = iframeReloadKey.value;
    setTimeout(() => {
      if (!iframeLoaded.value && currentKey === iframeReloadKey.value) {
        iframeError.value = true;
        iframeLoading.value = false;
        console.warn('[DocPreviewPane] iframe load timeout');
      }
    }, 12000);
  }
});

function handleIframeLoad() {
  iframeLoaded.value = true;
  iframeLoading.value = false;
  iframeError.value = false;
  // debug log removed
}

function retryIframe() {
  if (!previewUrl.value) return;
  iframeLoaded.value = false;
  iframeError.value = false;
  iframeLoading.value = true;
  iframeReloadKey.value++;
}

function openInNew() {
  if (previewUrl.value) window.open(previewUrl.value, '_blank');
}

onMounted(() => {
  if (previewUrl.value) iframeLoading.value = true;
});
</script>

<style scoped>
.doc-preview-pane { display:flex; flex-direction:column; height:100%; background:#fff; }
.doc-body { flex:1; overflow:auto; padding:0; background:#f5f7fa; }
.state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 0; gap:12px; }
.media-wrapper { display:flex; align-items:center; justify-content:center; min-height:400px; height:100%; }
.ep-image { max-width:100%; max-height:80vh; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.08); background:#fff; }
.doc-frame { width:100%; height:100%; border:0; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.08); border-radius:8px; }
.text-wrapper pre { margin:0; font-family:Consolas,Menlo,monospace; font-size:13px; line-height:1.55; white-space:pre-wrap; word-break:break-word; background:#fff; padding:18px 20px; border:1px solid #ebeef5; border-radius:8px; box-shadow:0 1px 2px rgba(0,0,0,.04); }
.iframe-loading-tip { position:absolute; top:12px; left:12px; background:rgba(0,0,0,.55); color:#fff; padding:6px 12px; font-size:12px; border-radius:4px; z-index:10; }
.iframe-error { position:absolute; top:16px; left:16px; display:flex; gap:8px; align-items:center; z-index:12; }
.iframe-debug { position:absolute; bottom:8px; right:8px; font-size:11px; background:rgba(0,0,0,.6); color:#fff; padding:6px 8px; border-radius:4px; line-height:1.3; z-index:15; }
</style>
