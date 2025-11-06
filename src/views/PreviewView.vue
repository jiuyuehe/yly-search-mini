<template>
  <div class="new-preview-layout">
    <PreviewHeader
      v-if="fileData"
      :file="fileData"
      :show-preview="showPreview"
      :show-text="showText"
      :is-translate="contentMode === 'translate'"
      :has-perm="hasPerm"
      :loading="loading"
      :show-return="showReturnBtn"
      @back="goBack"
      @toggle-preview="togglePreview"
      @toggle-text="toggleText"
      @translate="switchToTranslate"
      @reload="reload"
  @download="downloadFile"
  @download-finish="onDownloadFinish"
  @download-error="onDownloadError"
    />
    <div class="body-area">
      <!-- Translation workspace full screen -->
    <div v-show="contentMode === 'translate'" class="translate-full">
        <translation-workspace
            class="tw-root"
            :file-id="fileId"
            :file="fileData"
            :es-id="fileData?.esId || fileData?.esid || ''"
            :active="contentMode === 'translate'"
            :initial-source-text="fileData?.fileContents || fileData?.extractedText || ''"
            :initial-translation="fileData?.fileTranslate || ''"
            @update-file-contents="handleUpdateFileContents"
          />
      </div>
      <!-- Unified splitter with collapsible panels to preserve component instances -->
      <div v-show="contentMode !== 'translate'" class="split-wrapper">
        <el-splitter style="height:100%; width:100%;">
          <el-splitter-panel :size="previewSize" :class="{ collapsed: !showPreview }">
            <div class="doc-wrapper" v-show="showPreview">
              <div v-if="notFound && !loading" class="not-found">文件不存在或已删除</div>
              <template v-else-if="hasPerm">
                <DocPreviewPane :file="fileData" :loading="loading" class="file-preview-shell" />
              </template>
              <FileAccessApply
                v-else
                :file-id="(fileData && (fileData.fileId || fileData.id)) || props.fi || route.params.fi || fileId"
                :file-category="(fileData && (fileData.fileCategory || fileData.fc)) || props.fc || route.params.fc"
                :file="fileData"
                :is-folder="false"
                @applied="reload"
              />
            </div>
          </el-splitter-panel>
          <el-splitter-panel :size="textPanelSize" :class="{ collapsed: !showText }">
            <div class="text-wrapper" v-show="showText">
              <TextPanel title="文档文本" :content="textPanelContent" :editable="false" :file="fileData" :file-id="fileId" placeholder="文档文本内容将显示在这里..." :enable-markdown="true" @text-selected="onTextSelected" />
            </div>
          </el-splitter-panel>
          <el-splitter-panel>
            <div class="ai-wrapper">
              <AIToolsPanel :file-id="fileId" :file="fileData" :has-perm="hasPerm" @switch-translate="switchToTranslate" />
            </div>
          </el-splitter-panel>
        </el-splitter>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAiToolsStore } from '../stores/aiTools';
import DocPreviewPane from '../components/preview/DocPreviewPane.vue';
import TranslationWorkspace from '../components/preview/TranslationWorkspace.vue';
import AIToolsPanel from '../components/ai/AIToolsPanel.vue';
import TextPanel from '../components/common/TextPanel.vue';
import PreviewHeader from '../components/preview/PreviewHeader.vue';
import { getCT } from '../services/api';
import { previewService } from '../services/preview';
import FileAccessApply from '../components/preview/FileAccessApply.vue';
import { FILE_TYPE, getFileExtenName } from '../constants/fileTypes';
import { downloadFileByMeta } from '../services/download';
import { APPS_BASE } from '../constants/server';
// 不需要显式局部注册 splitter，ElementPlus 全局已注册；如需按需可保留 import { ElSplitter } from 'element-plus'

// 接收路由 props
const props = defineProps({
  fc: { type: String, default: '' },
  fi: { type: [String, Number], default: '' }, // 非 nas 场景 fileId
  fsi: { type: [String, Number], default: '' }, // 非 nas fsFileId
  nsi: { type: [String, Number], default: '' }, // nas 场景 nasId
  subp: { type: String, default: '' }, // nas 场景 子路径
  retureBtn: { type: Boolean, default: true }
});

const route = useRoute();
const router = useRouter();
useAiToolsStore();

