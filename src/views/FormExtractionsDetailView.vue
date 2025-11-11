<template>
  <div class="form-extractions-detail-view">
    <AppHeader />
    <div class="breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/extractions' }">抽取表单</el-breadcrumb-item>
        <el-breadcrumb-item>{{ formName }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div ref="contentRef" class="content" v-loading="loading">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索关键词" 
            size="small" 
            style="width:220px" 
            clearable
            @input="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="sortKey" size="small" style="width:140px" @change="handleSort">
            <el-option label="创建时间" value="createTime" />
            <el-option label="ID" value="id" />
          </el-select>
          <el-select v-model="sortOrder" size="small" style="width:120px" @change="handleSort">
            <el-option label="降序" value="desc" />
            <el-option label="升序" value="asc" />
          </el-select>
          <el-button size="small" @click="handleExport" :loading="exporting">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <!-- Error Alert -->
      <div v-if="error" class="error">
        <el-alert type="error" :title="error" show-icon closable @close="error = ''" />
      </div>

      <!-- Table -->
      <div class="table-container">
        <el-table
          :data="pagedData"
          :height="tableHeight"
          border
          stripe
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa', fontWeight: 'bold' }"
        >
          <!-- Fixed esId column -->
          <el-table-column
            prop="esId"
            label="esId"
            width="220"
            fixed="left"
          >
            <template #default="{ row }">
              <el-link
                type="primary"
                :href="`#/preview/doc/${encodeURIComponent(row.esId)}`"
                @click.prevent="handlePreview(row.esId)"
              >
                {{ row.esId || '-' }}
              </el-link>
            </template>
          </el-table-column>

          <!-- Dynamic columns based on form structure -->
          <template v-for="column in tableColumns" :key="column.prop">
            <!-- Object type fields with sub-columns -->
            <el-table-column
              v-if="column.children && column.children.length > 0"
              :label="column.label"
              align="center"
            >
              <el-table-column
                v-for="subCol in column.children"
                :key="subCol.prop"
                :prop="subCol.prop"
                :label="subCol.label"
                :width="subCol.width"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ formatValue(getNestedValue(row, subCol.prop), subCol.type) }}
                </template>
              </el-table-column>
            </el-table-column>

            <!-- Regular fields -->
            <el-table-column
              v-else
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ formatValue(getNestedValue(row, column.prop), column.type) }}
              </template>
            </el-table-column>
          </template>

          <!-- Operations column -->
          <el-table-column
            label="操作"
            width="160"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleDetail(row)">
                详情
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination-block">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[50, 100, 300]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- Detail/Edit Dialog -->
    <el-dialog
      v-model="showDetailDialog"
      :title="isEditing ? '编辑表单数据' : '查看表单数据'"
      width="70%"
      :close-on-click-modal="false"
    >
      <FormPreview 
        v-if="currentRow && form" 
        :structure="form.structure" 
        :initial-data="currentRowData"
        :show-examples="false"
        :editable="isEditing"
        @update:model-value="handleDataUpdate"
      />
      <template #footer>
        <el-button @click="closeDetailDialog">取消</el-button>
        <el-button v-if="!isEditing" type="primary" @click="startEdit">编辑</el-button>
        <el-button v-else type="primary" :loading="saving" @click="saveChanges">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import AppHeader from '../components/common/AppHeader.vue'
import { useRoute, useRouter } from 'vue-router'
import { useFormsStore } from '../stores/forms'
import { useExtractionsStore } from '../stores/extractions'
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { flatten as flatUtil, unflatten as unflatUtil } from '@/utils/flatten'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import FormPreview from '../components/forms/FormPreview.vue'

const route = useRoute()
const router = useRouter()
const formsStore = useFormsStore()
const extractionsStore = useExtractionsStore()

const formId = route.params.id
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const exporting = ref(false)

const form = computed(() => formsStore.formById(formId))
const formName = computed(() => form.value?.name || `表单 ${formId}`)

