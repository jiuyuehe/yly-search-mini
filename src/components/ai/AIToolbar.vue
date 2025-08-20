<template>
  <div class="ai-dock">
    <el-tooltip
      v-for="tool in tools"
      :key="tool.key"
      placement="left"
      :content="tool.label"
    >
      <button
        class="dock-btn"
        :class="{ active: activeAITool === tool.key }"
        @click="$emit('tool-change', tool.key)"
      >
        <el-icon :size="18"><component :is="tool.icon" /></el-icon>
      </button>
    </el-tooltip>
  </div>
</template>

<script setup>
import { ChatLineSquare, CollectionTag, Connection, Box, ChatRound, RefreshRight } from '@element-plus/icons-vue';

defineProps({
  activeAITool: { type: String, default: 'summary' }
});

defineEmits(['tool-change']);

const tools = [
  { key: 'summary', label: '摘要', icon: ChatLineSquare },
  { key: 'tags', label: '标签', icon: CollectionTag },
  { key: 'ner', label: '实体识别', icon: Connection },
  { key: 'customExtraction', label: '自定义提取', icon: Box },
  { key: 'qa', label: '问答', icon: ChatRound },
  { key: 'translation', label: '翻译', icon: RefreshRight }
];
</script>

<style scoped>
.ai-dock {
  width: 52px;
  border-left: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  gap: 8px;
}
.dock-btn {
  width: 40px;
  height: 40px;
  border: 1px solid transparent;
  background: #f5f7fa;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .18s ease;
  color: #606266;
}
.dock-btn:hover { background:#ecf5ff; color:#1671f2; }
.dock-btn.active {
  background: #1671f2;
  color: #fff;
  box-shadow: 0 4px 10px -2px rgba(22,113,242,.35);
}
</style>
