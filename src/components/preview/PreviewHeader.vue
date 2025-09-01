<template>
  <div class="ph-root" v-if="file">
    <el-button class="back-btn" v-if="showReturn" @click="$emit('back')">
      <el-icon><ArrowLeft /></el-icon><span class="txt">返回搜索</span>
    </el-button>
    <slot name="meta">
      <div class="file-meta-block">
        <div class="name" :title="file.fileName || file.name">{{ file.fileName || file.name }}</div>
        <div class="meta-line">
          <span v-if="file.fileSize">{{ formatSize(file.fileSize) }}</span>
          <span v-if="file.updateTime">{{ formatDate(file.updateTime) }}</span>
          <span v-if="file.createrName">{{ file.createrName }}</span>
        </div>
      </div>
    </slot>
    <span class="flex-spacer" />
    <el-button-group class="mode-group">
      <el-button :disabled="!canPreview" :type="showPreview ? 'primary' : 'default'" @click="$emit('toggle-preview')">AI阅读</el-button>
      <el-button :disabled="!canPreview" :type="showText ? 'primary' : 'default'" @click="$emit('toggle-text')">文本模式</el-button>
      <el-button :disabled="!canPreview" :type="isTranslate ? 'primary' : 'default'" @click="$emit('translate')">翻译模式</el-button>
    </el-button-group>
    <div class="actions">
      <el-button size="small" :disabled="!canPreview" @click="$emit('reload')" :loading="loading">刷新</el-button>
      <el-button size="small" type="primary" :disabled="!canDownload || downloading" @click="handleDownload">
        <span v-if="downloading">下载中...</span>
        <span v-else>下载</span>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { computed, ref } from 'vue';
const props = defineProps({
  file: { type: Object, default: null },
  showPreview: { type: Boolean, default: true },
  showText: { type: Boolean, default: false },
  isTranslate: { type: Boolean, default: false },
  hasPerm: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  showReturn: { type: Boolean, default: true }
});
const emit = defineEmits(['back','toggle-preview','toggle-text','translate','reload','download','download-finish','download-error']);

const canPreview = computed(() => !!props.hasPerm && (!!props.file?.previewUrl || !!props.file?.extractedText));
// 允许下载条件：有权限 且 (后端已给 downloadUrl 或 提供 (fileId+fileCategory) 以便即时获取)
const canDownload = computed(() => !!props.hasPerm && (!!props.file?.downloadUrl || (!!props.file?.fileId && !!(props.file?.fileCategory || props.file?.fc))));
const downloading = ref(false);

function handleDownload(){
  if (!canDownload.value || downloading.value) return;
  downloading.value = true;
  const done = () => { downloading.value = false; emit('download-finish'); };
  const fail = (e) => { downloading.value = false; emit('download-error', e); };
  // 父组件监听 download 事件执行实际下载，并可通过自定义事件通知完成/失败
  emit('download', { done, fail });
  // 兜底超时自动复位
  setTimeout(() => { if (downloading.value) downloading.value = false; }, 15000);
}

function formatSize(size) {
  if (!size && size !== 0) return '';
  const units=['B','KB','MB','GB','TB'];
  let s= Number(size); let i=0; while(s>=1024 && i<units.length-1){s/=1024;i++;}
  return s.toFixed(s>=10||i===0?0:1)+units[i];
}
function formatDate(ts){ if(!ts) return ''; try { return new Date(ts).toLocaleString(); } catch { return ts; } }
</script>

<style scoped>
.ph-root { display:flex; align-items:flex-start; gap:24px; padding:10px 16px 8px; border-bottom:1px solid #ebeef5; background:#fff; }
.file-meta-block { display:flex; flex-direction:column; max-width:420px; }
.file-meta-block .name { font-size:15px; font-weight:600; line-height:20px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.file-meta-block .meta-line { display:flex; gap:14px; font-size:12px; color:#73767a; margin-top:4px; }
.flex-spacer { flex:1; }
.mode-group { margin-left:auto; }
.actions { display:flex; gap:8px; margin-left:16px; }
.actions :deep(button[disabled]) { opacity:.55; cursor:not-allowed; }
.back-btn { display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 14px; font-size:13px; font-weight:500; border:1px solid #d0d5dd; background:#fff; color:#303133; border-radius:6px; line-height:1; box-shadow:0 1px 2px rgba(0,0,0,.05); }
.back-btn:hover { color:#1671f2; border-color:#1671f2; background:#f5f9ff; }
.back-btn .txt { letter-spacing:.5px; }
</style>