// Data states
const rawData = ref([])
const filteredData = ref([])
const searchKeyword = ref('')
const sortKey = ref('createTime')
const sortOrder = ref('desc')

// Pagination
const currentPage = ref(1)
const pageSize = ref(50)
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

// Table height
const contentRef = ref(null)
const tableHeight = ref(500)

// Dialog states
const showDetailDialog = ref(false)
const currentRow = ref(null)
const currentRowData = ref(null)
const isEditing = ref(false)
const editedData = ref(null)

// Table columns configuration
const tableColumns = computed(() => {
  const structure = form.value?.structure || form.value?.structureResult || form.value?.structure_result
  if (!structure || !Array.isArray(structure.fields)) return []
  
  const columns = []
  
  structure.fields.forEach(field => {
    if (field.type === 'object' && Array.isArray(field.fields) && field.fields.length > 0) {
      // Multi-level header for object fields
      const children = field.fields.map(subField => ({
        prop: `${field.name}.${subField.name}`,
        label: subField.name,
        width: 160,
        type: subField.type
      }))
      columns.push({
        prop: field.name,
        label: field.name,
        children
      })
    } else if (field.type === 'array' && field.itemType === 'object' && Array.isArray(field.fields)) {
      // Array of objects - show as flattened columns
      field.fields.forEach(subField => {
        columns.push({
          prop: `${field.name}.${subField.name}`,
          label: `${field.name}.${subField.name}`,
          width: 160,
          type: subField.type
        })
      })
    } else {
      // Regular field
      columns.push({
        prop: field.name,
        label: field.name,
        width: 160,
        type: field.type
      })
    }
  })
  
  return columns
})

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    if (!formsStore.forms.length) await formsStore.loadForms()
    await loadData()
    await nextTick()
    calcTableHeight()
    window.addEventListener('resize', calcTableHeight)
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calcTableHeight)
})

function calcTableHeight() {
  const viewportH = window.innerHeight
  const breadcrumbEl = document.querySelector('.breadcrumb')
  const toolbarEl = document.querySelector('.toolbar')
  const paginationEl = document.querySelector('.pagination-block')
  const breadcrumbH = breadcrumbEl ? breadcrumbEl.getBoundingClientRect().height : 52
  const toolbarH = toolbarEl ? toolbarEl.getBoundingClientRect().height : 40
  const paginationH = paginationEl ? paginationEl.getBoundingClientRect().height : 40
  const verticalPadding = 16 * 2
  const bottomReserve = 20
  const available = viewportH - breadcrumbH - toolbarH - paginationH - verticalPadding - bottomReserve - 60
  tableHeight.value = Math.max(300, available)
}

async function loadData() {
  await extractionsStore.loadExtractions({ form_id: formId, page: 1, pageSize: 1000 })
  rawData.value = extractionsStore.extractions.map(e => normalizeRow(e))
  applyFiltersAndSort()
}

function normalizeRow(item) {
  const flatData = flatUtil(item.extracted_data || {})
  return {
    id: item.id,
    esId: item.esId || item.esid || item.esID || '',
    createTime: item.createTime || item.created_at || item.updated_at || '',
    ...flatData,
    _raw: item
  }
}

function applyFiltersAndSort() {
  let data = [...rawData.value]
  
  // Apply search filter
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(row => {
      return Object.entries(row).some(([key, value]) => {
        if (['id', 'esId', 'createTime', '_raw'].includes(key)) return false
        return String(value || '').toLowerCase().includes(keyword)
      })
    })
  }
  
  // Apply sort
  const key = sortKey.value
  const factor = sortOrder.value === 'asc' ? 1 : -1
  data.sort((a, b) => {
    const va = a[key] ?? ''
    const vb = b[key] ?? ''
    if (key === 'createTime') return (Number(va) - Number(vb)) * factor
    if (!isNaN(va) && !isNaN(vb)) return (Number(va) - Number(vb)) * factor
    return String(va).localeCompare(String(vb)) * factor
  })
  
  filteredData.value = data
  currentPage.value = 1
}

