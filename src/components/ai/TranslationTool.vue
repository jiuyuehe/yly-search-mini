<template>
  <div class="translation-tool">
    <div class="panel-header">
      <h3>AI翻译</h3>
    </div>
    
    <div class="translation-content">
      <el-form :model="form" label-width="80px">
        <el-form-item label="目标语言">
          <el-select v-model="form.targetLanguage" placeholder="选择语言">
            <el-option label="英文" value="en" />
            <el-option label="中文" value="zh" />
            <el-option label="日文" value="ja" />
            <el-option label="韩文" value="ko" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="源文本">
          <el-input
            v-model="form.sourceText"
            type="textarea"
            :rows="6"
            placeholder="输入要翻译的文本..."
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="translateText">翻译</el-button>
        </el-form-item>
        
        <el-form-item label="翻译结果">
          <el-input
            v-model="translatedText"
            type="textarea"
            :rows="6"
            readonly
            placeholder="翻译结果将显示在这里..."
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  fileId: {
    type: String,
    required: true
  }
});

const form = ref({
  targetLanguage: 'en',
  sourceText: ''
});

const translatedText = ref('');

function translateText() {
  if (!form.value.sourceText.trim()) return;
  
  translatedText.value = `[${form.value.targetLanguage}] 这是翻译后的文本示例...`;
}
</script>

<style scoped>
.translation-tool {
  padding: 15px;
  height: 100%;
  overflow-y: auto;
}

.panel-header h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
}
</style>
