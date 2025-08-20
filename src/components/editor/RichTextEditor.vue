<template>
  <div class="milkdown-wrapper" :class="{ readonly }">
    <div ref="editorRoot" class="editor-root" />
    <div v-if="loading" class="editor-loading-overlay">
      <el-skeleton :rows="6" animated />
    </div>
  </div>
</template>
<script setup>
// 回退到官方文档中“useEditor”之外的手动 root 方式，避免 <Milkdown /> 在异步 create/destroy 期间触发 Vue diff 出现 nextSibling null 的问题。
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';
import { history } from '@milkdown/plugin-history';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import '@milkdown/theme-nord/style.css';

const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue', 'change']);

const editorRoot = ref(null);
const loading = ref(true);
let editorInstance; // Editor | undefined
let destroyed = false;
let internalChange = false;

async function initEditor(initial) {
  loading.value = true;
  await nextTick();
  if (!editorRoot.value) return;
  try {
    editorInstance = Editor.make()
      .use(nord)
      .use(commonmark)
      .use(history)
      .use(listener)
      .config((ctx) => {
        ctx.set(rootCtx, editorRoot.value);
        ctx.set(defaultValueCtx, initial || '');
        ctx.get(listenerCtx)
          .markdownUpdated((_, markdown) => {
            internalChange = true;
            emit('update:modelValue', markdown);
            emit('change', markdown);
            internalChange = false;
          })
          .mounted(() => { if (!destroyed) loading.value = false; });
      });
    await editorInstance.create();
    if (props.readonly) editorRoot.value?.setAttribute('contenteditable', 'false');
  } catch (e) {
    console.error('[Milkdown init failed]', e);
    loading.value = false;
  }
}

onMounted(() => initEditor(props.modelValue));

// 外部传入内容变化时（例如重新提取文本）同步到编辑器
watch(() => props.modelValue, (val) => {
  if (internalChange) return;
  if (!editorInstance) return;
  try {
    if (val !== undefined) {
      editorInstance.destroy();
      initEditor(val);
    }
  } catch (e) { console.warn('同步外部内容失败', e); }
});

onBeforeUnmount(() => { destroyed = true; try { editorInstance?.destroy(); } catch { /* ignore */ } });
</script>
<style scoped>
.milkdown-wrapper { position:relative; width:100%; height:100%; display:flex; flex-direction:column; }
.editor-root { flex:1; overflow:auto; border:1px solid #e4e7ed; border-radius:8px; background:#fff; padding:12px 16px; }
.editor-root:focus-within { box-shadow:0 0 0 2px rgba(22,113,242,.25); border-color:#1671f2; }
.milkdown-wrapper.readonly .editor-root { background:#fafafa; }
.editor-loading-overlay { position:absolute; inset:0; background:rgba(255,255,255,.7); display:flex; align-items:flex-start; padding:12px; }
.editor-root::-webkit-scrollbar { width:8px; }
.editor-root::-webkit-scrollbar-thumb { background:rgba(0,0,0,.18); border-radius:4px; }
</style>
