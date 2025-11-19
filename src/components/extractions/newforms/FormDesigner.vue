<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑表单' : '创建表单'"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="designer-container">
      <!-- 表单基本信息 -->
      <el-form :model="formData" label-width="100px" class="form-meta">
        <el-form-item label="表单名称" required>
          <el-input v-model="formData.name" placeholder="请输入表单名称" />
        </el-form-item>
        <el-form-item label="表单描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入表单描述"
          />
        </el-form-item>
      </el-form>

      <!-- 字段配置表格 -->
      <div class="schema-section">
        <div class="section-header">
          <h3>字段配置</h3>
          <div class="section-actions">
            <el-button @click="handleAddField" :icon="Plus" type="primary">
              添加字段
            </el-button>
            <el-button @click="handlePreview" :icon="View">
              预览表单
            </el-button>
            <el-button @click="handleImportSchema" :icon="Upload">
              导入Schema
            </el-button>
            <el-button @click="handleExportSchema" :icon="Download">
              导出Schema
            </el-button>
          </div>
        </div>

        <el-table :data="formData.schema" border style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          
          <el-table-column label="字段标签" width="150">
            <template #default="{ row }">
              <el-input v-model="row.label" placeholder="字段标签" />
            </template>
          </el-table-column>
          
          <el-table-column label="字段Key" width="150">
            <template #default="{ row }">
              <el-input v-model="row.key" placeholder="字段key" />
            </template>
          </el-table-column>
          
          <el-table-column label="字段类型" width="180">
            <template #default="{ row }">
              <el-select v-model="row.type" placeholder="选择类型" @change="handleTypeChange(row)">
                <el-option
                  v-for="option in fieldTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="配置" width="200">
            <template #default="{ row }">
              <!-- 选择类型需要配置选项 -->
              <el-button
                v-if="isSelectType(row.type)"
                size="small"
                @click="handleConfigOptions(row)"
              >
                配置选项
              </el-button>
              <!-- 对象类型需要配置子字段 -->
              <el-button
                v-else-if="row.type === 'object'"
                size="small"
                @click="handleConfigChildren(row)"
              >
                配置子字段
              </el-button>
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="默认值" width="150">
            <template #default="{ row }">
              <el-input
                v-if="!isSelectType(row.type) && row.type !== 'object' && row.type !== 'file-upload'"
                v-model="row.defaultValue"
                placeholder="默认值"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="必填" width="80">
            <template #default="{ row }">
              <el-checkbox v-model="row.required" />
            </template>
          </el-table-column>
          
          <el-table-column label="占位符" width="150">
            <template #default="{ row }">
              <el-input v-model="row.placeholder" placeholder="占位符" />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleDeleteField($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>

    <!-- 配置选项对话框 -->
    <el-dialog
      v-model="optionsDialogVisible"
      title="配置选项"
      width="500px"
      append-to-body
    >
      <div class="options-config">
        <div v-for="(option, index) in currentFieldOptions" :key="index" class="option-item">
          <el-input v-model="option.label" placeholder="选项标签" style="width: 45%" />
          <el-input v-model="option.value" placeholder="选项值" style="width: 45%" />
          <el-button :icon="Delete" @click="handleDeleteOption(index)" />
        </div>
        <el-button @click="handleAddOption" :icon="Plus" style="width: 100%">
          添加选项
        </el-button>
      </div>
      <template #footer>
        <el-button @click="optionsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveOptions">确定</el-button>
      </template>
    </el-dialog>

    <!-- 配置子字段对话框 -->
    <el-dialog
      v-model="childrenDialogVisible"
      title="配置子字段"
      width="80%"
      append-to-body
    >
      <el-table :data="currentFieldChildren" border>
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column label="字段标签" width="150">
          <template #default="{ row }">
            <el-input v-model="row.label" placeholder="字段标签" />
          </template>
        </el-table-column>
        
        <el-table-column label="字段Key" width="150">
          <template #default="{ row }">
            <el-input v-model="row.key" placeholder="字段key" />
          </template>
        </el-table-column>
        
        <el-table-column label="字段类型" width="180">
          <template #default="{ row }">
            <el-select v-model="row.type" placeholder="选择类型">
              <el-option
                v-for="option in fieldTypeOptions.filter(o => o.value !== 'object')"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column label="默认值" width="150">
          <template #default="{ row }">
            <el-input v-model="row.defaultValue" placeholder="默认值" />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="100">
          <template #default="{ $index }">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDeleteChildField($index)"
            />
          </template>
        </el-table-column>
      </el-table>
      
      <el-button @click="handleAddChildField" :icon="Plus" style="width: 100%; margin-top: 10px">
        添加子字段
      </el-button>
      
      <template #footer>
        <el-button @click="childrenDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveChildren">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="表单预览"
      width="60%"
      append-to-body
    >
      <FormRenderer :schema="formData.schema" :model-value="{}" readonly />
    </el-dialog>

    <!-- 导入Schema -->
    <input
      ref="importFileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImportFile"
    />
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getFieldTypeOptions, exportSchemaToJson } from '../utils/formUtils'
import {
  Plus,
  Delete,
  View,
  Upload,
  Download
} from '@element-plus/icons-vue'
import FormRenderer from './FormRenderer.vue'

// Props
const props = defineProps({
  visible: Boolean,
  form: Object,
  storageMode: {
    type: String,
    default: 'localStorage', // 'localStorage' or 'api'
    validator: (value) => ['localStorage', 'api'].includes(value)
  }
})

