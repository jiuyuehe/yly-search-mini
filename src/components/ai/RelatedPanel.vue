<template>
  <div class="related-panel">
    <div class="toolbar">
        <el-input v-model="query" placeholder="搜索相关文件" clearable size="small" @keyup.enter="doSearch" style="width:220px" />
        <el-button size="small" type="primary" :loading="loading" @click="doSearch">搜索</el-button>
    <el-button size="small" @click="changeBatch" :disabled="loading">换一换</el-button>
        <div style="flex:1"></div>
        <el-checkbox v-model="useLargeModel" size="small" @change="onUseLLMChange">启用大模型</el-checkbox>
        <el-button size="small" type="primary" :disabled="selectedIds.length===0" @click="saveSelection">保存</el-button>
      </div>
      <el-table :data="items" v-loading="loading" size="small" @selection-change="handleSelectionChange" @row-dblclick="openDoc" style="width:100%" empty-text="暂无关联推荐">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="文件名 / 元信息" min-width="300">
          <template #default="{ row }">
            <div class="name-cell">
              <div class="file-name"><a class="file-link" @click.prevent="openDoc(row)">{{ row.name }}</a></div>
              <div class="meta-line">
                <span class="creator">{{ row.creator || '—' }}</span>
                <span v-if="row.fileExt" class="meta-extra">• {{ row.fileExt }}</span>
                <span v-if="row.updateTime" class="meta-extra">• {{ row.updateTime }}</span>
                <span v-if="row.tags && row.tags.length" class="tag-list">•
                  <span v-for="(t, i) in row.tags" :key="i" class="tag-item">{{ typeof t === 'string' ? t : (t.name || t.label || t.keyword || t.title || '') }}</span>
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="相关分" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="getScoreType(row.score)">{{ formatScore(row.score) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getRelatedDocuments } from '../../services/aiService'
import { resolveEsId } from '../../utils/esid'

const props = defineProps({
  // 保持 fileId 兼容（作为后备），但内部不再直接使用，只通过 resolveEsId 统一解析
  fileId: String,
  file: Object
})

const query = ref('')
const total = ref(0)
const items = ref([])
const loading = ref(false)
const selectedIds = ref([])
const useLargeModel = ref(false)

function formatScore(s) {
  if (s == null) return '-'
  if (s > 1) return s.toFixed(2)
  return (s * 100).toFixed(1) + '%'
}

const esId = computed(() => resolveEsId(props.file, props.fileId) || '')

async function fetchData({ forceRefresh=false } = {}) {
  const id = esId.value
  if (!id) return
  loading.value = true
  try {
    // request full list (no pagination) so UI shows all related items
    const { list, total: t } = await getRelatedDocuments({ esId: id, query: query.value, useLLM: useLargeModel.value, forceRefresh })
    items.value = list
    total.value = t
  } catch (e) {
    console.error('fetch related error', e)
    ElMessage.error('获取关联推荐失败')
  } finally {
    loading.value = false
  }
}

function changeBatch() {
  // Request a new batch from server (force refresh)
  fetchData({ forceRefresh:true });
}

function doSearch() {
  fetchData()
}
// resetSearch removed; use changeBatch or doSearch instead
// pagination removed: no page/size handlers

function getScoreType(s) {
  let v = Number(s || 0);
  if (isNaN(v)) v = 0;
  // normalize values >1 as percentage if appropriate
  if (v > 1) v = v / 100;
  return v > 0.75 ? 'success' : 'info';
}
function openDoc(row) {
  try {
    const evt = new CustomEvent('open-file', { detail: { id: row.id || row.esId } })
    window.dispatchEvent(evt)
  } catch (err) {
    console.warn('openDoc dispatch failed', err)
  }
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(s => s.id || s.esId).filter(Boolean)
}

function saveSelection() {
  // Emit an event so parent can persist the selection; also show a message
  try {
    const payload = { ids: [...selectedIds.value], useLLM: !!useLargeModel.value };
    const evt = new CustomEvent('related-save', { detail: payload });
    window.dispatchEvent(evt);
    ElMessage.success('已触发保存操作');
  } catch (e) {
    console.warn('saveSelection failed', e);
    ElMessage.error('保存失败');
  }
}

function onUseLLMChange() {
  // Refresh results using new model flag
  fetchData();
}

// 监听解析后的 esId（以及查询参数变化时通过显式调用）
watch(esId, (n, o) => {
  if (n && n !== o) {
    fetchData()
  }
})

onMounted(fetchData)
</script>

<style scoped>
.related-panel { display:flex; flex-direction:column; gap:8px; }
.toolbar { display:flex; align-items:center; gap:8px; }
.file-link { cursor:pointer; color: var(--el-color-primary); }
.file-link:hover { text-decoration:underline; }
.pagination { display:flex; justify-content:center; margin-top:4px; }

.name-cell { display:flex; flex-direction:column; gap:4px; }
.file-name { font-weight:600; }
.meta-line { color:#6b7280; font-size:12px; display:flex; gap:8px; align-items:center; }
.tag-list { display:flex; gap:6px; align-items:center; margin-left:6px; }
.tag-item { background:#f3f4f6; padding:2px 6px; border-radius:4px; font-size:11px; color:#374151; }
</style>
