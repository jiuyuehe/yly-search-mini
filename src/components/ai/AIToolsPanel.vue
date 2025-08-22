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
        <template v-if="active==='summary'">
          <SummaryPanel :file-id="fileId" class="stack-panel" />
          <TagsPanel :file-id="fileId" class="stack-panel" />
          <NERPanel :file-id="fileId" class="stack-panel" />
        </template>
        <component
          v-else
          :is="currentComp"
          :file-id="fileId"
          class="stack-panel"
        />
      </div>
      <div class="tool-placeholder" v-else>
        <el-empty :description="active==='translation' ? '正在切换到翻译工作区...' : '选择右侧 AI 工具'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SummaryPanel from '../ai/SummaryPanel.vue'
import TagsPanel from '../ai/TagsPanel.vue'
import NERPanel from '../ai/NERPanel.vue'
import CustomExtractionPanel from '../ai/CustomExtractionPanel.vue'
import DocumentQA from '../ai/DocumentQA.vue'
import { ChatLineSquare, Box, ChatRound, RefreshRight } from '@element-plus/icons-vue'

const props = defineProps({
  fileId: { type: [String, Number], required: true }
})
const emit = defineEmits(['switch-translate'])

const tools = [
  { key: 'summary', label: '摘要', icon: ChatLineSquare },
  { key: 'customExtraction', label: '自定义提取', icon: Box },
  { key: 'qa', label: '问答', icon: ChatRound },
  { key: 'translation', label: '翻译', icon: RefreshRight }
]

const active = ref('summary')

const currentComp = computed(() => {
  switch (active.value) {
    case 'customExtraction': return CustomExtractionPanel
    case 'qa': return DocumentQA
    default: return SummaryPanel
  }
})

function handleSelect(key) {
  if (key === 'translation') {
    active.value = 'translation'
    emit('switch-translate')
    return
  }
  active.value = key
}
</script>

<style scoped>
.ai-side { width:100%; height:100%; display:flex; flex-direction:column; background:#fff; border-left:1px solid #ebeef5; }
.ai-tools-panel { display:flex; flex-direction:column; height:100%; }
.tools-list { padding:12px 16px 8px; display:flex; flex-direction:column; gap:6px; border-bottom:1px solid #f0f2f5; }
.tool-item { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:13px; color:#606266; transition:.15s; }
.tool-item:hover { background:#f5f7fa; color:var(--el-color-primary); }
.tool-item.active { background:var(--el-color-primary); color:#fff; box-shadow:0 4px 10px -2px rgba(22,113,242,.35); }
.tool-label { flex:1; }
.tool-content { flex:1; overflow:auto; padding:14px 16px 22px; display:flex; flex-direction:column; gap:14px; }
.tool-placeholder { flex:1; display:flex; align-items:center; justify-content:center; padding:20px; }
.stack-panel { background:#fff; border:1px solid #ebeef5; border-radius:8px; padding:8px 10px; }
.tool-content::-webkit-scrollbar { width:8px; }
.tool-content::-webkit-scrollbar-thumb { background:rgba(0,0,0,.18); border-radius:4px; }
</style>
