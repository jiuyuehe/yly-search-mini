<template>
  <div class="form-designer">
    <div class="designer-header">
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <h2>{{ isEdit ? '编辑表单' : '新建表单' }}</h2>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-button @click="previewForm">预览</el-button>
          <el-button @click="loadSample">加载示例</el-button>
          <el-button type="primary" @click="saveForm" :loading="loading.save">
            {{ isEdit ? '更新' : '保存' }}
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20">
      <!-- Form Structure Designer -->
      <el-col :span="16">
        <el-card header="表单设计" class="designer-card">
          <el-form :model="formData" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="表单名称" required>
                  <el-input 
                    v-model="formData.name" 
                    placeholder="请输入表单名称"
                    :class="{ 'error': errors.name }"
                  />
                  <div v-if="errors.name" class="error-text">{{ errors.name }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="数据提取模式" required>
                  <el-radio-group v-model="formData.extractionMode">
                    <el-radio value="single">单数据提取</el-radio>
                    <el-radio value="multiple">多数据提取</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div class="fields-section">
            <div class="section-header">
              <h3>字段设计</h3>
              <el-button type="primary" icon="Plus" @click="addField">添加字段</el-button>
            </div>

            <div class="fields-table-container">
              <el-table 
                :data="formData.structure.fields" 
                border 
                stripe
                style="width: 100%"
                class="fields-table"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                
                <el-table-column label="字段名称" min-width="150">
                  <template #default="{ row, $index }">
                    <el-input 
                      v-model="row.name" 
                      placeholder="字段名称"
                      size="small"
                      @input="updateField($index, row)"
                    />
                  </template>
                </el-table-column>
                
                <el-table-column label="字段类型" width="140">
                  <template #default="{ row, $index }">
                    <el-select 
                      v-model="row.type" 
                      placeholder="类型"
                      size="small"
                      @change="onTypeChange($index, row)"
                    >
                      <el-option label="文本" value="text" />
                      <el-option label="数字" value="number" />
                      <el-option label="日期" value="date" />
                      <el-option label="布尔值" value="boolean" />
                      <el-option label="对象" value="object" />
                      <el-option label="数组" value="array" />
                    </el-select>
                  </template>
                </el-table-column>
                
                <el-table-column label="必填" width="80" align="center">
                  <template #default="{ row, $index }">
                    <el-switch 
                      v-model="row.required" 
                      size="small"
                      @change="updateField($index, row)"
                    />
                  </template>
                </el-table-column>
                
                <el-table-column label="示例值" min-width="180">
                  <template #default="{ row, $index }">
                    <el-input 
                      v-if="row.type === 'text'"
                      v-model="row.example" 
                      placeholder="示例文本"
                      size="small"
                      @input="updateField($index, row)"
                    />
                    <el-input-number 
                      v-else-if="row.type === 'number'"
                      v-model="row.example" 
                      placeholder="示例数字"
                      size="small"
                      @change="updateField($index, row)"
                      style="width: 100%"
                    />
                    <el-date-picker 
                      v-else-if="row.type === 'date'"
                      v-model="row.example" 
                      type="date"
                      placeholder="选择日期"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      size="small"
                      @change="updateField($index, row)"
                      style="width: 100%"
                    />
                    <el-switch 
                      v-else-if="row.type === 'boolean'"
                      v-model="row.example" 
                      size="small"
                      @change="updateField($index, row)"
                    />
                    <el-tag v-else-if="row.type === 'object'" type="info" size="small">对象类型</el-tag>
                    <el-tag v-else-if="row.type === 'array'" type="info" size="small">数组类型</el-tag>
                  </template>
                </el-table-column>
                
                <el-table-column label="操作" width="180" align="center" fixed="right">
                  <template #default="{ $index }">
                    <el-button 
                      size="small" 
                      :icon="ArrowUp" 
                      @click="moveFieldUp($index)"
                      :disabled="$index === 0"
                      circle
                    />
                    <el-button 
                      size="small" 
                      :icon="ArrowDown" 
                      @click="moveFieldDown($index)"
                      :disabled="$index === formData.structure.fields.length - 1"
                      circle
                    />
                    <el-button 
                      size="small" 
                      type="danger" 
                      :icon="Delete" 
                      @click="deleteField($index)"
                      circle
                    />
                  </template>
                </el-table-column>
              </el-table>

              <div v-if="formData.structure.fields.length === 0" class="empty-fields">
                <el-empty description="暂无字段，点击上方按钮添加字段" />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Preview Panel -->
      <el-col :span="8">
        <el-card header="实时预览" class="preview-card">
          <FormPreview :structure="formData.structure" />
        </el-card>

        <el-card header="JSON结构" class="json-card">
          <div class="json-container">
            <pre>{{ JSON.stringify(formData.structure, null, 2) }}</pre>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Preview Dialog -->
    <el-dialog
      v-model="showPreview"
      title="表单预览"
      width="60%"
      :before-close="closePreview"
    >
      <FormPreview :structure="formData.structure" :show-examples="true" />
      <template #footer>
        <el-button @click="closePreview">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowUp, ArrowDown, Delete } from '@element-plus/icons-vue';
