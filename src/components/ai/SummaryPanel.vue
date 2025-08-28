<template>
  <div class="summary-panel">
    <div class="panel-header">
      <h3>文档摘要</h3>
      <div class="controls">
        <el-select v-model="targetLanguage" size="small" class="lang-select" placeholder="目标语言">
          <el-option label="中文" value="中文" />
          <el-option label="英文" value="英文" />
          <el-option label="日文" value="日文" />
          <el-option label="韩文" value="韩文" />
        </el-select>
        <el-input-number v-model="summaryLength" :min="50" :max="2000" :step="50" size="small" class="len-input" />
        <el-button size="small" type="primary" :loading="loading" @click="generateSummary">生成摘要</el-button>
      </div>
    </div>
    
    <div class="summary-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>
      <el-card v-else-if="summary" shadow="never">
        <p>{{ summary }}</p>
      </el-card>
      <el-empty v-else description="设置参数后点击生成摘要" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';

const props = defineProps({ fileId: { type: String, required: true } });

const aiToolsStore = useAiToolsStore();
const summary = ref('');
const loading = ref(false);
const targetLanguage = ref('中文'); // 默认中文
const summaryLength = ref(200); // 默认 200

async function generateSummary() {
  loading.value = true;
  summary.value = '';
  try {
    summary.value = await aiToolsStore.getSummary(props.fileId, targetLanguage.value, summaryLength.value);
  } catch (error) { console.error('Failed to generate summary:', error); }
  finally { loading.value = false; }
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
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-select {
  width: 100px;
}

.len-input :deep(.el-input__wrapper) {
  padding: 0 6px;
}

.summary-content {
  flex: 1;
  overflow-y: auto;
}
</style>
