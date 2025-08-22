<template>
  <div class="data-preview">
    <div v-if="!data || Object.keys(data).length === 0" class="empty-data">
      <el-text type="info">暂无数据</el-text>
    </div>
    
    <div v-else class="data-content">
      <div 
        v-for="(value, key) in flattenedData" 
        :key="key" 
        class="data-item"
      >
        <span class="data-key">{{ key }}:</span>
        <span class="data-value">{{ formatValue(value) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  maxItems: {
    type: Number,
    default: 3
  }
});

const flattenedData = computed(() => {
  const flattened = {};
  let count = 0;
  
  function flatten(obj, prefix = '') {
    if (count >= props.maxItems) return;
    
    for (const [key, value] of Object.entries(obj)) {
      if (count >= props.maxItems) break;
      
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flatten(value, fullKey);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          flattened[fullKey] = `[${value.length}项]`;
          count++;
        }
      } else {
        flattened[fullKey] = value;
        count++;
      }
    }
  }
  
  if (props.data) {
    flatten(props.data);
  }
  
  return flattened;
});

function formatValue(value) {
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  
  if (typeof value === 'string' && value.length > 30) {
    return value.substring(0, 30) + '...';
  }
  
  return String(value);
}
</script>

<style scoped>
.data-preview {
  font-size: 12px;
  line-height: 1.4;
}

.empty-data {
  color: #909399;
  font-style: italic;
}

.data-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.data-key {
  font-weight: 600;
  color: #606266;
  min-width: 60px;
  flex-shrink: 0;
}

.data-value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}
</style>