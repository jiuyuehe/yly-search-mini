<template>
  <div class="translation-result-panel">
    <div class="tr-header">
      <span class="title">翻译结果</span>
      <div class="actions">
        <el-button size="small" text @click="copyResult" :disabled="!text">复制</el-button>
        <el-button size="small" text @click="$emit('refresh')" :loading="loading">重译</el-button>
      </div>
    </div>
    <div class="tr-body" ref="bodyRef">
      <pre v-if="text" class="result-text">{{ text }}</pre>
      <div v-else class="placeholder">暂无翻译内容</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  text: { type: String, default: '' },
  loading: { type: Boolean, default: false }
});

defineEmits(['refresh']);
const bodyRef = ref(null);

watch(()=>props.text, ()=>{ if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight; });

function copyResult(){
  if (!props.text) return;
  navigator.clipboard.writeText(props.text).then(()=>ElMessage.success('已复制')).catch(()=>ElMessage.error('复制失败'));
}
</script>

<style scoped>
.translation-result-panel { display:flex; flex-direction:column; height:100%; border-left:1px solid #e5e7eb; background:#fff; }
.tr-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #e5e7eb; background:#fafafa; }
.tr-header .title { font-size:14px; font-weight:600; }
.tr-body { flex:1; overflow:auto; padding:14px; }
.result-text { white-space:pre-wrap; word-break:break-word; font-family: var(--font-mono, Consolas, monospace); margin:0; line-height:1.6; font-size:14px; }
.placeholder { color:#999; font-size:13px; padding:40px 0; text-align:center; }
</style>
