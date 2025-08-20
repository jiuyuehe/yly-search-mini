<template>
  <div class="ai-toolbar">
    <div class="toolbar-header">
      <h3>AI工具</h3>
    </div>
    
    <div class="tool-buttons">
      <el-button
        v-for="tool in tools"
        :key="tool.key"
        :type="activeAITool === tool.key ? 'primary' : 'default'"
        size="small"
        @click="$emit('tool-change', tool.key)"
      >
        {{ tool.label }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activeAITool: {
    type: String,
    default: 'summary'
  }
});

defineEmits(['tool-change']);

const tools = [
  { key: 'summary', label: '摘要' },
  { key: 'tags', label: '标签' },
  { key: 'ner', label: '实体识别' },
  { key: 'customExtraction', label: '自定义提取' },
  { key: 'qa', label: '问答' },
  { key: 'translation', label: '翻译' }
];
</script>

<style scoped>
.ai-toolbar {
  width: 80px;
  padding: 15px 10px;
  border-left: 1px solid #dcdfe6;
  background-color: #f8f9fa;
}

.toolbar-header h3 {
  margin: 0 0 15px 0;
  font-size: 14px;
  text-align: center;
}

.tool-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-buttons .el-button {
  width: 100%;
  font-size: 12px;
  padding: 8px 4px;
}
</style>
