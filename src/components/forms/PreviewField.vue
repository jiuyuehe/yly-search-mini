<template>
  <div class="preview-field">
    <div class="field-label">
      {{ field.name }}
      <span v-if="field.required" class="required-mark">*</span>
      <span v-if="field.type !== 'text'" class="field-type">({{ getTypeLabel(field.type) }})</span>
    </div>
    
    <!-- Text Field -->
    <el-input 
      v-if="field.type === 'text'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :placeholder="field.example || '请输入' + field.name"
      readonly
    />
    
    <!-- Number Field -->
    <el-input-number 
      v-else-if="field.type === 'number'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :placeholder="field.example || '请输入数字'"
      style="width: 100%"
      readonly
    />
    
    <!-- Date Field -->
    <el-date-picker 
      v-else-if="field.type === 'date'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      type="date"
      :placeholder="field.example || '选择日期'"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      style="width: 100%"
      readonly
    />
    
    <!-- Boolean Field -->
    <el-switch 
      v-else-if="field.type === 'boolean'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      disabled
    />
    
    <!-- Object Field -->
    <div v-else-if="field.type === 'object'" class="object-field">
      <div class="object-container">
        <div 
          v-for="(subField, subIndex) in field.fields" 
          :key="subField.id || subIndex"
          class="sub-field"
        >
          <PreviewField 
            :field="subField"
            :model-value="modelValue && modelValue[subField.name]"
            :show-examples="showExamples"
            @update:model-value="updateObjectField(subField.name, $event)"
          />
        </div>
      </div>
    </div>
    
    <!-- Array Field -->
    <div v-else-if="field.type === 'array'" class="array-field">
      <div class="array-header">
        <span class="array-label">{{ field.name }} 列表</span>
        <el-button size="small" disabled>添加项目</el-button>
      </div>
      
      <div class="array-container">
        <div 
          v-for="(item, itemIndex) in (modelValue || [{}])" 
          :key="itemIndex"
          class="array-item"
        >
          <div class="array-item-header">
            <span>项目 {{ itemIndex + 1 }}</span>
            <el-button size="small" type="danger" disabled>删除</el-button>
          </div>
          
          <div v-if="field.itemType === 'object' && field.fields" class="array-item-content">
            <div 
              v-for="(subField, subIndex) in field.fields" 
              :key="subField.id || subIndex"
              class="sub-field"
            >
              <PreviewField 
                :field="subField"
                :model-value="item && item[subField.name]"
                :show-examples="showExamples"
                @update:model-value="updateArrayField(itemIndex, subField.name, $event)"
              />
            </div>
          </div>
          
          <div v-else class="simple-array-item">
            <el-input 
              :model-value="item"
              :placeholder="'请输入' + field.name"
              readonly
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Unknown Field Type -->
    <div v-else class="unknown-field">
      <el-alert
        :title="'未知字段类型: ' + field.type"
        type="warning"
        :closable="false"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  modelValue: {
    type: [String, Number, Boolean, Object, Array],
    default: null
  },
  showExamples: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

function getTypeLabel(type) {
  const typeLabels = {
    text: '文本',
    number: '数字',
    date: '日期',
    boolean: '布尔值',
    object: '对象',
    array: '数组'
  };
  return typeLabels[type] || type;
}

function updateObjectField(subFieldName, value) {
  const newValue = { ...props.modelValue };
  newValue[subFieldName] = value;
  emit('update:modelValue', newValue);
}

function updateArrayField(itemIndex, subFieldName, value) {
  const newArray = [...(props.modelValue || [])];
  if (!newArray[itemIndex]) {
    newArray[itemIndex] = {};
  }
  newArray[itemIndex] = { ...newArray[itemIndex] };
  newArray[itemIndex][subFieldName] = value;
  emit('update:modelValue', newArray);
}
</script>

<style scoped>
.preview-field {
  margin-bottom: 15px;
}

.field-label {
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-color-regular);
  font-size: var(--font-size-md);
}

.required-mark {
  color: var(--status-danger);
  margin-left: 4px;
}

.field-type {
  color: var(--text-color-placeholder);
  font-size: var(--font-size-xs);
  font-weight: normal;
  margin-left: 8px;
}

.object-field, .array-field {
  border-radius: 6px;
  padding: 15px;
  background-color: #fafbfc;
}

.object-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sub-field {
  padding: 10px;
  background-color: white;
  border-radius: var(--border-radius-sm);
  border: var(--border-width-thin) solid #f0f0f0;
}

.array-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: var(--border-width-thin) solid #e4e7ed;
}

.array-label {
  font-weight: 600;
  color: var(--text-color-heading);
}

.array-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.array-item {
  border-radius: 6px;
  padding: 15px;
  background-color: white;
}

.array-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: var(--border-width-thin) solid #f0f0f0;
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-color-regular);
}

.array-item-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.simple-array-item {
  width: 100%;
}

.unknown-field {
  padding: 10px;
}
</style>