// 非 nas 场景：使用 fi；nas 场景：等待基础信息返回的 fileId
const fileId = computed(() => {
  if ((props.fc || route.params.fc) === 'nas') return fileData.value?.fileId || '';
  return props.fi || route.params.fi || '';
});
const fileData = ref(null);
const loading = ref(false);
const contentMode = ref('default'); // default / translate
// visibility states
const showPreview = ref(true);
const showText = ref(false);
// size state (numeric percentages, converted to % strings in template)
const PREVIEW_MAX = 50; // 预览最大 50%（相对于容器宽度）
const TOOLS_MIN = 15;   // 工具栏最小 15%
const previewSizeNum = ref(40); // 初始默认两侧与工具共享空间（会在 adjustSizes 中被调节）
const textSizeNum = ref(40); // 默认两侧相等
let prevPreviewSize = 40;
let prevTextSize = 40; // 记住上次展开宽度
// minimum pixel width for ai wrapper (controls when to collapse)
const AI_WRAPPER_MIN_PX = 460; // 保证 ai-wrapper 至少 460px
let destroyed = false; // 组件销毁标记
const previewSize = computed(() => previewSizeNum.value + '%');
const textPanelSize = computed(() => textSizeNum.value + '%');
const hasPerm = ref(true); // 初始默认可预览，若返回无权限再切换为 false
const applyStatus = ref('none');
const notFound = ref(false); // 文件不存在标记
// 移除复杂的重新渲染 key，直接依赖响应式属性


// 文本面板内容: 优先 fileContents -> extractedText
const textPanelContent = computed(() => fileData.value?.fileContents || fileData.value?.extractedText || '');

// 返回按钮
const showReturnBtn = computed(() => props.retureBtn !== false);

function switchToTranslate() { contentMode.value = 'translate'; }
function togglePreview() {
  if (contentMode.value === 'translate') { contentMode.value='default'; showPreview.value = true; adjustSizes(); return; }
  if (showPreview.value) { prevPreviewSize = previewSizeNum.value; showPreview.value = false; previewSizeNum.value = 0; }
  else { showPreview.value = true; previewSizeNum.value = prevPreviewSize || 60; }
  adjustSizes();
}
function toggleText() {
  if (contentMode.value === 'translate') { contentMode.value='default'; showText.value = true; adjustSizes(); return; }
  if (showText.value) { prevTextSize = textSizeNum.value; showText.value = false; textSizeNum.value = 0; }
  else { showText.value = true; textSizeNum.value = prevTextSize || 25; }
  adjustSizes();
}
function adjustSizes() {
  const hasPreview = showPreview.value;
  const hasText = showText.value;
  // measure container width (fallback to window.innerWidth)
  let containerWidth = document?.querySelector('.body-area')?.clientWidth || window.innerWidth || 1200;
  // compute percentage space reserved for ai-wrapper in px
  const toolsMinPx = Math.round((TOOLS_MIN / 100) * containerWidth);
  const aiMinPx = AI_WRAPPER_MIN_PX;

  // If neither preview nor text visible, tools take 100%
  if (!hasPreview && !hasText) {
    previewSizeNum.value = 0;
    textSizeNum.value = 0;
    return;
  }

  // When both preview and text visible, make them equal by default
  if (hasPreview && hasText) {
    // available width for two panels = containerWidth - aiMinPx (reserve)
    const availablePx = Math.max(0, containerWidth - aiMinPx);
    // If availablePx is small, fall back to distributing minimal percentages
    if (availablePx <= 0) {
      previewSizeNum.value = 10;
      textSizeNum.value = 10;
    } else {
      const eachPx = Math.floor(availablePx / 2);
      const eachPct = Math.max(0, Math.min(PREVIEW_MAX, Math.round((eachPx / containerWidth) * 100)));
      const finalPct = Math.max(12, eachPct);
      previewSizeNum.value = finalPct;
      textSizeNum.value = finalPct;
    }
  } else if (hasPreview && !hasText) {
    // preview + ai-wrapper (text hidden)
    const availablePx = Math.max(0, containerWidth - aiMinPx);
    const pct = availablePx <= 0 ? 20 : Math.max(20, Math.min(PREVIEW_MAX, Math.round((availablePx / containerWidth) * 100)));
    previewSizeNum.value = pct;
    textSizeNum.value = 0;
  } else if (!hasPreview && hasText) {
    const availablePx = Math.max(0, containerWidth - aiMinPx);
    const pct = availablePx <= 0 ? 20 : Math.max(20, Math.min(PREVIEW_MAX, Math.round((availablePx / containerWidth) * 100)));
    textSizeNum.value = pct;
    previewSizeNum.value = 0;
  }

  // final safety: ensure left + right + tool >= 100 - allow small rounding error
  const sum = previewSizeNum.value + textSizeNum.value + (100 - (previewSizeNum.value + textSizeNum.value));
  if (previewSizeNum.value + textSizeNum.value > Math.max(0, 100 - TOOLS_MIN)) {
    // scale them down proportionally
    const maxAllowed = Math.max(0, 100 - TOOLS_MIN);
    const total = previewSizeNum.value + textSizeNum.value || 1;
    const scaledPreview = Math.floor((previewSizeNum.value / total) * maxAllowed);
    const scaledText = Math.floor((textSizeNum.value / total) * maxAllowed);
    previewSizeNum.value = Math.max(0, scaledPreview);
    textSizeNum.value = Math.max(0, scaledText);
  }
}
watch(() => contentMode.value, v => { if (v !== 'translate') { /* revert to default mode */ } });
function reload() { load(true); }
function downloadFile(ctx) {
  // ctx: { done, fail }
  if (!hasPerm.value || !fileData.value) { ctx?.fail && ctx.fail(new Error('无权限或无文件')); return; }
  const f = fileData.value;
  // 若已有直接 downloadUrl 则直接拼接 ct 触发
  (async () => {
    try {
      await downloadFileByMeta(f);
      ctx?.done && ctx.done();
    } catch (e) {
      console.warn('[PreviewView] download failed', e);
      ctx?.fail && ctx.fail(e);
    }
  })();
}
// handle updates from translation workspace or module
function handleUpdateFileContents(payload){
  try {
    if (!payload || !payload.fileId) return;
    // if fileData corresponds to the fileId, update its contents
    if (String(fileData.value?.fileId || fileData.value?.id || '') === String(payload.fileId) || String(props.fi || route.params.fi || '') === String(payload.fileId)) {
      const updated = payload.content || '';
      fileData.value = { ...(fileData.value || {}), extractedText: updated, fileContents: updated };
    }
  } catch (e) { console.warn('handleUpdateFileContents failed', e); }
}
function onDownloadFinish(){ /* 可加入提示 */ }
function onDownloadError(_e){ /* 可加消息提示 */ }
function goBack() { if (window.history.length > 1) router.back(); else router.push({ name: 'search' }).catch(() => { }); }

