<template>
  <div class="inline-qa-panel" v-show="visible">
    <div class="qa-card">
      <div class="qa-card-header">
        <el-icon class="qa-icon"><MagicStick /></el-icon>
        <div class="qa-title-wrap">
          <div class="qa-title">AI Answer</div>
          <div v-if="displayQuestion" class="qa-question">“{{ displayQuestion }}”</div>
        </div>
        <el-button class="qa-close" circle text @click="emit('close')">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <div class="qa-content">
        <div v-if="!displayQuestion" class="qa-empty">
          请输入问题，或在搜索框中点击“AI 问答”按钮触发回答。
        </div>

        <template v-else>
          <div class="qa-paragraph" v-for="(p, i) in answerParagraphs" :key="i">
            {{ p }}
          </div>

          <div class="qa-related" v-if="relatedFiles.length">
            <div class="qa-related-title">相关文件</div>
            <div class="qa-related-list">
              <div class="qa-related-item" v-for="(f, i) in relatedFiles" :key="i">
                <div class="left">
                  <el-icon class="file-icon"><Document /></el-icon>
                  <span class="name" :title="f.name">{{ f.name }}</span>
                </div>
                <el-button size="small" text @click="preview(f)">
                  <el-icon><View /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { computed } from 'vue';
import { MagicStick, Close, Document, View } from '@element-plus/icons-vue';

const props = defineProps({
  question: { type: String, default: '' },
  visible: { type: Boolean, default: false }
});
const emit = defineEmits(['close', 'preview-file']);

const displayQuestion = computed(() => (props.question || '').trim());

// 轻量占位回答：根据问题构造两段简要说明
const answerParagraphs = computed(() => {
  const q = displayQuestion.value;
  if (!q) return [];
  return [
    `基于你的查询“${q}”，我检索了相关内容并做了简要整理：`,
    `该主题涉及的关键点包括目标、时间线与资源分配。若需更详细的分析或原文引用，可以打开下方相关文件进行查看。`
  ];
});

// 轻量占位相关文件：用问题关键字生成两个示例文件名
const relatedFiles = computed(() => {
  const base = displayQuestion.value || 'Document';
  const safe = base.length > 24 ? base.slice(0, 24) + '…' : base;
  return [
    { name: `${safe}_摘要_v2.docx`, type: 'doc' },
    { name: `相关预算_${safe}.xlsx`, type: 'xlsx' }
  ];
});

function preview(file) {
  emit('preview-file', file);
}
</script>

<style scoped>
.inline-qa-panel {
  margin-top: 12px;
}

.qa-card {
  position: relative;
  border-radius: 14px;
  background: var(--background-color);
  border: 1px solid transparent;
  box-shadow: 0 4px 14px rgba(var(--color-black-rgb), 0.06);
  overflow: hidden;
}
.qa-card:before {
  --grad: linear-gradient(120deg,#6d5dfc 0%, #5f8bff 38%, #ff5fb7 100%);
  content: '';
  position: absolute; inset: 0; padding: 2px; border-radius: inherit; background: var(--grad);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
}

.qa-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 8px;
}
.qa-icon { color: #6d5dfc; }
.qa-title-wrap { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.qa-title { font-weight: 600; font-size: 14px; color: var(--text-color-primary); }
.qa-question { font-size: 12px; color: var(--text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 360px; }
.qa-close { color: var(--text-color-secondary); }

.qa-content { padding: 10px 12px 12px; }
.qa-empty { color: var(--text-color-secondary); font-size: 13px; }
.qa-paragraph { color: var(--text-color-primary); font-size: 14px; line-height: 1.7; margin-bottom: 8px; }

.qa-related { margin-top: 10px; }
.qa-related-title { font-weight: 600; font-size: 13px; color: var(--text-color-primary); margin-bottom: 6px; }
.qa-related-list { display: flex; flex-direction: column; gap: 8px; }
.qa-related-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,0.6); border: 1px solid var(--border-color-light); transition: background .2s ease; }
.qa-related-item:hover { background: rgba(255,255,255,0.9); }
.qa-related-item .left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.qa-related-item .file-icon { color: var(--primary-color); }
.qa-related-item .name { font-size: 13px; color: var(--text-color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70vw; }

@media (max-width: 720px) {
  .qa-question { max-width: 160px; }
}
</style>
