<template>
  <div class="file-meta-info" v-if="file">
    <div class="top-line">
      <el-icon class="file-icon"><Document /></el-icon>
      <span class="file-name" :title="file.name">{{ file.name }}</span>
    </div>
    <div class="bottom-line">
      <span v-if="file.creator">作者: {{ file.creator }}</span>
      <span v-if="file.modifiedTime">时间: {{ formatDate(file.modifiedTime) }}</span>
      <span v-if="file.size">大小: {{ formatSize(file.size) }}</span>
      <span class="path">
        路径:
        <a href="#" @click.prevent="$emit('open-path', file.path || file.fullPath || '')"
           :title="file.path || file.fullPath || '—'">
          {{ file.path || file.fullPath || '—' }}
        </a>
      </span>
    </div>
  </div>
</template>

<script setup>
import { Document } from '@element-plus/icons-vue';

defineProps({
  file: { type: Object, required: true }
});

const emit = defineEmits(['open-path']);

function formatDate(val) {
  try { return new Date(val).toLocaleString('zh-CN'); } catch { return val || ''; }
}
function formatSize(size) {
  if (!size) return '';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0; let n = size;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n.toFixed(n >= 100 || i === 0 ? 0 : 1) + ' ' + units[i];
}
</script>

<style scoped>
.file-meta-info { display:flex; flex-direction:column; gap:4px; min-width:0; }
.top-line { display:flex; align-items:center; gap:8px; font-weight:600; font-size:15px; }
.file-icon { font-size:18px; }
.file-name { max-width:420px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bottom-line { display:flex; flex-wrap:wrap; gap:16px; font-size:12px; color:#606266; line-height:1.3; }
.bottom-line span { display:inline-flex; align-items:center; gap:4px; }
.bottom-line .path a { color:#1671f2; text-decoration:none; max-width:260px; display:inline-block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bottom-line .path a:hover { text-decoration:underline; }
</style>