// Text selection handler for TextPanel
function onTextSelected(text) {
  // debug removed
  // Handle text selection if needed
}

// 防止 splitSize 越界导致面板不可见
// 移除旧的基于字符串的限制逻辑, 统一由 adjustSizes 控制
watch([showPreview, showText], () => adjustSizes());

// 监听 previewUrl 出现后仅做尺寸微调
watch(() => fileData.value?.previewUrl, (val, oldVal) => {
  if (val && val !== oldVal) nextTick(() => adjustSizes());
});

const TEXT_TYPES = ['txt', 'md', 'json', 'xml', 'csv', 'log'];
function isTextExt(ext) { return !!ext && TEXT_TYPES.includes(String(ext).toLowerCase()); }
function decodeBufferToText(buf) {
  try {
    if (!buf) return '';
    const arr = new Uint8Array(buf);
    // 简单 BOM 检测
    if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) {
      return new TextDecoder('utf-8').decode(arr.subarray(3));
    }
    // utf-8 直接解码
    return new TextDecoder('utf-8').decode(arr);
  } catch { return ''; }
}

async function load() {
  loading.value = true;
  notFound.value = false;
  // 若外部直接传入 file 且不强制刷新，直接使用
  {
    // 1. 获取基础信息（不再使用外部传入 file）
    try {
        // Support opening by esid (unique document id)
        if (props.esid || route.params.esid) {
          const esid = props.esid || route.params.esid;
          const base = await previewService.getBasicInfoByEsId(esid);
          if (!base) throw new Error('获取基础信息失败');
          const mergedBase = {
            id: base.fileId || base.id || '',
            fileId: base.fileId || base.id || '',
            name: base.fileName || base.name,
            fileName: base.fileName || base.name,
            fileType: (base.fileExt || base.fileType || '').toLowerCase(),
            hasAccess: true,
            ...base
          };
          if (!mergedBase.esId && mergedBase.esid) mergedBase.esId = mergedBase.esid;
          fileData.value = mergedBase;
          hasPerm.value = true;
        } else {
          const fc = props.fc || route.params.fc;
          if (fc) {
            const params = { fc };
            if (fc === 'nas') {
              params.nsi = props.nsi || route.params.nsi;
              params.nsubp = props.subp || route.params.subp;
              if (!params.nsi) throw new Error('缺少 nsi');
            } else {
              params.fi = props.fi || route.params.fi;
              if (!params.fi) throw new Error('缺少 fi');
              if (props.fsi || route.params.fsi) params.fsi = props.fsi || route.params.fsi;
            }
            const base = await previewService.getBasicInfo(params);
            let mergedBase = {
              id: base.fileId || params.fi || '',
              fileId: base.fileId || params.fi || '',
              name: base.fileName,
              fileName: base.fileName,
              fileType: (base.fileExt || base.fileType || '').toLowerCase(),
              hasAccess: true,
              ...base
            };
            // 若 esId 缺失，按规则生成
    if (!mergedBase.esId && !mergedBase.esid) {
            try {
              if ((mergedBase.fileCategory || params.fc) === 'nas' || mergedBase.nasId) {
                if (mergedBase.nasId && mergedBase.nasFileId) {
      const gen = `${mergedBase.nasId}-${mergedBase.nasFileId}`;
      mergedBase.esId = gen;
      mergedBase.esid = gen;
                }
              } else {
                if (mergedBase.fileId && mergedBase.fileCategory && mergedBase.fsFileId) {
      const gen = `${mergedBase.fileId}${String(mergedBase.fileCategory).toLowerCase()}${mergedBase.fsFileId}`;
      mergedBase.esId = gen;
      mergedBase.esid = gen;
                }
              }
            } catch { /* silent */ }
          }
    // 若仅有其中之一，补齐别名
    if (mergedBase.esId && !mergedBase.esid) mergedBase.esid = mergedBase.esId;
    if (mergedBase.esid && !mergedBase.esId) mergedBase.esId = mergedBase.esid;
            fileData.value = mergedBase;
            hasPerm.value = true;
          }
  }
    } catch (e) {
      console.warn('[PreviewView] 基础信息获取失败', e);
      // 404 或业务失败视为文件不存在
      notFound.value = true;
      fileData.value = { id: props.fi || '', fileId: props.fi || '', name: '文件不存在', fileType: '', hasAccess: false };
      loading.value = false;
      return;
    }
  }

  // 若标记不存在，停止
  if (notFound.value) { loading.value = false; return; }

  // 2. 基础信息成功后，再获取预览地址（原逻辑）
  try {
  const fc = props.fc || route.params.fc || fileData.value?.fileCategory;
  const fid = fileData.value?.fileId;
  const extNow = (fileData.value?.fileType || '').toLowerCase();
  // 仅当有 fc / fid (nas 也会返回 fileId 但接口使用 nasFilePath) 才继续
  if (!fc) { loading.value = false; return; }
  let resp;
  if (fc === 'nas') {
    const nasFilePath = fileData.value?.subPath || fileData.value?.filePath;
    const nasId = fileData.value?.nasId;
    if (!nasId || !nasFilePath) { loading.value = false; return; }
    // 轮询获取在线预览地址
    try {
      const res = await previewService.waitNasPreviewLink({ nasId, nasFilePath, shouldStop: () => destroyed });
      // 现在 previewService 会在创建或查询阶段返回结构化结果，包含 status 字段
      if (res && res.status && res.status !== 'ok') {
        // 当服务层告知无权限时，统一以结构化字段判断权限，不再依赖对 err.message 的正则匹配
        if (res.status === 'err_no_permission') {
          hasPerm.value = false;
          applyStatus.value = 'none';
          fileData.value = { ...(fileData.value || {}), hasAccess: false };
          loading.value = false;
          return;
        }
        // 其他非 ok 状态当作失败处理，允许后续逻辑继续尝试或展示失败
        console.warn('[PreviewView] NAS 预览任务返回非 OK 状态', res);
      }
      const link = (res && res.link) ? res.link : (typeof res === 'string' ? res : null);
      const merged = { ...(fileData.value || {}), previewUrl: link, viewUrl: link, hasAccess: true };
      fileData.value = merged;
      hasPerm.value = true; applyStatus.value = 'approved';
      nextTick(() => adjustSizes());
    } catch (e) {
      // 只依据结构化的业务返回 code/status 判定权限；若是异常则视为普通失败，不做模糊文本匹配
      console.warn('[PreviewView] NAS 预览获取失败', e);
      // 保留不修改 hasPerm 的默认行为，除非响应体明确告知无权限（上面已处理）
    } finally {
      loading.value = false;
    }
    return; // NAS 分支结束
  } else {
  // 不强制 arraybuffer，后端对文本可能直接返回字符串
  resp = await previewService.getFileView({ fc, fi: fid });
  }

  // 优先处理后端直接返回原始文本/数字/布尔（无包装结构），不依赖扩展名
    if (['string','number','boolean'].includes(typeof resp)) {
      const raw = String(resp);
      fileData.value = { ...(fileData.value || {}), extractedText: raw, fileContents: raw, hasAccess: true };
      hasPerm.value = true; applyStatus.value = 'approved';
      return;
    }
    // 若返回 ArrayBuffer，尝试解码 -> JSON or 纯文本
  if (resp instanceof ArrayBuffer) {
      const decoded = decodeBufferToText(resp) || '';
      let parsed = null;
      try { parsed = JSON.parse(decoded); } catch { /* not json */ }
      if (parsed?.status === 'err_no_permission') {
        throw { response: { status: 403, data: parsed } };
      }
      if (parsed?.status === 'ok') {
        resp = parsed; // 继续下面 ok 分支逻辑
      } else {
        // 视为纯文本
        fileData.value = { ...(fileData.value || {}), extractedText: decoded, fileContents: decoded, hasAccess: true };
        hasPerm.value = true; applyStatus.value = 'approved';
        return;
      }
    }
    // 若是包装对象但仅携带 content 字段且无 view/viewUrl，且扩展推断为文本，判定为纯文本内容
    if (resp && typeof resp === 'object' && resp.status === 'ok' && resp.data && typeof resp.data.content === 'string' && !resp.data.view && !resp.data.viewUrl) {
      const extGuess = extNow || getFileExtenName(fileData.value?.fileName || fileData.value?.name || '');
      if (isTextExt(extGuess)) {
        const txt = resp.data.content;
        fileData.value = { ...(fileData.value || {}), extractedText: txt, fileContents: txt, hasAccess: true };
        hasPerm.value = true; applyStatus.value = 'approved';
        return;
      }
    }

    // 如果后端明确返回预览不支持，但用户有操作权限（仅无法在线预览）
    if (resp?.status === 'err_view_not_supported') {
      // 将权限保留为有权限，仅标记预览不可用
      hasPerm.value = true;
      applyStatus.value = 'none';
      // 标记 fileData 以便界面或下游逻辑可以判断为不可预览
      fileData.value = { ...(fileData.value || {}), hasAccess: true, previewSupported: false };
      loading.value = false;
      return;
    }

    if (resp?.status === 'err_no_permission') {
      throw { response: { status: 403, data: resp } };
    }
    if (resp?.status === 'ok') {
      const view = resp.data || {};
      const { buildAppsUrl } = await import('../constants/server.js');
      const ext = (view.fileType || view.ext || view.extname || fileData.value?.fileType || extNow || '').toLowerCase();
      const merged = { ...(fileData.value || {}), ...view, fileType: ext };
      if (view.view && /\.html?($|\?)/i.test(view.view)) {
        merged.viewUrl = buildAppsUrl(view.view);
  // debug removed
      }
      if (view.file) merged.downloadUrl = buildAppsUrl(view.file);
      if (view.thumb) merged.thumbUrl = buildAppsUrl(view.thumb);
      if (isTextExt(ext) && typeof view.content === 'string') {
        if (!merged.extractedText) merged.extractedText = view.content;
        if (!merged.fileContents) merged.fileContents = view.content;
      }
      merged.hasAccess = true;
      merged.previewUrl = buildPreviewUrl(merged);
  // debug removed
      nextTick(() => { adjustSizes(); });
      fileData.value = merged;
      hasPerm.value = true;
       applyStatus.value = 'approved';
      return;
    }
    throw new Error('unexpected response');
  } catch (err) {
    console.warn('[PreviewView] 预览地址获取失败', err);
    const httpStatus = err?.httpStatus || err?.response?.status || err?.status;
    const bizCode = err?.code || err?.response?.data?.status;
    console.warn('[PreviewView] notFound', bizCode);

    if(bizCode === 'err_file_not_exist' || bizCode === 404 || httpStatus === 404) {
       hasPerm.value = false;
       notFound.value = true;
    }else if (httpStatus === 403 || bizCode === 'err_no_permission' || bizCode === 403 || (err?.response?.data?.status === 'err_no_permission')) {
      hasPerm.value = false;
      applyStatus.value = 'none';
      fileData.value = { ...(fileData.value || {}), hasAccess: false };
    }else {
      hasPerm.value = true; // 其他错误不影响权限显示
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  destroyed = false;
  // ensure preview is shown after initial load completes
  (async () => {
    try {
      await load();
    } finally {
      // explicitly open preview panel by default and adjust sizes
      showPreview.value = true;
      // if preview size is zero (was collapsed), restore previous size
      if (!previewSizeNum.value || previewSizeNum.value === 0) previewSizeNum.value = prevPreviewSize || 40;
      nextTick(() => adjustSizes());
    }
  })();
  window.addEventListener('resize', adjustSizes);
});
onUnmounted(() => { destroyed = true; window.removeEventListener('resize', adjustSizes); });
watch(() => [route.params.fc, route.params.fi, route.params.nsi, route.params.subp].join(':'), () => load());

function buildPreviewUrl(fd) {
  // debug removed
  if (!fd) return '';
  const ext = (fd.fileType || fd.ext || getFileExtenName(fd.fileName || fd.name || '') || '').toLowerCase();
  // 若后端已有 viewUrl/previewUrl 优先使用
  if (fd.viewUrl) return fd.viewUrl;
  if (fd.previewUrl) return fd.previewUrl;
  // Office 文档统一使用 views.html + token
  if (FILE_TYPE.doc.includes(ext)) {
    const fi = fd.fileId || fd.id;
    const fc = fd.fileCategory || fd.fc || fd.category || props.fc || route.params.fc || '';
    const fn = encodeURIComponent(fd.fileName || fd.name || 'file');
    return `${APPS_BASE.replace(/\/$/, '')}/views.html?fi=${fi}&fc=${fc}&fn=${fn}&ct=${getCT()}`;
  }
  // 图片或 pdf 可以直接内嵌 file（若可用且不是触发下载的 headers）
  if (fd.file && (FILE_TYPE.pic.includes(ext) || ext === 'pdf')) {
    return /^https?:/i.test(fd.file) ? fd.file : `${APPS_BASE.replace(/\/$/, '')}${fd.file.startsWith('/') ? '' : '/'}${fd.file}`;
  }
  return '';
}
</script>

<style scoped>
.new-preview-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-color);
}

