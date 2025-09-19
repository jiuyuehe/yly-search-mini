<template>
  <div class="extraction-result-form">
    <RecursiveNode
      v-if="isObject(rootData)"
      node-key="root"
      :schema="normalizedTemplate"
      v-model:data="rootData"
      :editable="editable"
      @change="onRootChange"
    />
    <el-alert v-else title="结果数据不是对象，无法渲染" type="warning" :closable="false" />
  </div>
</template>

<script setup>
import { reactive, watch, computed } from 'vue';
import RecursiveNode from './RecursiveNode.vue';

const props = defineProps({
  // 新命名
  templateStructure: { type: [String, Object], required: false, default: () => ({}) },
  resultData: { type: Object, required: false, default: () => ({}) },
  // 旧命名兼容（父组件可能仍使用 :form-structure :extracted-data）
  formStructure: { type: [String, Object], required: false, default: undefined },
  extractedData: { type: Object, required: false, default: undefined },
  editable: { type: Boolean, default: false }
});

// 统一选取模板 & 结果（优先新，次旧）
const effectiveTemplate = computed(() => {
  if (props.templateStructure && Object.keys(props.templateStructure || {}).length) return props.templateStructure;
  if (props.formStructure) return props.formStructure;
  return props.templateStructure || {};
});
const effectiveResult = computed(() => {
  if (props.resultData && Object.keys(props.resultData || {}).length) return props.resultData;
  if (props.extractedData) return props.extractedData;
  return props.resultData || {};
});

const emit = defineEmits(['update']);

// 规范化模板：结构模板示例形态 [{ "名词列表": [ {"专业名词名词":"", "权重":"", ...} ] }]
// 转换为内部 schema：{ type:'object', fields:{ key: { type:'array', itemType:'object', fields:{ subKey:{ type:'text' } } } } }
function buildSchemaFromTemplate(tpl){
  if (tpl === null || tpl === undefined) return { type:'unknown' };
  if (Array.isArray(tpl)) {
    // 数组：取第一个元素作为原型
    if (tpl.length === 0) return { type:'array', itemType:'text' };
    const first = tpl[0];
    const itemSchema = buildSchemaFromTemplate(first);
    return { type:'array', itemType: itemSchema.type === 'object' ? 'object' : itemSchema.type, fields: itemSchema.fields };
  }
  if (typeof tpl === 'object') {
    const fieldSchemas = {};
    Object.keys(tpl).forEach(k => { fieldSchemas[k] = buildSchemaFromTemplate(tpl[k]); });
    return { type:'object', fields: fieldSchemas };
  }
  // 基元（字符串/数字/布尔）一律视为 text，可按需扩展
  return { type:'text' };
}

// 如果外部没有提供模板（或解析为空 object），则根据 resultData 反推 schema
const normalizedTemplate = computed(() => {
  let tplCandidate = effectiveTemplate.value;
  let parsedTemplate = {};
  if (tplCandidate) {
    try {
      parsedTemplate = typeof tplCandidate === 'string' ? JSON.parse(tplCandidate) : tplCandidate;
    } catch (e) { parsedTemplate = {}; }
  }
  // 若后端模板是根层数组且第一项为对象（常见形态：[ { key: ... } ]），则折叠为对象根，便于以对象渲染
  if (Array.isArray(parsedTemplate) && parsedTemplate.length > 0 && parsedTemplate[0] && typeof parsedTemplate[0] === 'object' && !Array.isArray(parsedTemplate[0])) {
    parsedTemplate = parsedTemplate[0];
  }
  const isEmptyObject = parsedTemplate && typeof parsedTemplate === 'object' && !Array.isArray(parsedTemplate) && Object.keys(parsedTemplate).length === 0;
  if (!tplCandidate || isEmptyObject) {
    // 动态生成：只考虑顶层对象，把 resultData 的形状映射成模板
    if (effectiveResult.value && typeof effectiveResult.value === 'object' && !Array.isArray(effectiveResult.value)) {
      parsedTemplate = {};
      Object.keys(effectiveResult.value).forEach(k => {
        const v = effectiveResult.value[k];
        if (Array.isArray(v)) {
          // 取第一项推断
            if (v.length > 0) parsedTemplate[k] = [v[0]]; else parsedTemplate[k] = [];
        } else if (v && typeof v === 'object') {
          parsedTemplate[k] = v; // 递归让 buildSchemaFromTemplate 处理
        } else {
          parsedTemplate[k] = '';
        }
      });
    }
  }
  return buildSchemaFromTemplate(parsedTemplate);
});
// 根数据
const rootData = reactive({ ...(effectiveResult.value || {}) });
watch(effectiveResult, (val) => {
  Object.keys(rootData).forEach(k => delete rootData[k]);
  if (val && typeof val === 'object') Object.assign(rootData, val);
}, { deep: true });

function isObject(v){ return v && typeof v === 'object' && !Array.isArray(v); }

function onRootChange(newObj){
  // 替换 rootData
  Object.keys(rootData).forEach(k => delete rootData[k]);
  Object.assign(rootData, newObj);
  emit('update', JSON.parse(JSON.stringify(rootData)));
}
// END <script setup>
</script>

<style scoped>
.extraction-result-form { padding:8px 4px; background:#fff; font-size:13px; }
.structure-json { font-size:12px; }
/* 样式现在主要在 RecursiveNode.vue 中定义通用块结构，如需覆盖可在此追加 */
</style>