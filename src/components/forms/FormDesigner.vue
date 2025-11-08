<template>
  <div class="form-designer">
    <div class="designer-header">
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <h2>{{ isEdit ? '编辑表单' : '新建表单' }}</h2>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-button @click="previewForm">预览</el-button>
          <el-button @click="openJsonDialog">查看JSON</el-button>
          <el-dropdown split-button @click="loadSample" @command="onSampleCommand">
            加载示例
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="A">Sample A（平铺）</el-dropdown-item>
                <el-dropdown-item command="B">Sample B（对象+子字段）</el-dropdown-item>
                <el-dropdown-item command="C">Sample C（对象+数组元素为对象）</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
                <el-form-item label="数据提取数量" required>
                  <el-radio-group v-model="formData.extractionMode">
                    <el-radio value="single">单条数据</el-radio>
                    <el-radio value="multiple">多条数据</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="可见性" required>
                  <el-radio-group v-model="formData.visibility">
                    <el-radio value="public">公开</el-radio>
                    <el-radio value="personal">个人</el-radio>
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
                    <div v-else-if="row.type === 'object'" class="object-field-hint">
                      <el-tag type="info" size="small">对象类型</el-tag>
                      <el-tag v-if="row.fields" type="info" size="small" effect="plain">
                        {{ (row.fields && row.fields.length) || 0 }} 个子字段
                      </el-tag>
                    </div>
                    <el-tag v-else-if="row.type === 'array'" type="info" size="small">数组类型</el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="操作" width="220" align="center" fixed="right">
                  <template #default="{ row, $index }">
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
                      v-if="row.type === 'object'"
                      size="small"
                      :icon="Setting"
                      @click.stop="openSubFieldDialog($index, row)"
                      title="管理子字段"
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

    <!-- 子字段编辑对话框 -->
    <el-dialog
      v-model="subFieldDialog.visible"
      :title="`管理子字段：${subFieldDialog.parentField?.name || ''}`"
      :width="dialogWidth"
      :close-on-click-modal="false"
      @close="closeSubFieldDialog"
    >
      <div class="sub-field-dialog-content">
        <div class="sub-field-toolbar">
          <el-button type="primary" icon="Plus" @click="addSubField">添加子字段</el-button>
          <div class="field-count">
            共 {{ subFieldDialog.parentField?.fields?.length || 0 }} 个子字段
          </div>
        </div>

        <el-table
          :data="subFieldDialog.parentField?.fields || []"
          border
          stripe
          class="sub-field-table"
          empty-text="暂无子字段，点击上方按钮添加"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column label="字段名称" min-width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.name"
                placeholder="字段名称"
                size="small"
                @input="updateSubField($index, row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="字段类型" width="140">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.type"
                placeholder="类型"
                size="small"
                @change="updateSubField($index, row)"
              >
                <el-option v-for="t in allowedSubFieldTypes" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="必填" width="80" align="center">
            <template #default="{ row, $index }">
              <el-switch
                v-model="row.required"
                size="small"
                @change="updateSubField($index, row)"
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
                @input="updateSubField($index, row)"
              />
              <el-input-number
                v-else-if="row.type === 'number'"
                v-model="row.example"
                placeholder="示例数字"
                size="small"
                @change="updateSubField($index, row)"
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
                @change="updateSubField($index, row)"
                style="width: 100%"
              />
              <el-switch
                v-else-if="row.type === 'boolean'"
                v-model="row.example"
                size="small"
                @change="updateSubField($index, row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="140" align="center" fixed="right">
            <template #default="{ $index }">
              <el-button size="small" :icon="ArrowUp" @click="moveSubFieldUp($index)" :disabled="$index === 0" circle />
              <el-button size="small" :icon="ArrowDown" @click="moveSubFieldDown($index)" :disabled="$index >= (subFieldDialog.parentField?.fields?.length || 0) - 1" circle />
              <el-button size="small" type="danger" :icon="Delete" @click="deleteSubField($index)" circle />
            </template>
          </el-table-column>
        </el-table>

        <el-alert class="sub-field-tip" type="info" :closable="false" show-icon>
          <template #title>
            提示：对象的子字段仅支持简单类型（文本、数字、日期、布尔值），不支持嵌套对象或数组。
          </template>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="closeSubFieldDialog">关闭</el-button>
      </template>
    </el-dialog>

    <!-- JSON 预览对话框 -->
    <el-dialog
      v-model="showJson"
      title="表单结构 JSON"
      width="65%"
    >
      <div class="json-container">
        <pre>{{ JSON.stringify(formData.structure, null, 2) }}</pre>
      </div>
      <template #footer>
        <el-button @click="showJson = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowUp, ArrowDown, Delete, Setting } from '@element-plus/icons-vue';