.top-bar {
  display: flex;
  align-items: flex-start;
  padding: 10px 16px 8px;
  gap: 32px;
  border-bottom: var(--border-width-thin) solid var(--border-color-muted);
}

.file-info,
.meta-line,
.title-line {
  display: none;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  font-size: var(--font-size-md);
  font-weight: 600;
  border: var(--border-width-thin) solid var(--border-color-strong);
  background: var(--background-color);
  color: var(--text-color-heading);
  border-radius: var(--border-radius-md);
  line-height: 1;
  box-shadow: 0 1px 2px rgba(var(--color-black-rgb), .05);
  transition: .18s;
}

.back-btn:hover {
  color: var(--info-color);
  border-color: var(--info-color);
  box-shadow: 0 2px 6px -2px rgba(var(--info-color-rgb), .35);
  background: var(--background-color-hover);
}

.back-btn:active {
  transform: translateY(1px);
}

.back-btn :deep(.el-icon) {
  font-size: var(--font-size-xl);
  margin-right: 2px;
}

.back-btn .txt {
  letter-spacing: .5px;
}

.mode-switch {
  display: flex;
}

.actions {
  display: flex;
  gap: 8px;
}

.body-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.split-wrapper {
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  display: flex;
}

.translate-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.translate-full .tw-root,
.translate-full :deep(.translation-workspace),
.translate-full :deep(.advanced-translation-module) {
  flex: 1 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

/* 让 splitter 两侧区域都撑满高度 */
:deep(.el-splitter) {
  --ep-splitter-border-color: var(--border-color-muted);
}

:deep(.el-splitter__panel) {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.doc-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.file-preview-shell {
  flex: 1;
  min-height: 0;
}

.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-placeholder);
  font-size: var(--font-size-md);
}

.ai-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 460px; /* match AI_WRAPPER_MIN_PX */
  /* allow panel to expand taking remaining space */
  flex: 1 1 auto;
  max-width: 100%;
}

.text-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 200px;
}

.no-access-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--background-color-light);
  border: var(--border-width-thin) dashed var(--border-color);
  border-radius: var(--border-radius-md);
  margin: 8px;
}

.flex-spacer {
  flex: 1;
}
</style>