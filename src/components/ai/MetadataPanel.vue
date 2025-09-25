<template>
  <div class="metadata-panel">
    <div class="section">
      <div class="section-title">基础信息</div>
      <div class="info-grid" v-if="file">
        <div class="info-row">
          <div class="label">文件名称:</div>
          <div class="value filename multiline" title="{{ file.fileName || file.name }}">{{ file.fileName || file.name }}</div>
        </div>
        <div class="info-row">
          <div class="label">创建日期:</div>
          <div class="value">{{ formatDate(file.createdTime || file.createTime) }}</div>
        </div>
        <div class="info-row">
          <div class="label">创 建 者:</div>
          <div class="value">{{ file.creator || file.createrName || file.createUserName || '-' }}</div>
        </div>
        <div class="info-row">
          <div class="label">文件大小:</div>
          <div class="value">{{ formatSize(file.size || file.fileSize) }}</div>
        </div>
        <div class="info-row">
          <div class="label">文件类型:</div>
          <div class="value">{{ (file.fileType || file.docType || file.ext || extFromName).toString().toLowerCase() }}</div>
        </div>
        <div class="info-row">
          <div class="label">文件版本:</div>
          <div class="value">{{ file.fileVersion || file.version || '-' }}</div>
        </div>
        <div class="info-row">
          <div class="label">文本语言:</div>
          <div class="value">{{ file.fileLang || file.fileLanguage || '-' }}</div>
        </div>
      </div>
      <el-empty v-else description="无文件信息" />
    </div>

    <div class="section perms">
      <div class="section-title">
        <span>文件权限</span>
        <el-button size="small" link :loading="permLoading" @click="loadPerms">刷新</el-button>
      </div>
      <div class="perm-body" v-if="perms.length">
        <el-tag v-for="(p,i) in perms" :key="i" class="perm-tag" size="small" type="info">{{ mapPermission(p) }}</el-tag>
      </div>
      <div v-else class="perm-empty" :class="{ loading: permLoading }">
        <span v-if="permLoading">加载中...</span>
        <span v-else>暂无权限数据</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { fetchFilePermissions, mapPermission } from '../../services/permissions';
import { getFileExtenName } from '../../constants/fileTypes';

const props = defineProps({ file: { type: Object, default: null } });

const perms = ref([]);
const permLoading = ref(false);
const extFromName = computed(() => props.file ? getFileExtenName(props.file.fileName || props.file.name || '') : '');

function formatDate(d) {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const day = String(dt.getDate()).padStart(2,'0');
    const hh = String(dt.getHours()).padStart(2,'0');
    const mm = String(dt.getMinutes()).padStart(2,'0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch { return d; }
}
function formatSize(size) {
  if (!size && size !== 0) return '-';
  const s = Number(size);
  if (isNaN(s)) return size;
  if (s < 1024) return s + ' B';
  const kb = s/1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  const mb = kb/1024;
  if (mb < 1024) return mb.toFixed(1) + ' MB';
  const gb = mb/1024;
  return gb.toFixed(2) + ' GB';
}

async function loadPerms() {
  if (!props.file) { perms.value = []; return; }
  permLoading.value = true;
  try {
    perms.value = await fetchFilePermissions(props.file) || [];
  } finally {
    permLoading.value = false;
  }
}

watch(() => props.file?.fileId, () => loadPerms(), { immediate: true });

</script>

<style scoped>
.metadata-panel { display:flex; flex-direction:column; gap:18px; font-size:13px; line-height:1.5; }
.section { border:1px solid #ebeef5; border-radius:8px; padding:12px 14px 14px; background:#fff; }
.section-title { font-weight:600; font-size:13px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; }
.info-grid { display:flex; flex-direction:column; gap:6px; }
.info-row { display:flex; align-items:flex-start; gap:6px; }
.label { width:66px; flex:none; color:#606266; text-align:right; }
.value { flex:1; color:#303133; word-break:break-all; }
.filename { max-width:240px; }
.multiline { white-space:normal; word-break:break-all; overflow:visible; }
.perms .perm-body { display:flex; flex-wrap:wrap; gap:6px; }
.perm-tag { --el-tag-bg-color:#f5f7fa; }
.perm-empty { color:#999; font-size:12px; padding:4px 0 2px; }
.perm-empty.loading { color:#666; }
</style>
