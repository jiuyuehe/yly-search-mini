<template>
  <!-- 对象类型 -->
  <div v-if="schema.type === 'object' && isObject(localData)" class="object-node">
    <div
      v-for="(fieldSchema, key) in schema.fields"
      :key="key"
      class="field-block"
    >
      <div class="field-label">{{ key }}</div>
      <RecursiveNode
        :node-key="key"
        :schema="fieldSchema"
        v-model:data="localData[key]"
        :editable="editable"
        @change="val => updateObjectField(key, val)"
      />
    </div>
  </div>

  <!-- 数组类型 -->
  <div v-else-if="schema.type === 'array' && Array.isArray(localData)" class="array-node">
    <div class="array-items">
      <div
        v-for="(item, idx) in localData"
        :key="idx"
        class="array-item"
      >
        <div class="array-item-header">
          <span>项目 {{ idx + 1 }}</span>
          <el-button
            v-if="editable"
            size="small"
            type="danger"
            @click="removeArrayItem(idx)"
          >删除</el-button>
        </div>

        <!-- 对象元素 -->
        <div v-if="schema.itemType === 'object'" class="array-item-content">
          <div
            v-for="(subSchema, subKey) in schema.fields"
            :key="subKey"
            class="sub-field"
          >
            <div class="field-label">{{ subKey }}</div>
            <RecursiveNode
              :node-key="subKey"
              :schema="subSchema"
              v-model:data="localData[idx][subKey]"
              :editable="editable"
              @change="val => updateArrayObjectField(idx, subKey, val)"
            />
          </div>
        </div>

        <!-- 原始元素 -->
        <div v-else class="simple-array-item">
          <el-input
            v-model="localData[idx]"
            :readonly="!editable"
            placeholder="请输入"
            @change="emitChange()"
          />
        </div>
      </div>
    </div>
    <div v-if="editable" class="array-actions">
      <el-button size="small" type="primary" @click="addArrayItem">添加项目</el-button>
    </div>
  </div>

  <!-- 基元类型 -->
  <div v-else class="primitive-node">
    <el-input
      v-model="primitiveProxy"
      :readonly="!editable"
      placeholder="请输入"
      @change="emitPrimitiveChange"
    />
  </div>
</template>

<script setup>
import { reactive, watch, computed, onMounted } from 'vue';

const props = defineProps({
  nodeKey: { type: String, required: true },
  schema: { type: Object, required: true },
  data: { type: [Object, Array, String, Number, Boolean], required: true },
  editable: { type: Boolean, default: false }
});

const emit = defineEmits(['change', 'update:data']);

function isObject(v){ return v && typeof v === 'object' && !Array.isArray(v); }

// 本地响应式副本（对对象/数组直接引用，以便深层编辑；基元通过 computed 代理）
const localData = reactive(
  isObject(props.data) || Array.isArray(props.data)
    ? props.data
    : { value: props.data }
);

// 基元代理
const primitiveProxy = computed({
  get(){
    if (isObject(props.data) || Array.isArray(props.data)) return '';
    return localData.value;
  },
  set(val){
    if (!isObject(props.data) && !Array.isArray(props.data)) {
      localData.value = val;
      emitPrimitiveChange();
    }
  }
});

watch(() => props.data, (val) => {
  if (!isObject(val) && !Array.isArray(val)) {
    localData.value = val;
  }
}, { deep: true });

// 根据 schema 初始化缺失节点（只在对象和数组层级执行，不覆盖已有值）
function ensureShape() {
  if (props.schema.type === 'object' && isObject(props.data)) {
    const fields = props.schema.fields || {};
    Object.keys(fields).forEach(k => {
      if (props.data[k] === undefined) {
        const fs = fields[k];
        // 使用统一的默认值生成器，便于维护与扩展
        props.data[k] = defaultValueFor(fs);
      }
    });
  } else if (props.schema.type === 'array' && Array.isArray(props.data)) {
    // 若数组为空且 itemType 为 object，可插入一个空对象以便用户可见结构（仅在可编辑时或初始渲染）
    if (props.data.length === 0 && props.schema.itemType === 'object') {
      const obj = {};
      const flds = props.schema.fields || {};
      Object.keys(flds).forEach(k => {
        const fs = flds[k];
        if (fs.type === 'object') obj[k] = {};
        else if (fs.type === 'array') obj[k] = [];
        else obj[k] = '';
      });
      props.data.push(obj);
    }
  }
}

onMounted(() => {
  ensureShape();
});

watch(() => props.schema, () => { ensureShape(); }, { deep: true });

function emitChange(){
  emit('change', cloneData());
  emit('update:data', props.data);
}
function emitPrimitiveChange(){
  emit('change', primitiveProxy.value);
  emit('update:data', primitiveProxy.value);
}

function cloneData(){
  return JSON.parse(JSON.stringify(props.data));
}

// 对象字段更新
function updateObjectField(key, val){
  if (!isObject(props.data)) return;
  props.data[key] = val;
  emitChange();
}

// 数组操作
function addArrayItem(){
  if (!Array.isArray(props.data)) return;
  if (props.schema.itemType === 'object') {
    const obj = {};
    if (props.schema.fields) Object.keys(props.schema.fields).forEach(k => { obj[k] = defaultValueFor(props.schema.fields[k]); });
    props.data.push(obj);
  } else {
    props.data.push('');
  }
  emitChange();
}
function removeArrayItem(i){
  if (!Array.isArray(props.data)) return;
  props.data.splice(i,1);
  emitChange();
}
function updateArrayObjectField(idx, key, val){
  if (!Array.isArray(props.data)) return;
  const item = props.data[idx];
  if (item && typeof item === 'object') item[key] = val;
  emitChange();
}

function defaultValueFor(s){
  if (!s) return '';
  if (s.type === 'array') return [];
  if (s.type === 'object') return {};
  return '';
}
</script>

<style scoped>
.object-node { display:flex; flex-direction:column; gap:12px; }
.field-block { border: var(--border-width-thin) solid var(--border-color); border-radius:6px; padding:10px 12px; background:#fafafa; }
.field-label { font-weight:600; margin-bottom:6px; }
.array-node { display:flex; flex-direction:column; gap:12px; }
.array-items { display:flex; flex-direction:column; gap:12px; }
.array-item { border: var(--border-width-thin) solid var(--border-color-soft); border-radius:6px; padding:10px; background:var(--background-color); }
.array-item-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-weight:600; font-size: var(--font-size-xs); color:var(--text-color-regular); }
.array-item-content { display:flex; flex-direction:column; gap:8px; }
.sub-field { border: var(--border-width-thin) solid #f0f0f0; border-radius: var(--border-radius-sm); padding:8px; background:var(--background-color); }
.array-actions { text-align:left; }
</style>
