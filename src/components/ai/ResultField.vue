<template>
  <div class="result-field">
    <div class="field-label">
      {{ field.name }}
      <span v-if="field.required" class="required-mark">*</span>
      <span class="field-type">({{ getTypeLabel(field.type) }})</span>
    </div>
    
    <!-- Text Field -->
    <el-input 
      v-if="field.type === 'text'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :readonly="!editable"
      :placeholder="'请输入' + field.name"
    />
    
    <!-- Number Field -->
    <el-input-number 
      v-else-if="field.type === 'number'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :readonly="!editable"
      :placeholder="'请输入数字'"
      style="width: 100%"
    />
    
    <!-- Date Field -->
    <el-date-picker 
      v-else-if="field.type === 'date'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      type="date"
      :placeholder="'选择日期'"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      style="width: 100%"
      :readonly="!editable"
    />
    
    <!-- Boolean Field -->
    <el-switch 
      v-else-if="field.type === 'boolean'"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :disabled="!editable"
    />
    
    <!-- Object Field -->
    <div v-else-if="field.type === 'object'" class="object-field">
      <div class="object-container">
        <div 
          v-for="(subField, subIndex) in field.fields" 
          :key="subField.id || subIndex"
          class="sub-field"
        >
          <ResultField 
            :field="subField"
            :model-value="modelValue && modelValue[subField.name]"
            :editable="editable"
            @update:model-value="updateObjectField(subField.name, $event)"
          />
        </div>
      </div>
    </div>
    
    <!-- Array Field -->
    <div v-else-if="field.type === 'array'" class="array-field">
      <div class="array-header">
        <span class="array-label">{{ field.name }} 列表</span>
        <el-button 
          v-if="editable" 
          size="small" 
          type="primary" 
          @click="addArrayItem"
        >
          添加项目
        </el-button>
      </div>
      
      <div class="array-container">
        <div 
          v-for="(item, itemIndex) in (modelValue || [])" 
          :key="itemIndex"
          class="array-item"
        >
          <div class="array-item-header">
            <span>项目 {{ itemIndex + 1 }}</span>
            <el-button 
              v-if="editable" 
              size="small" 
              type="danger" 
              @click="removeArrayItem(itemIndex)"
            >
              删除
            </el-button>
          </div>
          
          <div v-if="field.itemType === 'object' && field.fields" class="array-item-content">
            <div 
              v-for="(subField, subIndex) in field.fields" 
              :key="subField.id || subIndex"
              class="sub-field"
            >
              <ResultField 
                :field="subField"
                :model-value="item && item[subField.name]"
                :editable="editable"
                @update:model-value="updateArrayField(itemIndex, subField.name, $event)"
              />
            </div>
          </div>
          
          <div v-else class="simple-array-item">
            <el-input 
              :model-value="item"
              @update:model-value="updateSimpleArrayItem(itemIndex, $event)"
              :readonly="!editable"
              :placeholder="'请输入' + field.name"
            />
          </div>
        </div>
        
        <div v-if="!modelValue || modelValue.length === 0" class="empty-array">
          <el-empty description="暂无数据" size="small" />
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
  editable: {
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
  const newValue = { ...(props.modelValue || {}) };
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

function updateSimpleArrayItem(itemIndex, value) {
  const newArray = [...(props.modelValue || [])];
  newArray[itemIndex] = value;
  emit('update:modelValue', newArray);
}

function addArrayItem() {
  const newArray = [...(props.modelValue || [])];
  if (props.field.itemType === 'object' && props.field.fields) {
    const newItem = {};
    props.field.fields.forEach(subField => {
      newItem[subField.name] = getDefaultValue(subField);
    });
    newArray.push(newItem);
  } else {
    newArray.push('');
  }
  emit('update:modelValue', newArray);
}

function removeArrayItem(itemIndex) {
  const newArray = [...(props.modelValue || [])];
  newArray.splice(itemIndex, 1);
  emit('update:modelValue', newArray);
}

function getDefaultValue(field) {
  switch (field.type) {
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return '';
    default:
      return '';
  }
}
</script>

<style scoped>
.result-field {
  margin-bottom: 15px;
}

.field-label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}

.required-mark {
  color: #f56c6c;
  margin-left: 4px;
}

.field-type {
  color: #909399;
  font-size: 12px;
  font-weight: normal;
  margin-left: 8px;
}

.object-field, .array-field {
  border: 1px solid #e4e7ed;
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
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.array-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.array-label {
  font-weight: 600;
  color: #303133;
}

.array-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.array-item {
  border: 1px solid #d3d4d6;
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
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.array-item-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.simple-array-item {
  width: 100%;
}

.empty-array {
  padding: 20px;
  text-align: center;
}

.unknown-field {
  padding: 10px;
}
</style>