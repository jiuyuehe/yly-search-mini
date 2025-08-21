<template>
  <div class="search-result-tabs">
    <el-tabs v-model="activeTabModel" @tab-click="onTabClick">
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
  activeTab: {
    type: String,
    default: 'all'
  },
  counts: {
    type: Object,
    default: () => ({})
  }
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

function onTabClick(pane) {
  // 兜底：如果某些情况下 v-model 未触发（理论上不会），手动 emit
  const name = pane?.props?.name;
  if (name && name !== props.activeTab) emit('tab-change', name);
}
</script>

<style scoped>
.search-result-tabs {
  margin-bottom: 15px;
}
.search-result-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}
</style>

