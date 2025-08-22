<template>
  <el-card class="field-designer" :class="{ 'nested-field': isNested }">
    <template #header>
      <div class="field-header">
        <span class="field-title">{{ field.name || '未命名字段' }}</span>
        <div class="field-actions">
          <el-button 
            size="small" 
            :icon="ArrowUp" 
            @click="$emit('moveUp', index)"
            :disabled="index === 0"
          />
          <el-button 
            size="small" 
            :icon="ArrowDown" 
            @click="$emit('moveDown', index)"
          />
          <el-button 
            size="small" 
            type="danger" 
            :icon="Delete" 
            @click="deleteField"
          />
        </div>
      </div>
    </template>

    <el-form :model="localField" label-width="80px" size="small">
      <el-row :gutter="15">
        <el-col :span="8">
          <el-form-item label="字段名称" required>
            <el-input 
              v-model="localField.name" 
              placeholder="字段名称"
              @input="updateField"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="字段类型" required>
            <el-select 
              v-model="localField.type" 
              placeholder="选择类型"
              @change="onTypeChange"
            >
              <el-option 
                v-for="type in fieldTypes" 
                :key="type.value" 
                :label="type.label" 
                :value="type.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="必填项">
            <el-switch 
              v-model="localField.required" 
              @change="updateField"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="15">
        <el-col :span="16">
          <el-form-item label="示例值">
            <el-input 
              v-if="localField.type === 'text'"
              v-model="localField.example" 
              placeholder="示例文本"
              @input="updateField"
            />
            <el-input-number 
              v-else-if="localField.type === 'number'"
              v-model="localField.example" 
              placeholder="示例数字"
              @change="updateField"
              style="width: 100%"
            />
            <el-date-picker 
              v-else-if="localField.type === 'date'"
              v-model="localField.example" 
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="updateField"
              style="width: 100%"
            />
            <el-switch 
              v-else-if="localField.type === 'boolean'"
              v-model="localField.example" 
              @change="updateField"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="数组类型" v-if="localField.type === 'array'">
            <el-select 
              v-model="localField.itemType" 
              placeholder="数组元素类型"
              @change="onArrayTypeChange"
            >
              <el-option label="文本" value="text" />
              <el-option label="数字" value="number" />
              <el-option label="对象" value="object" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- Nested Fields for Object and Array Types -->
      <div v-if="showNestedFields" class="nested-fields">
        <div class="nested-header">
          <h4>{{ localField.type === 'array' ? '数组元素字段' : '对象字段' }}</h4>
          <el-button size="small" type="primary" @click="addNestedField">
            添加字段
          </el-button>
        </div>

        <div class="nested-container">
          <div 
            v-for="(nestedField, nestedIndex) in localField.fields" 
            :key="nestedField.id || nestedIndex"
            class="nested-field-item"
          >
            <FieldDesigner 
              :field="nestedField"
              :index="nestedIndex"
              :is-nested="true"
              @update="updateNestedField"
              @delete="deleteNestedField"
              @moveUp="moveNestedFieldUp"
              @moveDown="moveNestedFieldDown"
            />
          </div>

          <div v-if="!localField.fields || localField.fields.length === 0" class="empty-nested">
            <el-empty description="暂无子字段" size="small" />
          </div>
        </div>
      </div>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { ArrowUp, ArrowDown, Delete } from '@element-plus/icons-vue';

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  isNested: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update', 'delete', 'moveUp', 'moveDown']);

const fieldTypes = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '布尔值', value: 'boolean' },
  { label: '对象', value: 'object' },
  { label: '数组', value: 'array' }
];

const localField = reactive({ ...props.field });

// Watch for external changes
watch(() => props.field, (newField) => {
  Object.assign(localField, newField);
}, { deep: true });

const showNestedFields = computed(() => {
  return localField.type === 'object' || 
         (localField.type === 'array' && localField.itemType === 'object');
});

// Field ID generator
let nestedFieldIdCounter = 1;
const generateNestedFieldId = () => `nested_${nestedFieldIdCounter++}`;

onMounted(() => {
  // Ensure fields array exists for object and array types
  if (showNestedFields.value && !localField.fields) {
    localField.fields = [];
  }
});

function updateField() {
  emit('update', props.index, { ...localField });
}

function deleteField() {
  emit('delete', props.index);
}

function onTypeChange() {
  // Reset type-specific properties
  if (localField.type === 'object' || 
      (localField.type === 'array' && localField.itemType === 'object')) {
    if (!localField.fields) {
      localField.fields = [];
    }
  } else {
    delete localField.fields;
    delete localField.itemType;
  }
  
  // Reset example value
  if (localField.type === 'number') {
    localField.example = 0;
  } else if (localField.type === 'boolean') {
    localField.example = false;
  } else if (localField.type === 'date') {
    localField.example = '';
  } else {
    localField.example = '';
  }
  
  updateField();
}

function onArrayTypeChange() {
  if (localField.type === 'array') {
    if (localField.itemType === 'object') {
      if (!localField.fields) {
        localField.fields = [];
      }
    } else {
      delete localField.fields;
    }
  }
  updateField();
}

function addNestedField() {
  if (!localField.fields) {
    localField.fields = [];
  }
  
  const newNestedField = {
    id: generateNestedFieldId(),
    name: `子字段${localField.fields.length + 1}`,
    type: 'text',
    example: '',
    required: false
  };
  
  localField.fields.push(newNestedField);
  updateField();
}

function updateNestedField(nestedIndex, updatedNestedField) {
  if (nestedIndex >= 0 && nestedIndex < localField.fields.length) {
    localField.fields[nestedIndex] = { ...updatedNestedField };
    updateField();
  }
}

function deleteNestedField(nestedIndex) {
  if (nestedIndex >= 0 && nestedIndex < localField.fields.length) {
    localField.fields.splice(nestedIndex, 1);
    updateField();
  }
}

function moveNestedFieldUp(nestedIndex) {
  if (nestedIndex > 0) {
    const field = localField.fields[nestedIndex];
    localField.fields.splice(nestedIndex, 1);
    localField.fields.splice(nestedIndex - 1, 0, field);
    updateField();
  }
}

function moveNestedFieldDown(nestedIndex) {
  if (nestedIndex < localField.fields.length - 1) {
    const field = localField.fields[nestedIndex];
    localField.fields.splice(nestedIndex, 1);
    localField.fields.splice(nestedIndex + 1, 0, field);
    updateField();
  }
}
</script>

<style scoped>
.field-designer {
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
}

.field-designer:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.field-designer.nested-field {
  margin: 10px 0;
  background-color: #f8f9fa;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-title {
  font-weight: 600;
  color: #303133;
}

.field-actions {
  display: flex;
  gap: 5px;
}

.nested-fields {
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px dashed #c0c4cc;
}

.nested-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.nested-header h4 {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.nested-container {
  max-height: 400px;
  overflow-y: auto;
}

.nested-field-item {
  margin-bottom: 10px;
}

.empty-nested {
  padding: 20px;
  text-align: center;
}

.el-form-item {
  margin-bottom: 15px;
}

.el-card :deep(.el-card__body) {
  padding: 15px;
}
</style>