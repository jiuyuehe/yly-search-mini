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
let lastSignature = '';

// Initialize form data
onMounted(() => {
  initializeFormData();
});

watch(() => props.extractedData, () => {
  initializeFormData();
}, { deep: true });

function makeSignature(raw, structure){
  try { return JSON.stringify({
    names: (Array.isArray(raw)?raw:raw?.fields||raw?.data?.fields||[]).map(f=>f.name),
    structure: structure?.fields?.map(f=>f.name)
  }); } catch { return Date.now()+''; }
}

function initializeFormData() {
  const rawWrapper = props.extractedData || {};
  const fieldsArr = Array.isArray(rawWrapper.fields) ? rawWrapper.fields : Array.isArray(rawWrapper.data?.fields) ? rawWrapper.data.fields : [];
  const sig = makeSignature(fieldsArr, props.formStructure);
  // 如果字段集合未变化，不强制重置（避免切换编辑状态清空）
  const firstInit = !lastSignature;
  const sameShape = lastSignature && sig === lastSignature;
  if(!firstInit && sameShape) return; // 保留现有用户编辑
  lastSignature = sig;

  Object.keys(formData).forEach(k=> delete formData[k]);
  fieldMetaMap.value = {};
  fieldsArr.forEach(f=>{
    if(!f || !f.name) return;
    fieldMetaMap.value[f.name] = { confidence: f.confidence, notFound: !!f.notFound, offset: f.offset, snippet: f.snippet };
  });
  if (props.formStructure && Array.isArray(props.formStructure.fields)) {
    props.formStructure.fields.forEach(field => {
      const meta = fieldMetaMap.value[field.name];
      const found = fieldsArr.find(f=>f.name===field.name);
      formData[field.name] = meta ? (found?.value ?? getDefaultValue(field)) : getDefaultValue(field);
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