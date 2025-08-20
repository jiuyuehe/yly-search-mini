<template>
  <div class="summary-panel">
    <div class="panel-header">
      <h3>文档摘要</h3>
      <el-button size="small" @click="generateSummary">生成摘要</el-button>
    </div>
    
    <div class="summary-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>
      <el-card v-else-if="summary" shadow="never">
        <p>{{ summary }}</p>
      </el-card>
      <el-empty v-else description="点击生成摘要按钮开始" />
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
const summary = ref('');
const loading = ref(false);

async function generateSummary() {
  loading.value = true;
  try {
    summary.value = await aiToolsStore.getSummary(props.fileId);
  } catch (error) {
    console.error('Failed to generate summary:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.summary-panel {
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

.summary-content {
  flex: 1;
  overflow-y: auto;
}
</style>
