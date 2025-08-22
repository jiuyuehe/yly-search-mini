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
            <el-form-item label="表单名称" required>
              <el-input 
                v-model="formData.name" 
                placeholder="请输入表单名称"
                :class="{ 'error': errors.name }"
              />
              <div v-if="errors.name" class="error-text">{{ errors.name }}</div>
            </el-form-item>
          </el-form>

          <div class="fields-section">
            <div class="section-header">
              <h3>字段设计</h3>
              <el-button type="primary" icon="Plus" @click="addField">添加字段</el-button>
            </div>

            <div class="fields-container">
              <div 
                v-for="(field, index) in formData.structure.fields" 
                :key="field.id || index"
                class="field-item"
              >
                <FieldDesigner 
                  :field="field"
                  :index="index"
                  @update="updateField"
                  @delete="deleteField"
                  @move-up="moveFieldUp"
                  @move-down="moveFieldDown"
                />
              </div>

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
import { useFormsStore } from '../../stores/forms';
import FieldDesigner from './FieldDesigner.vue';
import FormPreview from './FormPreview.vue';

const router = useRouter();
const route = useRoute();
const formsStore = useFormsStore();

const isEdit = computed(() => !!route.params.id);
const showPreview = ref(false);

const formData = reactive({
  name: '',
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
    const formPayload = {
      name: formData.name,
      structure: formData.structure
    };
    
    if (isEdit.value) {
      await formsStore.updateForm(route.params.id, formPayload);
      ElMessage.success('表单更新成功');
    } else {
      await formsStore.createForm(formPayload);
      ElMessage.success('表单创建成功');
    }
    
    router.push('/forms');
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message);
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
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.designer-header {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.designer-header h2 {
  margin: 0;
  color: #303133;
}

.text-right {
  text-align: right;
}

.designer-card, .preview-card, .json-card {
  margin-bottom: 20px;
}

.fields-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h3 {
  margin: 0;
  color: #606266;
}

.fields-container {
  max-height: 600px;
  overflow-y: auto;
}

.field-item {
  margin-bottom: 15px;
}

.empty-fields {
  padding: 40px 0;
  text-align: center;
}

.json-container {
  max-height: 300px;
  overflow-y: auto;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.error {
  border-color: #f56c6c !important;
}

.error-text {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
}

.preview-card .el-card__body {
  max-height: 400px;
  overflow-y: auto;
}
</style>