import { useFormsStore } from '../../stores/forms';
import { formsService } from '../../services/formsService';
import FormPreview from './FormPreview.vue';
import { getUserInfo } from '../../services/api';

const router = useRouter();
const route = useRoute();
const formsStore = useFormsStore();

const isEdit = computed(() => !!route.params.id);
const showPreview = ref(false);
const showJson = ref(false);
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const dialogWidth = computed(() => (viewportWidth.value < 768 ? '95%' : '70%'));

const formData = reactive({
  name: '',
  extractionMode: 'single', // 'single' or 'multiple'
  visibility: 'public', // 'public' or 'personal'
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

// Sub-field ID generator
let subFieldIdCounter = 1;
const generateSubFieldId = () => `sub_${Date.now()}_${subFieldIdCounter++}`;

// 子字段可选类型（过滤掉 object/array）
const allowedSubFieldTypes = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '布尔值', value: 'boolean' }
];

// 子字段编辑对话框状态
const subFieldDialog = reactive({
  visible: false,
  parentIndex: -1,
  parentField: null
});

// Initialize form data
onMounted(async () => {
  if (isEdit.value) {
    await loadForm();
  } else {
    resetForm();
  }
  // listen viewport resize for responsive dialog width
  const onResize = () => { viewportWidth.value = window.innerWidth; };
  window.addEventListener('resize', onResize);
  // store for cleanup
  resizeHandler.value = onResize;
});

const resizeHandler = ref(null);

