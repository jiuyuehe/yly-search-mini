<template>
  <div class="file-meta-info" v-if="file">
      <div class="top-line">
        <img v-if="showIcon" :src="fileIcon" alt="icon" class="file-icon-img" />
        <span class="file-name" :title="rawName" v-html="nameHtml" @click.stop="handleOpenPreview" role="button" aria-label="open-preview"></span>
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
import { useSearchStore } from '../../stores/search';
import { goCloudPath } from '../../services/navigation';
import { parseftsIcon } from '../../filters/filters';

const props = defineProps({
  file: { type: Object, required: true },
  highlight: { type: String, default: '' }, // 需要高亮的关键词
  showIcon: { type: Boolean, default: true }
});

const rawName = computed(() => props.file?.name || props.file?.fileName || '');
const emit = defineEmits(['open-path','open-preview']);

function handleOpenPreview(e){
  try { emit('open-preview', props.file, e); } catch { /* ignore */ }
}

function escapeHtml(str='') {
  const s = String(str || '');
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
}
function stripTags(str='') { return String(str || '').replace(/<[^>]+>/g, ''); }
function escapeReg(str='') { return String(str).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

const searchStore = useSearchStore();

const highlightTerm = computed(() => {
  const p = (props.highlight || '').trim();
  if (p) return p;
  try { return (searchStore.query || '').trim(); } catch { return ''; }
});

const nameHtml = computed(() => {
  // 先去掉后端可能注入的 HTML 标签，使用纯文本进行前端高亮
  const raw = stripTags(rawName.value);
  const name = escapeHtml(raw);
  const kw = (highlightTerm.value || '').trim();
  if (!kw) return name;
  try {
    const parts = kw.split(/\s+/).filter(Boolean).map(p => escapeReg(p));
    if (parts.length === 0) return name;
    const reg = new RegExp('(' + parts.join('|') + ')', 'gi');
    return name.replace(reg, m => `<span class="hl">${m}</span>`);
  } catch {
    return name;
  }
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
.top-line { display:flex; align-items:center; gap:8px; font-weight:600; font-size: var(--font-size-md-plus); }
.file-icon-img { width:32px; height:32px; object-fit:contain; display:block; }
.file-name { max-width:420px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.file-name { cursor: pointer; }
.file-name:hover { color: var(--primary-color); text-decoration: underline; }
.bottom-line { display:flex; flex-wrap:wrap; gap:16px; font-size: var(--font-size-xs); color:var(--text-color-regular); line-height:1.3; }
.bottom-line span { display:inline-flex; align-items:center; gap:4px; }
.bottom-line .path a { color:#1671f2; text-decoration:none; max-width:460px; display:inline-block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bottom-line .path a:hover { text-decoration:underline; }
.file-name :deep(.hl) { background:#ffeb3b; padding:0 2px; border-radius:3px; font-weight:600; }
</style>
