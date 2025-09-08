<template>
  <div class="ai-side">
    <div class="ai-tools-panel">
      <div class="tools-list">
        <div
          v-for="tool in tools"
          :key="tool.key"
          class="tool-item"
          :class="{ active: active===tool.key }"
          @click="handleSelect(tool.key)"
        >
          <el-icon><component :is="tool.icon" /></el-icon>
          <span class="tool-label">{{ tool.label }}</span>
        </div>
      </div>
      <div class="tool-content" v-if="active && active!=='translation'">
        <component
          :is="currentComp"
          :file-id="fileId"
          :file="file"
          class="single-panel"
        />
      </div>
      <div class="tool-placeholder" v-else>
        <el-empty :description="active==='translation' ? '正在切换到翻译工作区...' : '选择右侧 AI 工具'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import SummaryPanel from '../ai/SummaryPanel.vue'
import TagsPanel from '../ai/TagsPanel.vue'
import NERPanel from '../ai/NERPanel.vue'
import CustomExtractionPanel from '../ai/CustomExtractionPanel.vue'
import DocumentQA from '../ai/DocumentQA.vue'
import ClassificationPanel from '../ai/ClassificationPanel.vue'
import RelatedPanel from '../ai/RelatedPanel.vue'
import { ChatLineSquare, Box, ChatRound, List, Link, Document } from '@element-plus/icons-vue'
import MetadataPanel from '../ai/MetadataPanel.vue'
import { ElMessage } from 'element-plus'

const props = defineProps({ fileId: { type: [String, Number], required: true }, hasPerm: { type: Boolean, default: true }, file: { type: Object, default: null } })
const emit = defineEmits(['switch-translate'])

const tools = [
  { key: 'metadata', label: '元数据', icon: Document },
  { key: 'summary', label: '摘要', icon: ChatLineSquare },
  { key: 'tags', label: '标签', icon: Box },
  { key: 'ner', label: '实体', icon: ChatRound },
  { key: 'qa', label: '问答', icon: ChatRound },
  { key: 'customExtraction', label: '自定义提取', icon: Box },
  { key: 'classification', label: '主题分类', icon: List },
  { key: 'related', label: '关联推荐', icon: Link },
]

const active = ref('metadata')

const currentComp = computed(() => {
  switch (active.value) {
  case 'metadata': return MetadataPanel
  case 'summary': return SummaryPanel
    case 'tags': return TagsPanel
    case 'ner': return NERPanel
  case 'customExtraction': return CustomExtractionPanel
  case 'related': return RelatedPanel
    case 'qa': return DocumentQA
    case 'classification': return ClassificationPanel
    default: return SummaryPanel
  }
})

function handleSelect(key) {

  if (!props.hasPerm) {
    return ElMessage.error('无操作权限！');
  }

  if (key === 'translation') {
    active.value = 'translation'
    emit('switch-translate')
    return
  }
  active.value = key
}

function handleActivateNER(){
  active.value = 'ner'
}

function handleActivateTags(){
  active.value = 'tags'
}

function handleActivateQA(){
  active.value = 'qa'
}

onMounted(()=>{ 
  window.addEventListener('activate-ner', handleActivateNER)
  window.addEventListener('refresh-tags', handleActivateTags)
  window.addEventListener('activate-tags', handleActivateTags)
  window.addEventListener('activate-qa', handleActivateQA)
})
onBeforeUnmount(()=>{ 
  window.removeEventListener('activate-ner', handleActivateNER)
  window.removeEventListener('refresh-tags', handleActivateTags)
  window.removeEventListener('activate-tags', handleActivateTags)
  window.removeEventListener('activate-qa', handleActivateQA)
})
</script>

<style scoped>
.ai-side { width:100%; height:100%; display:flex; flex-direction:column; background:#fff; border-left:1px solid #ebeef5; }
.ai-tools-panel { display:flex; flex-direction:column; height:100%; }
.tools-list {
  padding:12px 16px 8px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  border-bottom:1px solid #f0f2f5;
}
.tool-item { 
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:4px;
  padding:12px 8px;
  border-radius:8px;
  cursor:pointer;
  font-size:12px;
  color:#606266;
  transition:.15s;
  text-align:center;
  min-height:60px;
  justify-content:center;
  box-sizing:border-box;
  flex:1 0 calc(25% - 8px);
  max-width:calc(25% - 8px);
  min-width:100px;
}
.tool-item:hover { background:#f5f7fa; color:var(--el-color-primary); }
.tool-item.active { background:var(--el-color-primary); color:#fff; box-shadow:0 4px 10px -2px rgba(22,113,242,.35); }
.tool-label { flex:none; font-size:12px; }
.tool-content { flex:1; overflow:auto; padding:14px 16px 22px; }
.tool-placeholder { flex:1; display:flex; align-items:center; justify-content:center; padding:20px; }
.single-panel { background:#fff; border:1px solid #ebeef5; border-radius:8px; padding:12px; height:100%; }
.tool-content::-webkit-scrollbar { width:8px; }
.tool-content::-webkit-scrollbar-thumb { background:rgba(0,0,0,.18); border-radius:4px; }
</style>
