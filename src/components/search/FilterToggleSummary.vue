<template>
  <div class="filter-toggle-summary">
  <div class="top-row">
      <el-button
        :type="show ? 'primary' : 'default'"
        class="toggle-btn"
        size="small"
        @click="$emit('toggle', !show)"
      >
        <el-icon><Filter /></el-icon>
        <span class="txt">{{ show ? '隐藏筛选' : '高级筛选' }}</span>
        <span v-if="activeCount" class="count-badge">{{ activeCount }}</span>
      </el-button>
      <el-button v-if="activeCount" size="small" text type="danger" class="clear-btn" @click="clearAll">
        清空
      </el-button>
      <div v-if="activeTags.length" class="tags-row">
      <el-tag
        v-for="t in activeTags"
        :key="t.key + ':' + t.value"
        size="small"
        type="info"
        closable
        @close="removeTag(t)"
      >
        {{ t.label }}
      </el-tag>
    </div>
    </div>
    
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Filter } from '@element-plus/icons-vue';
import { useSearchStore } from '../../stores/search';

const _props = defineProps({ show: { type: Boolean, default: false } });
const emit = defineEmits(['toggle', 'clear', 'remove']);
const store = useSearchStore();

const optionMaps = computed(() => {
  const m = {};
  const fo = store.filterOptions || {};
  [['fileSpaces','fileSpace'], ['creators','creators'], ['tags','tags'], ['formats','formats']]
    .forEach(([src, key]) => {
      (fo[src] || []).forEach(o => {
        m[key] = m[key] || {};
        m[key][o.value] = o.label;
      });
    });
  return m;
});

function mapLabel(group, val) { return optionMaps.value[group]?.[val] || val; }

const timeRangeMap = { all:'全部时间', today:'今天', week:'本周', month:'本月', year:'本年', custom:'自定义时间' };
const fileCategoryLabelMap = { personal:'个人空间', group:'团队空间', public:'公共空间' };

const activeTags = computed(() => {
  const f = store.filters || {};
  const tags = [];
  (f.fileCategory || []).forEach(v => tags.push({ key:'fileCategory', value:v, label:`空间:${fileCategoryLabelMap[v]||v}` }));
  (f.fileSpace || []).forEach(v => tags.push({ key:'fileSpace', value:v, label:`空间:${mapLabel('fileSpace', v)}` }));
  (f.creators || []).forEach(v => tags.push({ key:'creators', value:v, label:`创建者:${mapLabel('creators', v)}` }));
  (f.tags || []).forEach(v => tags.push({ key:'tags', value:v, label:`标签:${mapLabel('tags', v)}` }));
  (f.formats || []).forEach(v => tags.push({ key:'formats', value:v, label:`格式:${mapLabel('formats', v)}` }));
  if (f.timeRange && f.timeRange !== 'all') tags.push({ key:'timeRange', value:f.timeRange, label:`时间:${timeRangeMap[f.timeRange]||f.timeRange}` });
  if (f.fileSize && f.fileSize.length) f.fileSize.forEach(v => tags.push({ key:'fileSize', value:v, label:`大小:${v}` }));
  if (f.versions && Array.isArray(f.versions)) {
    const nonDefault = f.versions.filter(v => v !== 'latest');
    nonDefault.forEach(v => tags.push({ key:'versions', value:v, label:`版本:${v}` }));
  }
  return tags;
});

const activeCount = computed(() => activeTags.value.length);
function clearAll() { emit('clear'); }
function removeTag(tag) { emit('remove', tag); }
</script>

<style scoped>
.filter-toggle-summary { 
  display:flex; 
  flex-direction:column; 
  gap:8px; 
  margin-bottom:16px; 
}

.top-row { 
  display:flex; 
  align-items:center; 
  gap:8px; 
  justify-content:flex-start; 
}

.toggle-btn { 
  display:inline-flex; 
  align-items:center; 
  gap:6px;
  border-radius: var(--border-radius-md);
  transition: all 0.3s;
}

.toggle-btn .txt {
  font-weight: 500;
}

.count-badge {
  background: var(--background-color);
  color: var(--primary-color);
  border-radius: var(--border-radius-lg);
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  line-height: 16px;
  font-weight: 600;
  margin-left: 4px;
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

.clear-btn { 
  color: var(--status-danger-strong);
  font-weight: 500;
}

.clear-btn:hover {
  color: var(--status-danger-intense);
  background: var(--status-danger-bg);
}

.tags-row { 
  display:flex; 
  flex-wrap:wrap; 
  gap:8px; 
}

.tags-row :deep(.el-tag) {
  border-radius: 6px;
  padding: 0 12px;
  height: 28px;
  line-height: 26px;
  font-size: var(--font-size-sm);
  border-color: var(--border-color);
  background: var(--background-color-light);
  color: var(--text-color-primary);
}

.tags-row :deep(.el-tag .el-icon) {
  color: var(--text-color-secondary);
}

.tags-row :deep(.el-tag .el-icon:hover) {
  color: var(--primary-color);
}
</style>