import { useFormsStore } from '../../stores/forms';
import { formsService } from '../../services/formsService';
import FormPreview from './FormPreview.vue';

const router = useRouter();
const route = useRoute();
const formsStore = useFormsStore();

const isEdit = computed(() => !!route.params.id);
const showPreview = ref(false);

const formData = reactive({
  name: '',
  extractionMode: 'single', // 'single' or 'multiple'
  structure: {
    formName: '',
    fields: []
  }
});

const errors = reactive({
  name: ''
});

const loading = reactive({
  save: false,
  load: false
});

// Field ID generator
let fieldIdCounter = 1;

const generateFieldId = () => `field_${fieldIdCounter++}`;

// Initialize form data
onMounted(async () => {
  if (isEdit.value) {
    await loadForm();
  } else {
    resetForm();
  }
});

watch(() => formData.name, (newName) => {
  formData.structure.formName = newName;
  errors.name = '';
});

async function loadForm() {
  if (!route.params.id) return;
  
  loading.load = true;
  try {
    const form = await formsStore.loadForm(route.params.id);
    formData.name = form.name;
    formData.structure = { ...form.structure };
    
    // Add IDs to fields for reactivity
    addFieldIds(formData.structure.fields);
  } catch (error) {
    ElMessage.error('加载表单失败: ' + error.message);
    router.push('/forms');
  } finally {
    loading.load = false;
  }
}

function addFieldIds(fields) {
  fields.forEach(field => {
    if (!field.id) {
      field.id = generateFieldId();
    }
    if (field.fields && Array.isArray(field.fields)) {
      addFieldIds(field.fields);
    }
  });
}

function resetForm() {
  formData.name = '';
  formData.structure = {
    formName: '',
    fields: []
  };
  Object.keys(errors).forEach(key => {
    errors[key] = '';
  });
}

function addField() {
  const newField = {
    id: generateFieldId(),
    name: `字段${formData.structure.fields.length + 1}`,
    type: 'text',
    example: '',
    required: false
  };
  formData.structure.fields.push(newField);
}

function updateField(index, updatedField) {
  if (index >= 0 && index < formData.structure.fields.length) {
    formData.structure.fields[index] = { ...updatedField };
  }
}

function deleteField(index) {
  if (index >= 0 && index < formData.structure.fields.length) {
    formData.structure.fields.splice(index, 1);
  }
}

function moveFieldUp(index) {
  if (index > 0) {
    const field = formData.structure.fields[index];
    formData.structure.fields.splice(index, 1);
    formData.structure.fields.splice(index - 1, 0, field);
  }
}

function moveFieldDown(index) {
  if (index < formData.structure.fields.length - 1) {
    const field = formData.structure.fields[index];
    formData.structure.fields.splice(index, 1);
    formData.structure.fields.splice(index + 1, 0, field);
  }
}

