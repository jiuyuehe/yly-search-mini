<template>
  <div class="text-extractor">
    <div class="extractor-header">
      <h3>文本提取</h3>
      <el-button size="small" @click="extractText">提取</el-button>
    </div>
    
    <div class="extracted-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>
      <el-input
        v-else
        v-model="extractedContent"
        type="textarea"
        :rows="20"
        placeholder="提取的文本内容将显示在这里..."
        readonly
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  }
});

const aiToolsStore = useAiToolsStore();
const extractedContent = ref(props.content);
const loading = ref(false);

// Watch for content prop changes
watch(() => props.content, (newContent) => {
  extractedContent.value = newContent;
});

async function extractText() {
  loading.value = true;
  try {
    extractedContent.value = await aiToolsStore.extractText(props.fileId);
  } catch (error) {
    console.error('Failed to extract text:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.text-extractor {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.extractor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.extractor-header h3 {
  margin: 0;
  font-size: 16px;
}

.extracted-content {
  flex: 1;
}
</style>
