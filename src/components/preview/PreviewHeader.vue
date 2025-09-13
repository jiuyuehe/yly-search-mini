<template>
  <div class="ph-root" v-if="file">
    <el-button class="back-btn" v-if="showReturn" @click="$emit('back')">
      <el-icon><ArrowLeft /></el-icon><span class="txt">返回搜索</span>
    </el-button>
    <slot name="meta">
      <div class="file-meta-block">
        <div class="name-line">
          <div class="name" :title="file.fileName || file.name">{{ file.fileName || file.name }}</div>
          <!-- 按钮展示逻辑：只要有权限 (hasPerm) 即可，不依赖 previewUrl / extractedText -->
          <div class="inline-actions" v-if="canOperate">
            <el-button size="small" type="primary" :disabled="!canDownload || downloading" @click="realDownload">
              <span v-if="downloading">下载中...</span>
              <span v-else>下载</span>
            </el-button>
            <FavReal v-if="showFav" :file="file" />
            <CloudSave v-if="showSaveToCloud" :file="file" type="copy"/>
          </div>
        </div>
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
    <!-- 刷新按钮移除，下载操作已移至文件名后 -->
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';
import { computed, ref } from 'vue';
import FavReal from './FavReal.vue';
import CloudSave from './CloudSave.vue';

import { getCT } from '../../services/api';
import { ElMessage } from 'element-plus';
// CloudSave 逻辑已迁移至独立组件

// CloudSave 组件外部引入
const props = defineProps({
  file: { type: Object, default: null },
  showPreview: { type: Boolean, default: true },
  showText: { type: Boolean, default: false },
  isTranslate: { type: Boolean, default: false },
  hasPerm: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  showReturn: { type: Boolean, default: true },
  showFav: { type: Boolean, default: true },
  showSaveToCloud: { type: Boolean, default: true }
});
const emit = defineEmits(['back','toggle-preview','toggle-text','translate','reload','download','download-finish','download-error']);

// canPreview 仍用于切换“AI阅读/文本/翻译”按钮的可用状态（需要有内容可预览）
const canPreview = computed(() => !!props.hasPerm && (!!props.file?.previewUrl || !!props.file?.extractedText));
// canOperate 专用于顶部下载/收藏/云盘按钮显示条件，只要有权限即可
const canOperate = computed(() => !!props.hasPerm);
// 允许下载条件：有权限 且 (后端已给 downloadUrl 或 提供 (fileId+fileCategory) 以便即时获取)
const canDownload = computed(() => !!props.hasPerm && (!!props.file?.downloadUrl || (!!props.file?.fileId && !!(props.file?.fileCategory || props.file?.fc))));
const downloading = ref(false);

async function realDownload(){
  if (!canDownload.value || downloading.value || !props.file) return;
  downloading.value = true;
  try {
    const fc = props.file.fileCategory || props.file.fc;
    let url='';
  if (fc === 'nas') {
      const nasCode = props.file.nasId || props.file.nasCode;
      const nasFilePath = props.file.subPath || props.file.filePath;
      if (!nasCode || !nasFilePath) throw new Error('NAS 参数缺失');
      url = `apps/nas/file/download?nasCode=${encodeURIComponent(nasCode)}&nasFilePath=${encodeURIComponent(nasFilePath)}&ct=${encodeURIComponent(getCT()||'')}`;
      triggerDownload(url, props.file.fileName || props.file.name);
    } else {
      // 请求下载地址
      const res = await fetchFileDownLink({ fi: props.file.fileId, fc });
      if (res?.fileUri || res?.data?.fileUri) {
        const fileUri = res.fileUri || res.data.fileUri;
        url = fileUri + (fileUri.includes('?')?'&':'?') + 'ct=' + encodeURIComponent(getCT()||'');
        triggerDownload(url, props.file.fileName || props.file.name);
      } else {
        throw new Error('文件获取失败');
      }
    }
  ElMessage.success('开始下载');
  emit('download-finish');
  } catch(e) {
    console.warn('[PreviewHeader] download failed', e);
  ElMessage.error('下载失败');
    emit('download-error', e);
  } finally {
    downloading.value = false;
  }
}

async function fetchFileDownLink({ fi, fc }) {
  const { appsApi } = await import('../../services/api');
  return appsApi.get('/file/down', { params:{ fi, fc }}).then(r => r?.data?.data || r?.data || r);
}

function triggerDownload(url, filename){
  if(!url) return;
  const abs = /^https?:/i.test(url) ? url : (window.location.origin.replace(/\/$/,'') + '/' + url.replace(/^\//,''));
  const a = document.createElement('a');
  a.href = abs;
  if(filename) a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ document.body.removeChild(a); }, 0);
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
.file-meta-block { display:flex; flex-direction:column; max-width:640px; }
.name-line { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.file-meta-block .name { font-size:15px; font-weight:600; line-height:20px; max-width:480px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.inline-actions { display:flex; align-items:center; gap:8px; }
.file-meta-block .meta-line { display:flex; gap:14px; font-size:12px; color:#73767a; margin-top:4px; }
.flex-spacer { flex:1; }
.mode-group { margin-left:auto; }
.actions :deep(button[disabled]) { opacity:.55; cursor:not-allowed; }
.back-btn { display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 14px; font-size:13px; font-weight:500; border:1px solid #d0d5dd; background:#fff; color:#303133; border-radius:6px; line-height:1; box-shadow:0 1px 2px rgba(0,0,0,.05); }
.back-btn:hover { color:#1671f2; border-color:#1671f2; background:#f5f9ff; }
.back-btn .txt { letter-spacing:.5px; }
</style>