function handleSearch() {
  applyFiltersAndSort()
}

function handleSort() {
  applyFiltersAndSort()
}

function handleSizeChange() {
  currentPage.value = 1
}

function handleCurrentChange() {
  // Page changed, no action needed as pagedData is computed
}

function getNestedValue(row, path) {
  // First try direct access with the flattened key (e.g., "field.subfield")
  if (path in row) {
    return row[path]
  }
  
  // Fallback to nested property access for non-flattened data
  const keys = path.split('.')
  let value = row
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key]
    } else {
      return undefined
    }
  }
  return value
}

function formatValue(value, type) {
  if (value === null || value === undefined) return ''
  
  switch (type) {
    case 'date':
      return formatDate(value)
    case 'boolean':
      return value ? '是' : '否'
    case 'number':
      return String(value)
    default:
      return String(value)
  }
}

function formatDate(dateVal) {
  if (!dateVal) return ''
  try {
    const n = Number(dateVal)
    const d = isNaN(n) ? new Date(dateVal) : new Date(n)
    return d.toLocaleString('zh-CN')
  } catch {
    return String(dateVal)
  }
}

function handlePreview(esId) {
  if (!esId) return
  window.location.hash = `#/preview/doc/${encodeURIComponent(esId)}?retureBtn=true`
}

function handleDetail(row) {
  currentRow.value = row
  const flatData = {}
  Object.entries(row).forEach(([key, value]) => {
    if (!['id', 'esId', 'createTime', '_raw'].includes(key)) {
      flatData[key] = value
    }
  })
  currentRowData.value = unflatUtil(flatData)
  isEditing.value = false
  editedData.value = null
  showDetailDialog.value = true
}

function startEdit() {
  isEditing.value = true
  editedData.value = JSON.parse(JSON.stringify(currentRowData.value))
}

function handleDataUpdate(newData) {
  editedData.value = newData
}

async function saveChanges() {
  if (!editedData.value || !currentRow.value) return
  
  saving.value = true
  try {
    await extractionsStore.updateExtraction(currentRow.value.id, {
      extracted_data: editedData.value
    })
    
    // Update local data
    await loadData()
    
    ElMessage.success('保存成功')
    closeDetailDialog()
  } catch (e) {
    ElMessage.error('保存失败: ' + (e?.message || e))
  } finally {
    saving.value = false
  }
}

function closeDetailDialog() {
  showDetailDialog.value = false
  currentRow.value = null
  currentRowData.value = null
  isEditing.value = false
  editedData.value = null
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除该记录吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await extractionsStore.deleteExtraction(row.id)
    await loadData()
    ElMessage.success('删除成功')
  } catch (e) {
    if (e === 'cancel') return
    ElMessage.error('删除失败: ' + (e?.message || e))
  }
}

async function handleExport() {
  exporting.value = true
  try {
    const ids = filteredData.value.map(r => r.id)
    await extractionsStore.exportByForm({
      form_id: formId,
      ids: ids
    })
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败: ' + (e?.message || e))
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.form-extractions-detail-view {
  background: var(--background-page);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.breadcrumb {
  padding: 16px 24px;
  background: var(--background-color);
  border-bottom: 1px solid var(--border-color);
}

.content {
  padding: 16px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.error {
  margin-bottom: 12px;
}

.table-container {
  flex: 1;
  min-height: 0;
  margin-bottom: 16px;
}

.pagination-block {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

/* Multi-level header styling */
:deep(.el-table__header) .el-table__cell {
  background: #f5f7fa;
  font-weight: bold;
}

:deep(.el-table) .el-table__body-wrapper {
  overflow-x: auto;
}

:deep(.el-link) {
  font-weight: 500;
}
</style>
