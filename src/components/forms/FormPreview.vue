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
  }
});

const formData = reactive({});

// Initialize form data
watch(() => [props.structure, props.initialData], ([newStructure, newInitialData]) => {
  if (newStructure && newStructure.fields) {
    initializeFormData(newStructure.fields, newInitialData);
  }
}, { immediate: true, deep: true });

function initializeFormData(fields, initialData) {
  fields.forEach(field => {
    // Use initialData if provided, otherwise use default/example values
    const initialValue = initialData?.[field.name]
    
    if (field.type === 'object' && field.fields) {
      formData[field.name] = initialValue || {};
      field.fields.forEach(subField => {
        if (!formData[field.name][subField.name]) {
          formData[field.name][subField.name] = getDefaultValue(subField);
        }
      });
    } else if (field.type === 'array' && field.fields) {
      formData[field.name] = initialValue || [{}];
      if (Array.isArray(formData[field.name]) && formData[field.name].length > 0) {
        field.fields.forEach(subField => {
          if (!formData[field.name][0][subField.name]) {
            formData[field.name][0][subField.name] = getDefaultValue(subField);
          }
        });
      }
    } else {
      formData[field.name] = initialValue !== undefined ? initialValue : getDefaultValue(field);
    }
  });
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
  padding: 15px;
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