function onTypeChange(index, field) {
  // Reset type-specific properties
  if (field.type === 'object' || field.type === 'array') {
    if (!field.fields) {
      field.fields = [];
    }
  } else {
    delete field.fields;
    delete field.itemType;
  }
  
  // Reset example value
  if (field.type === 'number') {
    field.example = 0;
  } else if (field.type === 'boolean') {
    field.example = false;
  } else if (field.type === 'date') {
    field.example = '';
  } else {
    field.example = '';
  }
  
  updateField(index, field);
}

function validateForm() {
  const validationErrors = formsStore.validateFormStructure(formData.structure);
  
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key] = '';
  });
  
  // Set new errors
  if (!formData.name.trim()) {
    errors.name = '表单名称不能为空';
  }
  
  if (validationErrors.length > 0) {
    ElMessage.error('表单验证失败：' + validationErrors.join('，'));
    return false;
  }
  
  if (errors.name) {
    ElMessage.error('请修正表单错误');
    return false;
  }
  
  return true;
}

async function saveForm() {
  if (!validateForm()) return;

  loading.save = true;
  try {
    const payload = {
      name: formData.name,
      structure: formData.structure
    };

    if (isEdit.value) {
      await formsService.updateForm(route.params.id, payload);
      ElMessage.success('表单更新成功');
    } else {
      await formsService.createForm(payload);
      ElMessage.success('表单创建成功');
    }
    // refresh store list to sync local cache
    await formsStore.loadForms();
    router.push('/forms');
  } catch (error) {
    ElMessage.error('保存失败: ' + (error.message || error));
  } finally {
    loading.save = false;
  }
}

function previewForm() {
  if (formData.structure.fields.length === 0) {
    ElMessage.warning('请先添加字段');
    return;
  }
  showPreview.value = true;
}

function closePreview() {
  showPreview.value = false;
}

function loadSample() {
  ElMessageBox.confirm(
    '加载示例将覆盖当前设计，是否继续？',
    '确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const sample = formsStore.generateSampleForm();
    formData.name = sample.formName;
    formData.structure = { ...sample };
    addFieldIds(formData.structure.fields);
    ElMessage.success('示例表单已加载');
  }).catch(() => {
    // User cancelled
  });
}
</script>

<style scoped>
.form-designer {
  padding: 24px;
  background-color: #F7F8FA;
  min-height: calc(100vh - 60px);
}

.designer-header {
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.designer-header h2 {
  margin: 0;
  color: #1F2937;
  font-size: 20px;
  font-weight: 600;
}

.text-right {
  text-align: right;
}

.designer-card, .preview-card, .json-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.designer-card :deep(.el-card__header) {
  background: #F9FAFB;
  border-bottom: 2px solid #E5E7EB;
  font-weight: 600;
  color: #1F2937;
}

.fields-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E5E7EB;
}

.section-header h3 {
  margin: 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.fields-table-container {
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
}

.fields-table {
  border-radius: 8px;
}

.fields-table :deep(.el-table__header) {
  background: #F9FAFB;
}

.fields-table :deep(.el-table__header th) {
  background: #F9FAFB;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
}

.fields-table :deep(.el-table__row:hover) {
  background: #F0F9FF;
}

.fields-table :deep(.el-table__body tr.el-table__row--striped) {
  background: #FAFBFC;
}

.empty-fields {
  padding: 60px 0;
  text-align: center;
  background: #FFFFFF;
  border-radius: 8px;
  margin-top: 16px;
}

.json-container {
  max-height: 300px;
  overflow-y: auto;
  background-color: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid #E5E7EB;
}

.error {
  border-color: #EF4444 !important;
}

.error-text {
  color: #EF4444;
  font-size: 12px;
  margin-top: 4px;
}

.preview-card .el-card__body {
  max-height: 400px;
  overflow-y: auto;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-color: #3B82F6;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  border-color: #2563EB;
}

:deep(.el-radio-group .el-radio) {
  margin-right: 16px;
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #3B82F6;
  border-color: #3B82F6;
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #3B82F6;
}
</style>