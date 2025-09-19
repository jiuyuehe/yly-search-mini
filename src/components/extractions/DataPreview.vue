<template>
  <div class="data-preview">
    <!-- 当无可展示数据时 -->
    <div v-if="!previewSource || Object.keys(previewSource).length === 0" class="empty-data">
      <el-text type="info">暂无数据</el-text>
    </div>
    <!-- 展开若干条扁平化后的预览字段（最多 maxItems） -->
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
  // 旧调用：直接传入已解析的对象
  data: { type: Object, default: () => ({}) },
  // 新数据：保存记录里的 fields（字符串数组，每一项是 JSON 字符串）
  fields: { type: [Array, String], default: null },
  // 限制预览中显示的条目数量
  maxItems: { type: Number, default: 3 }
});

// 统一得到一个用于预览的源对象（优先解析 fields 参数：字符串数组，每条都是一个 JSON 块）
const previewSource = computed(() => {
  // 如果提供了 fields（字符串数组），尝试合并解析成一个对象
  if (props.fields) {
    const srcObj = {};
    const arr = Array.isArray(props.fields) ? props.fields : [props.fields];
    let merged = {};
    arr.forEach((item, idx) => {
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          // 合并策略：第一层 key 直接覆盖（如冲突后面覆盖前面）
          Object.assign(merged, parsed);
        } catch (e) {
          console.warn('[DataPreview] 第 ' + idx + ' 条 fields 解析失败', e, item);
        }
      } else if (item && typeof item === 'object') {
        Object.assign(merged, item);
      }
    });
    return Object.keys(merged).length ? merged : props.data || {};
  }
  return props.data || {};
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
  
  if (previewSource.value) {
    flatten(previewSource.value);
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