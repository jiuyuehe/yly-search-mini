<template>
  <div class="extraction-result-form">
    <el-form :model="formData" label-width="120px" label-position="top" class="compact-form">
      <ResultField
        v-for="(field, index) in formStructure.fields"
        :key="field.id || field.name || index"
        :field="enrichedField(field)"
        :model-value="formData[field.name]"
        :editable="editable"
        @update:model-value="updateFieldValue(field.name, $event)"
      />
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

// formData 只存放字段值；附加信息（置信度、notFound、snippet）通过 enrichedField 传递
const formData = reactive({});
const fieldMetaMap = ref({});

// Initialize form data
onMounted(() => {
  initializeFormData();
});

watch(() => props.extractedData, () => {
  initializeFormData();
}, { deep: true });

function initializeFormData() {
  // 清空旧值
  Object.keys(formData).forEach(k=> delete formData[k]);
  fieldMetaMap.value = {};

  const raw = props.extractedData || {};
  // 兼容后端返回整体：{ code, data:{ formId, formName, fields:[...] }} 或直接 fields 数组
  const fieldsArr = Array.isArray(raw.fields) ? raw.fields : Array.isArray(raw.data?.fields) ? raw.data.fields : [];

  // 构建 name->meta 映射
  fieldsArr.forEach(f=>{
    if(!f || !f.name) return;
    fieldMetaMap.value[f.name] = {
      confidence: f.confidence,
      notFound: !!f.notFound,
      offset: f.offset,
      snippet: f.snippet
    };
  });

  // 只写入表单结构中定义的字段值
  if (props.formStructure && Array.isArray(props.formStructure.fields)) {
    props.formStructure.fields.forEach(field => {
      const meta = fieldMetaMap.value[field.name];
      if(meta){
        formData[field.name] = fieldsArr.find(f=>f.name===field.name)?.value ?? getDefaultValue(field);
      } else {
        formData[field.name] = getDefaultValue(field);
      }
    });
  }
}

function enrichedField(field){
  const meta = fieldMetaMap.value[field.name] || {};
  return { ...field, _confidence: meta.confidence, _notFound: meta.notFound, _snippet: meta.snippet, _offset: meta.offset };
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
.extraction-result-form { padding: 4px 2px; background:#fff; }
.compact-form :deep(.result-field){ margin:4px 0; padding:8px 10px; border:1px solid #ebeef5; border-radius:4px; background:#fff; }
.compact-form :deep(.result-field:last-child){ margin-bottom:0; }
</style>