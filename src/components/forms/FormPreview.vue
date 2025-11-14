<template>
  <div class="form-preview">
    <div v-if="!structure || !structure.fields || structure.fields.length === 0" class="empty-preview">
      <el-empty description="暂无表单字段" />
    </div>
    
    <div v-else>
      <h3 v-if="structure.formName" class="form-title">{{ structure.formName }}</h3>
      
      <el-form :model="formData" label-width="120px" label-position="top">
        <div 
          v-for="(field, index) in structure.fields" 
          :key="field.id || index"
          class="preview-field"
        >
          <PreviewField 
            :field="field" 
            :model-value="formData[field.name]"
            :show-examples="showExamples"
            :editable="editable"
            @update:model-value="updateFieldValue(field.name, $event)"
          />
        </div>
      </el-form>
      
      <div v-if="showExamples" class="preview-note">
        <el-alert
          title="预览说明"
          description="此为表单预览效果，显示了各字段的示例值。实际使用时，这些字段将由AI自动填充。"
          type="info"
          :closable="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
import PreviewField from './PreviewField.vue';

const props = defineProps({
  structure: {
    type: Object,
    default: () => ({ fields: [] })
  },
  showExamples: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: Object,
    default: null
  },
  editable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue'])

const formData = reactive({});

// 初始化表单预览数据
// 注意：
// 1）props.structure.fields 描述的是字段定义，是一个数组，每一项包含字段名称/类型/子字段列表。（来自表单模板）
// 2）props.initialData 是实际填充的 JSON 对象，key->value 的扁平结构（来自提取结果）。
// 因此需要在初始赋值时把字段定义和实际值进行映射：普通字段直接取 initialData 字段值；
// 对象类型字段需要用 defs（数组）来遍历子字段，而 initialData 里对应的值可能是对象也可能是数组（对象数组情形），
// 所以会将 initialData 中的子对象扁平化到 defs 指定的顺序里去，确保表单预览里的子字段与 API 返回保持一致。
watch(() => [props.structure, props.initialData], ([newStructure, newInitialData]) => {
  if (newStructure && newStructure.fields) {
    initializeFormData(newStructure.fields, newInitialData);
  }
}, { immediate: true, deep: true });

function initializeFormData(fields, initialData) {
  fields.forEach(field => {
    const initialValue = initialData?.[field.name]

    if (field.type === 'object' && field.fields) {
      formData[field.name] = buildObjectValue(field.fields, initialValue)
    } else if (field.type === 'array' && field.fields) {
      formData[field.name] = buildArrayValue(field.fields, initialValue)
    } else {
      formData[field.name] = initialValue !== undefined ? initialValue : getDefaultValue(field)
    }
  })
}

function buildObjectValue(defs, sourceValue) {
  const baseValue = Array.isArray(sourceValue) ? sourceValue[0] || {} : (sourceValue || {})
  const result = {}
  defs.forEach(subField => {
    const nestedValue = baseValue?.[subField.name]
    result[subField.name] = nestedValue !== undefined ? nestedValue : getDefaultValue(subField)
  })
  return result
}

function buildArrayValue(defs, sourceValue) {
  const arraySource = Array.isArray(sourceValue) && sourceValue.length ? sourceValue : [{}]
  const result = arraySource.map(item => ({ ...item }))
  result.forEach(item => {
    defs.forEach(subField => {
      const nestedValue = item?.[subField.name]
      if (nestedValue !== undefined) {
        item[subField.name] = nestedValue
      } else if (item[subField.name] === undefined) {
        item[subField.name] = getDefaultValue(subField)
      }
    })
  })
  return result
}

function getDefaultValue(field) {
  if (props.showExamples && field.example !== undefined && field.example !== null) {
    return field.example;
  }
  
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

function updateFieldValue(fieldName, value) {
  formData[fieldName] = value;
  // Emit the updated formData
  emit('update:modelValue', { ...formData })
}
</script>

<style scoped>
.form-preview {
  padding: 15px;
}

.empty-preview {
  padding: 40px 0;
  text-align: center;
}

.form-title {
  margin: 0 0 20px 0;
  color: var(--text-color-heading);
  font-size: var(--font-size-xl);
  font-weight: 600;
  text-align: center;
  padding-bottom: 15px;
  border-bottom: var(--border-width-thin) solid var(--border-color-muted);
}

.preview-field {
  margin-bottom: 20px;
  background-color: #fafafa;
  border-radius: 6px;
}

.preview-note {
  margin-top: 20px;
}

.el-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-color-regular);
}

.el-form :deep(.el-form-item) {
  margin-bottom: 15px;
}
</style>