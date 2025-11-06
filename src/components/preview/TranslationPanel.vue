<template>
  <div class="translation-panel">
    <div class="translation-header">
      <h3>翻译</h3>
      <div class="translation-controls">
        <el-select v-model="targetLanguage" size="small" placeholder="选择语言">
          <el-option v-for="opt in smallLangOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-button size="small" @click="translateText" :loading="loading">翻译</el-button>
      </div>
    </div>
    
    <div class="translation-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>
      <el-input
        v-else
        :model-value="targetText"
        type="textarea"
        :rows="20"
        placeholder="翻译结果将显示在这里..."
        @update:model-value="$emit('update:targetText', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';
import { getLangOptions } from '../../utils/language';

const props = defineProps({
  sourceText: {
    type: String,
    default: ''
  },
  targetText: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:targetText']);

const aiToolsStore = useAiToolsStore();
const targetLanguage = ref('en');
const smallLangOptions = getLangOptions(['zh','en','ru','fr','hi']);
const loading = ref(false);

async function translateText() {
  if (!props.sourceText) {
    return;
  }
  
  loading.value = true;
  try {
    const translated = await aiToolsStore.translateText(props.sourceText, targetLanguage.value);
    emit('update:targetText', translated);
  } catch (error) {
    console.error('Failed to translate text:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.translation-panel {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.translation-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
}

.translation-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.translation-content {
  flex: 1;
}
</style>