onUnmounted(() => {
  if (resizeHandler.value) {
    window.removeEventListener('resize', resizeHandler.value);
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
  formData.extractionMode = 'single';
  formData.visibility = 'public';
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

// ---- 子字段管理逻辑 ----
/**
 * 打开对象字段的子字段管理对话框
 * 将对话框与父字段建立引用关系，所有更改实时写入父字段的 fields 数组
 * @param {number} index 顶层字段索引
 * @param {Object} field 顶层对象字段
 */
function openSubFieldDialog(index, field) {
  subFieldDialog.parentIndex = index;
  subFieldDialog.parentField = field;
  if (!field.fields) field.fields = [];
  subFieldDialog.visible = true;
}

function closeSubFieldDialog() {
  subFieldDialog.visible = false;
  // 提示保存结果
  if (subFieldDialog.parentField?.fields) {
    ElMessage.success(`已保存 ${subFieldDialog.parentField.fields.length} 个子字段`);
  }
  subFieldDialog.parentIndex = -1;
  subFieldDialog.parentField = null;
}

function addSubField() {
  if (!subFieldDialog.parentField) return;
  const newField = {
    id: generateSubFieldId(),
    name: `子字段${(subFieldDialog.parentField.fields?.length || 0) + 1}`,
    type: 'text',
    example: '',
    required: false
  };
  if (!Array.isArray(subFieldDialog.parentField.fields)) {
    subFieldDialog.parentField.fields = [];
  }
  subFieldDialog.parentField.fields.push(newField);
}

function updateSubField(index, updatedField) {
  const list = subFieldDialog.parentField?.fields;
  if (!list || index < 0 || index >= list.length) return;
  list[index] = { ...updatedField };
}

async function deleteSubField(index) {
  const list = subFieldDialog.parentField?.fields;
  if (!list || index < 0 || index >= list.length) return;
  try {
    await ElMessageBox.confirm('确定删除该子字段吗？此操作无法撤销。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    list.splice(index, 1);
    ElMessage.success('子字段已删除');
  } catch {
    // user cancelled deletion
  }
}

function moveSubFieldUp(index) {
  const list = subFieldDialog.parentField?.fields;
  if (!list || index <= 0) return;
  const tmp = list[index];
  list[index] = list[index - 1];
  list[index - 1] = tmp;
}

function moveSubFieldDown(index) {
  const list = subFieldDialog.parentField?.fields;
  if (!list || index >= list.length - 1) return;
  const tmp = list[index];
  list[index] = list[index + 1];
  list[index + 1] = tmp;
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
    // 个人可见：携带 userId；公开：不带 userId
    if (formData.visibility === 'personal') {
      const me = getUserInfo() || {};
      const uid = me.id || me.userId || me.uid || me.userID;
      if (uid != null && uid !== '') payload.userId = uid;
    }

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
  // 默认加载 Sample B
  onSampleCommand('B');
}

function onSampleCommand(cmd) {
  ElMessageBox.confirm(
    '加载示例将覆盖当前设计，是否继续？',
    '确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    let sample;
    if (cmd === 'A' && typeof formsStore.generateSampleFormA === 'function') {
      sample = formsStore.generateSampleFormA();
    } else if (cmd === 'C' && typeof formsStore.generateSampleFormC === 'function') {
      sample = formsStore.generateSampleFormC();
    } else if (typeof formsStore.generateSampleFormB === 'function') {
      sample = formsStore.generateSampleFormB();
    } else {
      sample = formsStore.generateSampleForm();
    }
    formData.name = sample.formName;
    formData.structure = { ...sample };
    addFieldIds(formData.structure.fields);
    ElMessage.success(`示例表单已加载（${cmd || 'B'}）`);
  }).catch(() => {
    // User cancelled
  });
}

function openJsonDialog() {
  showJson.value = true;
}
</script>

<style scoped>
.form-designer {
  padding: 24px;
  background-color: var(--background-page);
  min-height: calc(100vh - 60px);
}

.designer-header {
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--background-color);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 8px rgba(var(--color-black-rgb), 0.06);
}

.designer-header h2 {
  margin: 0;
  color: var(--text-color-primary);
  font-size: var(--font-size-xxl);
  font-weight: 600;
}

.text-right {
  text-align: right;
}

.designer-card,
.preview-card,
.json-card {
  margin-bottom: 20px;
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 8px rgba(var(--color-black-rgb), 0.06);
  background: var(--background-color);
}

.designer-card :deep(.el-card__header) {
  background: var(--background-color-light);
  border-bottom: 2px solid var(--border-color);
  font-weight: 600;
  color: var(--text-color-primary);
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
  border-bottom: 2px solid var(--border-color);
}

.section-header h3 {
  margin: 0;
  color: var(--text-color-primary);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.fields-table-container {
  background: var(--background-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.fields-table {
  border-radius: var(--border-radius-md);
}

.fields-table :deep(.el-table__header) {
  background: var(--background-color-light);
}

.fields-table :deep(.el-table__header th) {
  background: var(--background-color-light);
  color: var(--text-color-primary);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.fields-table :deep(.el-table__row:hover) {
  background: var(--background-info-pale);
}

.fields-table :deep(.el-table__body tr.el-table__row--striped) {
  background: var(--background-color-alt);
}

.empty-fields {
  padding: 60px 0;
  text-align: center;
  background: var(--background-color);
  border-radius: var(--border-radius-md);
  margin-top: 16px;
}

.json-container {
  max-height: 300px;
  overflow-y: auto;
  background-color: var(--background-color-light);
  padding: 16px;
  border-radius: var(--border-radius-md);
  font-family: 'Courier New', monospace;
  font-size: var(--font-size-xs);
  line-height: 1.5;
  border: var(--border-width-thin) solid var(--border-color);
}

.error {
  border-color: var(--status-danger-strong) !important;
}

.error-text {
  color: var(--status-danger-strong);
  font-size: var(--font-size-xs);
  margin-top: 4px;
}

.preview-card :deep(.el-card__body) {
  max-height: 400px;
  overflow-y: auto;
}

/* 子字段对话框样式 */
.sub-field-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sub-field-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 2px solid var(--border-color);
}

.field-count {
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
  font-weight: 500;
}

.sub-field-table {
  border-radius: var(--border-radius-md);
}

.object-field-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%);
  border-color: var(--primary-color);
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, var(--primary-color-dark) 0%, var(--primary-color-darker) 100%);
  border-color: var(--primary-color-dark);
}

:deep(.el-radio-group .el-radio) {
  margin-right: 16px;
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--primary-color);
}
</style>