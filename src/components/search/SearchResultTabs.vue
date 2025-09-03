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
  counts: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['tab-change']);

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'document', label: '文档' },
  { key: 'image', label: '图片' },
  { key: 'multimedia', label: '多媒体' },
  { key: 'archive', label: '压缩包' },
  { key: 'other', label: '其他' }
];

const activeTabModel = computed({
  get: () => props.activeTab,
  set: (value) => emit('tab-change', value)
});

function getTabLabel(tab) {
  const count = props.counts[tab.key] || 0;
  return `${tab.label} (${count})`;
}
// 移除 onTabClick，之前与 v-model setter 重复触发 emit 导致双请求
</script>

<style scoped>
.search-result-tabs { margin-bottom: 15px; }
.search-result-tabs :deep(.el-tabs__header) { margin-bottom: 10px; }
</style>

