<template>
  <div class="extraction-result-form">
    <el-form :model="formData" label-width="120px" label-position="top">
      <div 
        v-for="(field, index) in formStructure.fields" 
        :key="field.id || index"
        class="result-field"
      >
        <ResultField 
          :field="field" 
          :model-value="formData[field.name]"
          :editable="editable"
          @update:model-value="updateFieldValue(field.name, $event)"
        />
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import ResultField from './ResultField.vue';

const props = defineProps({
  formStructure: {
    type: Object,
    required: true
  },
  extractedData: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update']);

const formData = reactive({});

// Initialize form data
onMounted(() => {
  initializeFormData();
});

watch(() => props.extractedData, () => {
  initializeFormData();
}, { deep: true });

function initializeFormData() {
  // Clear existing data
  Object.keys(formData).forEach(key => {
    delete formData[key];
  });
  
  // Initialize with extracted data
  if (props.extractedData) {
    Object.assign(formData, props.extractedData);
  }
  
  // Ensure all form fields have values
  if (props.formStructure && props.formStructure.fields) {
    props.formStructure.fields.forEach(field => {
      if (formData[field.name] === undefined) {
        formData[field.name] = getDefaultValue(field);
      }
    });
  }
}

function getDefaultValue(field) {
  switch (field.type) {
    case 'object':
      return {};
    case 'array':
      return [];
    case 'number':
      return 0;
    case 'boolean':
      return false;
    default:
      return '';
  }
}

function updateFieldValue(fieldName, value) {
  formData[fieldName] = value;
  emit('update', { ...formData });
}
</script>

<style scoped>
.extraction-result-form {
  padding: 15px;
  background-color: #fafbfc;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.result-field {
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.result-field:last-child {
  margin-bottom: 0;
}
</style>