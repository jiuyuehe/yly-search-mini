<template>
  <div class="related-panel">
    <div class="toolbar">
      <el-input v-model="query" placeholder="搜索相关文件" clearable size="small" @keyup.enter="doSearch" style="width:220px" />
      <el-button size="small" type="primary" :loading="loading" @click="doSearch">搜索</el-button>
      <el-button size="small" @click="resetSearch" :disabled="!query && page===1">重置</el-button>
    </div>
    <el-table :data="items" v-loading="loading" size="small" @row-dblclick="openDoc" style="width:100%" empty-text="暂无关联推荐">
      <el-table-column prop="name" label="文件名" min-width="180">
        <template #default="{ row }">
          <a class="file-link" @click.prevent="openDoc(row)">{{ row.name }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="相关分" width="90">
        <template #default="{ row }">
          <el-tag size="small" type="success">{{ formatScore(row.score) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="snippet" label="片段" min-width="240" show-overflow-tooltip />
    </el-table>
    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="handlePage" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRelatedDocuments } from '../../services/aiService'

const props = defineProps({
  fileId: String,
  file: Object
})

const query = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const items = ref([])
const loading = ref(false)

function formatScore(s) {
  if (s == null) return '-'
  if (s > 1) return s.toFixed(2)
  return (s * 100).toFixed(1) + '%'
}

async function fetchData() {
  if (!props.fileId) return
  loading.value = true
  try {
    const { list, total: t } = await getRelatedDocuments({ esId: props.fileId, query: query.value, page: page.value, pageSize: pageSize.value })
    items.value = list
    total.value = t
  } catch (e) {
    console.error('fetch related error', e)
    ElMessage.error('获取关联推荐失败')
  } finally {
    loading.value = false
  }
}

function doSearch() {
  page.value = 1
  fetchData()
}
function resetSearch() {
  query.value = ''
  page.value = 1
  fetchData()
}
function handlePage(p) {
  page.value = p
  fetchData()
}
function openDoc(row) {
  try {
    const evt = new CustomEvent('open-file', { detail: { id: row.id || row.esId } })
    window.dispatchEvent(evt)
  } catch (err) {
    console.warn('openDoc dispatch failed', err)
  }
}

watch(() => props.fileId, () => {
  page.value = 1
  fetchData()
})

onMounted(fetchData)
</script>

<style scoped>
.related-panel { display:flex; flex-direction:column; gap:8px; }
.toolbar { display:flex; align-items:center; gap:8px; }
.file-link { cursor:pointer; color: var(--el-color-primary); }
.file-link:hover { text-decoration:underline; }
.pagination { display:flex; justify-content:center; margin-top:4px; }
</style>
