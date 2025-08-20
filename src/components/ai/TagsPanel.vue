<template>
  <div class="tags-panel">
    <div class="panel-header">
      <h3>文档标签</h3>
      <el-button size="small" @click="generateTags">生成标签</el-button>
    </div>
    
    <div class="tags-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="2" animated />
      </div>
      <div v-else-if="tags.length" class="tags-list">
        <el-tag v-for="tag in tags" :key="tag" type="info">{{ tag }}</el-tag>
      </div>
      <el-empty v-else description="点击生成标签按钮开始" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  }
});

const aiToolsStore = useAiToolsStore();
const tags = ref([]);
const loading = ref(false);

async function generateTags() {
  loading.value = true;
  try {
    tags.value = await aiToolsStore.getTags(props.fileId);
  } catch (error) {
    console.error('Failed to generate tags:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.tags-panel {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.tags-content {
  flex: 1;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
