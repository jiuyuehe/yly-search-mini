<template>
  <div class="extraction-detail">
    <div class="detail-header">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="info-item">
            <span class="label">抽取ID:</span>
            <span class="value">{{ extraction.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">文档ID:</span>
            <el-link type="primary" @click="viewDocument">{{ extraction.document_id }}</el-link>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <span class="label">AI模型:</span>
            <span class="value">{{ extraction.ai_model }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态:</span>
            <el-tag :type="getStatusType(extraction.status)">
              {{ getStatusText(extraction.status) }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
      
      <div class="action-buttons" v-if="!editable">
        <el-button @click="$emit('edit')">编辑数据</el-button>
        <el-button type="primary" @click="exportData">导出数据</el-button>
      </div>
      
      <div class="action-buttons" v-else>
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" @click="save">保存修改</el-button>
      </div>
    </div>

    <div class="detail-content">
      <h4>抽取数据</h4>
      
      <div v-if="formStructure">
        <ExtractionResultForm 
          :form-structure="formStructure"
          :extracted-data="localData"
          :editable="editable"
          @update="updateData"
        />
      </div>
      
      <div v-else class="raw-data">
        <h5>原始数据</h5>
        <el-input
          v-if="editable"
          v-model="rawDataText"
          type="textarea"
          :rows="15"
          placeholder="JSON格式数据"
        />
        <pre v-else class="json-display">{{ JSON.stringify(extraction.extracted_data, null, 2) }}</pre>
      </div>
    </div>

    <div class="detail-footer">
      <div class="timestamps">
        <div class="timestamp-item">
          <span class="label">创建时间:</span>
          <span class="value">{{ formatDate(extraction.created_at) }}</span>
        </div>
        <div class="timestamp-item">
          <span class="label">更新时间:</span>
          <span class="value">{{ formatDate(extraction.updated_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useFormsStore } from '../../stores/forms';
import { useExtractionsStore } from '../../stores/extractions';
import ExtractionResultForm from '../ai/ExtractionResultForm.vue';

const props = defineProps({
  extraction: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update', 'edit', 'save', 'cancel']);

const router = useRouter();
const formsStore = useFormsStore();
const extractionsStore = useExtractionsStore();

const localData = ref({});
const rawDataText = ref('');

const formStructure = computed(() => {
  const form = formsStore.formById(props.extraction.form_id);
  return form ? form.structure : null;
});

onMounted(() => {
  initializeData();
});

watch(() => props.extraction.extracted_data, () => {
  initializeData();
}, { deep: true });

function initializeData() {
  localData.value = { ...props.extraction.extracted_data };
  rawDataText.value = JSON.stringify(props.extraction.extracted_data, null, 2);
}

function updateData(newData) {
  localData.value = { ...newData };
  rawDataText.value = JSON.stringify(newData, null, 2);
  emit('update', newData);
}

function save() {
  let dataToSave;
  
  if (formStructure.value) {
    dataToSave = localData.value;
  } else {
    // Try to parse raw JSON
    try {
      dataToSave = JSON.parse(rawDataText.value);
    } catch (error) {
      ElMessage.error('JSON格式错误，请检查数据格式');
      return;
    }
  }
  
  emit('save', dataToSave);
}

function viewDocument() {
  router.push(`/preview/doc/${props.extraction.document_id}`);
}

async function exportData() {
  try {
    await extractionsStore.exportExtractions([props.extraction.id], 'json');
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message);
  }
}

function getStatusType(status) {
  const types = {
    completed: 'success',
    pending: 'warning', 
    error: 'danger'
  };
  return types[status] || 'info';
}

function getStatusText(status) {
  const texts = {
    completed: '已完成',
    pending: '处理中',
    error: '失败'
  };
  return texts[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}
</script>

<style scoped>
.extraction-detail {
  padding: 20px;
}

.detail-header {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-item .label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
  margin-right: 10px;
}

.info-item .value {
  color: #303133;
}

.action-buttons {
  margin-top: 20px;
  text-align: right;
}

.detail-content {
  margin-bottom: 30px;
}

.detail-content h4 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.raw-data {
  margin-top: 20px;
}

.raw-data h5 {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 14px;
}

.json-display {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-footer {
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.timestamps {
  display: flex;
  gap: 30px;
}

.timestamp-item {
  display: flex;
  align-items: center;
}

.timestamp-item .label {
  font-weight: 600;
  color: #909399;
  margin-right: 10px;
}

.timestamp-item .value {
  color: #606266;
  font-size: 14px;
}
</style>