// Emits
const emit = defineEmits(['update:visible', 'save'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const isEdit = computed(() => !!props.form)

const formData = ref({
  name: '',
  description: '',
  schema: []
})

const fieldTypeOptions = getFieldTypeOptions()

// 选项配置相关
const optionsDialogVisible = ref(false)
const currentFieldOptions = ref([])
const currentFieldForOptions = ref(null)

// 子字段配置相关
const childrenDialogVisible = ref(false)
const currentFieldChildren = ref([])
const currentFieldForChildren = ref(null)

// 预览相关
const previewDialogVisible = ref(false)

// 导入相关
const importFileInput = ref(null)

// 监听 form 变化，初始化表单数据
watch(() => props.form, (newForm) => {
  if (newForm) {
    formData.value = {
      name: newForm.name,
      description: newForm.description,
      schema: JSON.parse(JSON.stringify(newForm.schema))
    }
  } else {
    formData.value = {
      name: '',
      description: '',
      schema: []
    }
  }
}, { immediate: true })

// 判断是否为选择类型
const isSelectType = (type) => {
  return ['select-single', 'select-multiple', 'radio', 'checkbox'].includes(type)
}

// 添加字段
const handleAddField = () => {
  formData.value.schema.push({
    label: '',
    key: '',
    type: 'input-short',
    defaultValue: '',
    required: false,
    placeholder: ''
  })
}

// 删除字段
const handleDeleteField = (index) => {
  formData.value.schema.splice(index, 1)
}

// 字段类型改变
const handleTypeChange = (row) => {
  // 清除可能不适用的配置
  if (!isSelectType(row.type)) {
    delete row.options
  }
  if (row.type !== 'object') {
    delete row.children
  }
}

// 配置选项
const handleConfigOptions = (field) => {
  currentFieldForOptions.value = field
  currentFieldOptions.value = field.options ? JSON.parse(JSON.stringify(field.options)) : []
  optionsDialogVisible.value = true
}

// 添加选项
const handleAddOption = () => {
  currentFieldOptions.value.push({ label: '', value: '' })
}

// 删除选项
const handleDeleteOption = (index) => {
  currentFieldOptions.value.splice(index, 1)
}

// 保存选项
const handleSaveOptions = () => {
  if (currentFieldOptions.value.length === 0) {
    ElMessage.warning('至少添加一个选项')
    return
  }
  
  const invalidOption = currentFieldOptions.value.find(opt => !opt.label || !opt.value)
  if (invalidOption) {
    ElMessage.warning('请填写完整的选项标签和值')
    return
  }
  
  currentFieldForOptions.value.options = JSON.parse(JSON.stringify(currentFieldOptions.value))
  optionsDialogVisible.value = false
  ElMessage.success('选项配置已保存')
}

// 配置子字段
const handleConfigChildren = (field) => {
  currentFieldForChildren.value = field
  currentFieldChildren.value = field.children ? JSON.parse(JSON.stringify(field.children)) : []
  childrenDialogVisible.value = true
}

// 添加子字段
const handleAddChildField = () => {
  currentFieldChildren.value.push({
    label: '',
    key: '',
    type: 'input-short',
    defaultValue: ''
  })
}

// 删除子字段
const handleDeleteChildField = (index) => {
  currentFieldChildren.value.splice(index, 1)
}

// 保存子字段
const handleSaveChildren = () => {
  if (currentFieldChildren.value.length === 0) {
    ElMessage.warning('至少添加一个子字段')
    return
  }
  
  currentFieldForChildren.value.children = JSON.parse(JSON.stringify(currentFieldChildren.value))
  childrenDialogVisible.value = false
  ElMessage.success('子字段配置已保存')
}

// 预览表单
const handlePreview = () => {
  if (formData.value.schema.length === 0) {
    ElMessage.warning('请先添加字段')
    return
  }
  previewDialogVisible.value = true
}

// 导出Schema
const handleExportSchema = () => {
  if (formData.value.schema.length === 0) {
    ElMessage.warning('没有可导出的Schema')
    return
  }
  
  const schemaData = {
    name: formData.value.name || '未命名表单',
    description: formData.value.description,
    schema: formData.value.schema,
    version: '1.0.0'
  }
  
  exportSchemaToJson(schemaData, `${formData.value.name || 'form'}-schema.json`)
  ElMessage.success('Schema已导出')
}

// 导入Schema
const handleImportSchema = () => {
  importFileInput.value.click()
}

// 处理导入文件
const handleImportFile = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const schemaData = JSON.parse(e.target.result)
      if (schemaData.schema && Array.isArray(schemaData.schema)) {
        formData.value.name = schemaData.name || formData.value.name
        formData.value.description = schemaData.description || formData.value.description
        formData.value.schema = schemaData.schema
        ElMessage.success('Schema导入成功')
      } else {
        ElMessage.error('Schema格式不正确')
      }
    } catch (error) {
      ElMessage.error('文件解析失败')
    }
  }
  reader.readAsText(file)
  
  // 重置文件输入
  event.target.value = ''
}

// 保存表单
const handleSave = () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入表单名称')
    return
  }
  
  if (formData.value.schema.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }
  
  // 验证字段
  const invalidField = formData.value.schema.find(field => !field.label || !field.key)
  if (invalidField) {
    ElMessage.warning('请填写完整的字段标签和Key')
    return
  }
  
  emit('save', formData.value)
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.designer-container {
  padding: 10px 0;
}

.form-meta {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.schema-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.options-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
