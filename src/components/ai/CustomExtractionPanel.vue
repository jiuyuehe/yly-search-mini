<template>
  <div class="custom-extraction-panel">
    <div class="panel-header">
      <h3>自定义提取</h3>
    </div>
    
    <div class="extraction-content">
      <el-form :model="form" label-width="80px">
        <el-form-item label="提取模板">
          <el-input
            v-model="form.template"
            type="textarea"
            :rows="4"
            placeholder="输入提取模板..."
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="extractInfo">提取信息</el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="result" class="extraction-result">
        <h4>提取结果：</h4>
        <pre>{{ result }}</pre>
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

const form = ref({
  template: ''
});

const result = ref('');

function extractInfo() {
  result.value = JSON.stringify({
    name: '示例名称',
    date: '2024-01-01',
    amount: '1000'
  }, null, 2);
}
</script>

<style scoped>
.custom-extraction-panel {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
}

.extraction-content {
  flex: 1;
  overflow-y: auto;
}

.extraction-result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.extraction-result pre {
  margin: 10px 0 0 0;
  font-size: 14px;
}
</style>
