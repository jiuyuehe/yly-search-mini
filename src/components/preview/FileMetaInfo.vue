<template>
  <div class="file-meta-info" v-if="file">
    <div class="top-line">
      <img :src="fileIcon" alt="icon" class="file-icon-img" />
      <span class="file-name" :title="rawName" v-html="nameHtml"></span>
    </div>
    <div class="bottom-line">
      <span v-if="file.creator">作者: {{ file.creator }}</span>
      <span v-if="file.modifiedTime">时间: {{ formatDate(file.modifiedTime) }}</span>
      <span v-if="file.size">大小: {{ formatSize(file.size) }}</span>
            <span class="path">
              路径:
              <a href="#" @click.stop.prevent="handleGoPath" :title="fullPathTooltip">
                <template v-if="categoryLabel || displayPath">
                  {{ categoryLabel || '其他空间' }}<span v-if="displayPath"> / {{ displayPath }}</span>
                </template>
                <template v-else>—</template>
              </a>
            </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { goCloudPath } from '../../services/navigation';
import { parseftsIcon } from '../../filters/filters';

const props = defineProps({
  file: { type: Object, required: true },
  highlight: { type: String, default: '' } // 需要高亮的关键词
});

const rawName = computed(() => props.file?.name || props.file?.fileName || '');

function escapeHtml(str='') {
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\u0027':'&#39;' };
  return str.replace(/[&<>"']/g, c => (c === "'" ? map['\u0027'] : map[c]));
}
function escapeReg(str='') { return str.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

const nameHtml = computed(() => {
  const name = escapeHtml(rawName.value);
  const kw = (props.highlight || '').trim();
  if (!kw) return name;
  try {
    const reg = new RegExp(escapeReg(kw), 'gi');
    return name.replace(reg, m => `<span class="hl">${m}</span>`);
  } catch { return name; }
});

const fileIcon = computed(() => {
  try { return parseftsIcon(props.file || {}); } catch { return new URL('../../assets/ftsicon/unknown.png', import.meta.url).href; }
});

const categoryLabel = computed(()=>{
  const fc = (props.file?.fileCategory || '').toLowerCase();
  const map = {
    public: '公共空间',
    private: '个人空间',
    personal: '个人空间',
    group: '群组空间',
    teams: '群组空间',
    share: '共享空间',
    shared: '共享空间',
    nas: 'NAS空间'
  };
  return map[fc] || (fc ? '其他空间' : '');
});
const displayPath = computed(()=> (props.file?.filePath || '').replace(/^\/+/, ''));
const fullPathTooltip = computed(()=> {
  if (!categoryLabel.value && !displayPath.value) return '—';
  return categoryLabel.value + (displayPath.value ? ' / ' + displayPath.value : '');
});

function handleGoPath(){
  // 优先使用封装方法
  try { goCloudPath(props.file); } catch {
    try { window.top?.postMessage({ type:'client_go_path', file: props.file }, '*'); } catch { /* silent */ }
  }
}

function formatDate(val) { try { return new Date(val).toLocaleString('zh-CN'); } catch { return val || ''; } }
function formatSize(size) { if (!size) return ''; const units=['B','KB','MB','GB','TB']; let i=0; let n=size; while(n>=1024 && i<units.length-1){ n/=1024; i++; } return n.toFixed(n>=100||i===0?0:1)+' '+units[i]; }
</script>

<style scoped>
.file-meta-info { display:flex; flex-direction:column; gap:4px; min-width:0; }
.top-line { display:flex; align-items:center; gap:8px; font-weight:600; font-size:15px; }
.file-icon-img { width:32px; height:32px; object-fit:contain; display:block; }
.file-name { max-width:420px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bottom-line { display:flex; flex-wrap:wrap; gap:16px; font-size:12px; color:#606266; line-height:1.3; }
.bottom-line span { display:inline-flex; align-items:center; gap:4px; }
.bottom-line .path a { color:#1671f2; text-decoration:none; max-width:320px; display:inline-block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bottom-line .path a:hover { text-decoration:underline; }
.hl { background:#ffeb3b; padding:0 2px; border-radius:3px; font-weight:600; }
</style>
