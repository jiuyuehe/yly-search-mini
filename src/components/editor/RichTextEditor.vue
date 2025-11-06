<template>
  <div class="milkdown-wrapper" :class="{ readonly }">
    <div class="editor-root">
      <MdEditor
        v-model="innerValue"
        :previewOnly="readonly"
        :theme="theme"
        :editorId="editorId"
        @onChange="handleChange"
      />
    </div>
    <div v-if="loading" class="editor-loading-overlay">
      <el-skeleton :rows="6" animated />
    </div>
  </div>
</template>

<script setup>
// 替换为 md-editor-v3 实现
import { ref, watch, onMounted } from 'vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue', 'change']);

const innerValue = ref(props.modelValue);
const loading = ref(true);
const editorId = 'markdown-editor'; // 若需要多个实例可改为动态
const theme = 'light';
let internalChange = false;

function handleChange(v) {
  internalChange = true;
  innerValue.value = v;
  emit('update:modelValue', v);
  emit('change', v);
  internalChange = false;
}

// 外部值变化同步
watch(() => props.modelValue, (v) => {
  if (internalChange) return;
  if (v !== innerValue.value) innerValue.value = v;
});

// 初次挂载后关闭骨架
onMounted(() => {
  queueMicrotask(() => { loading.value = false; });
});
</script>


<style scoped>
.milkdown-wrapper { position:relative; width:100%; height:100%; display:flex; flex-direction:column; }
.editor-root { flex:1; overflow:auto; border: var(--border-width-thin) solid #e4e7ed; border-radius: var(--border-radius-md); background:var(--background-color); padding:12px 16px; }
.editor-root:focus-within { box-shadow:0 0 0 2px rgba(22,113,242,.25); border-color:#1671f2; }
.milkdown-wrapper.readonly .editor-root { background:#fafafa; }
.editor-loading-overlay { position:absolute; inset:0; background:rgba(255,255,255,.7); display:flex; align-items:flex-start; padding:12px; }
.editor-root::-webkit-scrollbar { width:8px; }
.editor-root::-webkit-scrollbar-thumb { background:rgba(0,0,0,.18); border-radius: var(--border-radius-sm); }
.editor-root:focus-within { box-shadow:0 0 0 2px rgba(22,113,242,.25); border-color:#1671f2; }
.milkdown-wrapper.readonly .editor-root { background:#fafafa; }
.editor-loading-overlay { position:absolute; inset:0; background:rgba(255,255,255,.7); display:flex; align-items:flex-start; padding:12px; }
.editor-root::-webkit-scrollbar { width:8px; }
.editor-root::-webkit-scrollbar-thumb { background:rgba(0,0,0,.18); border-radius: var(--border-radius-sm); }
</style>

