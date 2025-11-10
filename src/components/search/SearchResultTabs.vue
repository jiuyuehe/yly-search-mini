<template>
  <div class="search-result-tabs">
    <el-tabs v-model="activeTabModel">
      <el-tab-pane 
        v-for="tab in tabs" 
        :key="tab.key"
        :label="getTabLabel(tab)"
        :name="tab.key"
      />
    </el-tabs>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  activeTab: { type: String, default: 'all' },
  // backend may return an array of { key: '2', count: N } or an object map
  counts: { type: [Object, Array], default: () => ({}) }
});

const emit = defineEmits(['tab-change']);

// Desired display order and labels
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'document', label: '文档' },
  { key: 'image', label: '图片' },
  { key: 'audio', label: '音频' },
  { key: 'video', label: '视频' },
  { key: 'archive', label: '压缩包' },
  { key: 'other', label: '其他' }
];

// map backend numeric keys to our tab keys
const backendKeyMap = {
  '2': 'document',
  '1': 'image',
  '3': 'audio',
  '4': 'video',
  '6': 'archive',
  '0': 'other'
};

// normalize counts into a map: { document: N, image: M, ... }
const normalizedCounts = computed(() => {
  const map = { document: 0, image: 0, audio: 0, video: 0, archive: 0, other: 0 };
  const src = props.counts || [];
  if (Array.isArray(src)) {
    src.forEach(item => {
      const k = String(item.key);
      const mapped = backendKeyMap[k] || 'other';
      const c = Number(item.count) || 0;
      map[mapped] = (map[mapped] || 0) + c;
    });
  } else if (src && typeof src === 'object') {
    // assume keys already by tab key
    Object.keys(src).forEach(k => {
      const c = Number(src[k]) || 0;
      if (Object.prototype.hasOwnProperty.call(map, k)) map[k] = c;
    });
  }
  return map;
});

const activeTabModel = computed({
  get: () => props.activeTab,
  set: (value) => emit('tab-change', value)
});

function getTabLabel(tab) {
  if (tab.key === 'all') {
    const total = Object.values(normalizedCounts.value).reduce((s, v) => s + (Number(v) || 0), 0);
    return `${tab.label} (${total})`;
  }
  const count = normalizedCounts.value[tab.key] || 0;
  return `${tab.label} (${count})`;
}
// 移除 onTabClick，之前与 v-model setter 重复触发 emit 导致双请求
</script>

<style scoped>
.search-result-tabs { 

}

.search-result-tabs :deep(.el-tabs__header) { 
  margin-bottom: 12px;
  border-bottom: 2px solid var(--border-color-light);
}

.search-result-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 0;
}

.search-result-tabs :deep(.el-tabs__item) {
  font-size: var(--font-size-md-plus);
  font-weight: 500;
  color: var(--text-color-secondary);
  padding: 0 20px;
  height: 44px;
  line-height: 44px;
  transition: all 0.3s;
}

.search-result-tabs :deep(.el-tabs__item:hover) {
  color: var(--primary-color);
}

.search-result-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}

.search-result-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  border-radius: 3px 3px 0 0;
}
</style>

