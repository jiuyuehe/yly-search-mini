<template>
  <div class="custom-extraction-panel">
    <div class="panel-header">
      <h3>自定义提取</h3>
      <el-button size="small" @click="manageFormsDialog = true">管理表单</el-button>
    </div>
    
    <div class="extraction-content">
      <!-- Form Selection Section -->
      <div class="form-selection">
        <h4>选择抽取表单</h4>
        <el-select 
          v-model="selectedFormId" 
          placeholder="请选择表单"
          @change="onFormChange"
          style="width: 100%"
          :loading="formsStore.loading.list"
        >
          <el-option 
            v-for="form in formsStore.formOptions" 
            :key="form.value" 
            :label="form.label" 
            :value="form.value"
          />
        </el-select>
        
        <div v-if="selectedForm" class="form-info">
          <el-alert
            :title="`已选择: ${selectedForm.name}`"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <!-- AI Model Selection -->
      <div v-if="selectedForm" class="model-selection">
        <h4>选择AI模型</h4>
        <el-select 
          v-model="selectedModel" 
          placeholder="请选择AI模型"
          style="width: 100%"
          :loading="extractionsStore.loading.models"
        >
          <el-option 
            v-for="model in extractionsStore.availableModelOptions" 
            :key="model.value" 
            :label="model.label" 
            :value="model.value"
          />
        </el-select>
      </div>

      <!-- Extraction Button -->
      <div v-if="selectedForm && selectedModel" class="extraction-action">
        <el-button 
          type="primary" 
          @click="extractInfo" 
          :loading="extracting"
          :disabled="!selectedForm || !selectedModel"
        >
          开始抽取
        </el-button>
      </div>
      
      <!-- Extraction Result -->
      <div v-if="extractionResult" class="extraction-result">
        <div class="result-header">
          <h4>抽取结果</h4>
          <div class="result-actions">
            <el-button size="small" @click="editResult">编辑</el-button>
            <el-button size="small" type="primary" @click="confirmResult" :loading="saving">
              确认保存
            </el-button>
            <el-button size="small" @click="clearResult">清除</el-button>
          </div>
        </div>
        
        <div class="result-content">
          <ExtractionResultForm 
            v-if="selectedForm && extractionResult"
            :form-structure="selectedForm.structure"
            :extracted-data="extractionResult"
            :editable="resultEditable"
            @update="updateResult"
          />
        </div>
      </div>
    </div>

    <!-- Forms Management Dialog -->
    <el-dialog
      v-model="manageFormsDialog"
      title="表单管理"
      width="80%"
      :before-close="closeFormsDialog"
    >
      <FormsManager @form-selected="onFormSelected" />
      <template #footer>
        <el-button @click="closeFormsDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useFormsStore } from '../../stores/forms';
import { useExtractionsStore } from '../../stores/extractions';
import { aiService } from '../../services/aiService';
import ExtractionResultForm from './ExtractionResultForm.vue';
import FormsManager from '../forms/FormsManager.vue';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  }
});

const formsStore = useFormsStore();
const extractionsStore = useExtractionsStore();

const selectedFormId = ref(null);
const selectedModel = ref(null);
const extractionResult = ref(null);
const extracting = ref(false);
const saving = ref(false);
const resultEditable = ref(false);
const manageFormsDialog = ref(false);

const selectedForm = computed(() => {
  return selectedFormId.value ? formsStore.formById(selectedFormId.value) : null;
});

onMounted(async () => {
  await Promise.all([
    formsStore.loadForms(),
    extractionsStore.loadAvailableModels()
  ]);
  
  // Auto-select first model if available
  if (extractionsStore.availableModelOptions.length > 0) {
    selectedModel.value = extractionsStore.availableModelOptions[0].value;
  }
});

function onFormChange() {
  extractionResult.value = null;
  resultEditable.value = false;
}

async function extractInfo() {
  if (!selectedForm.value || !selectedModel.value) {
    ElMessage.warning('请先选择表单和AI模型');
    return;
  }

  extracting.value = true;
  
  try {
    // Call AI service for form-based extraction
    const result = await aiService.extractWithForm(
      props.fileId, 
      selectedForm.value.structure, 
      selectedModel.value
    );
    
    extractionResult.value = result;
    resultEditable.value = false;
    
    ElMessage.success('数据抽取完成');
  } catch (error) {
    ElMessage.error('抽取失败: ' + error.message);
    console.error('Extraction failed:', error);
  } finally {
    extracting.value = false;
  }
}

function editResult() {
  resultEditable.value = true;
}

function updateResult(newData) {
  extractionResult.value = { ...newData };
}

async function confirmResult() {
  if (!extractionResult.value) return;
  
  saving.value = true;
  
  try {
    // Save extraction result
    await extractionsStore.createExtraction({
      document_id: props.fileId,
      form_id: selectedFormId.value,
      ai_model: selectedModel.value,
      extracted_data: extractionResult.value
    });
    
    ElMessage.success('抽取结果已保存');
    resultEditable.value = false;
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message);
  } finally {
    saving.value = false;
  }
}

function clearResult() {
  extractionResult.value = null;
  resultEditable.value = false;
}

function onFormSelected(form) {
  selectedFormId.value = form.id;
  manageFormsDialog.value = false;
}

function closeFormsDialog() {
  manageFormsDialog.value = false;
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
