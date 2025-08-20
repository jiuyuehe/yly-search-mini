<template>
  <div class="document-qa">
    <div class="panel-header">
      <h3>文档问答</h3>
    </div>
    
    <div class="qa-content">
      <div class="qa-history">
        <div v-for="qa in qaHistory" :key="qa.id" class="qa-item">
          <div class="question">Q: {{ qa.question }}</div>
          <div class="answer">A: {{ qa.answer }}</div>
        </div>
      </div>
      
      <div class="qa-input">
        <el-input
          v-model="currentQuestion"
          placeholder="输入问题..."
          @keyup.enter="askQuestion"
        >
          <template #append>
            <el-button @click="askQuestion">提问</el-button>
          </template>
        </el-input>
      </div>
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

const currentQuestion = ref('');
const qaHistory = ref([]);

function askQuestion() {
  if (!currentQuestion.value.trim()) return;
  
  qaHistory.value.push({
    id: Date.now(),
    question: currentQuestion.value,
    answer: '这是一个示例回答，演示了问答功能的工作方式。'
  });
  
  currentQuestion.value = '';
}
</script>

<style scoped>
.document-qa {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
}

.qa-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.qa-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 15px;
}

.qa-item {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.question {
  font-weight: 500;
  margin-bottom: 5px;
}

.answer {
  color: #606266;
}
</style>
