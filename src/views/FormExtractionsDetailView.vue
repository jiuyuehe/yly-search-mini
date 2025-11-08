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
      <div class="top-bar">
        <el-input v-model="filterKey" placeholder="过滤关键词" size="small" style="width:220px" @input="applyFilter" />
        <el-select v-model="sortKey" size="small" style="width:140px" @change="applySort">
          <el-option label="创建时间" value="createTime" />
          <el-option label="ID" value="id" />
        </el-select>
        <el-select v-model="sortOrder" size="small" style="width:120px" @change="applySort">
          <el-option label="降序" value="desc" />
          <el-option label="升序" value="asc" />
        </el-select>
        <el-button size="small" @click="reload">刷新</el-button>
        <el-button size="small" type="primary" @click="saveEdited" :disabled="saving || editedCount===0">保存修改 ({{ editedCount }})</el-button>
      </div>
      <div v-if="error" class="error"><el-alert type="error" :title="error" show-icon /></div>

  <div class="table-wrapper" :style="{height: tableWrapperHeight + 'px'}">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2
              v-if="columns.length"
              class="vt2 enhanced"
              fixed
              :columns="columns"
              :data="pagedRows"
              :width="width"
              :height="height"
              :estimated-row-height="50"
              :header-height="[30,40]"
              :header-class="headerClass"
              :row-class="rowClass"
            >
              <template #header="slotProps">
                <GroupedHeader :groups="headerGroups" v-bind="slotProps" />
              </template>
            </el-table-v2>
            <div v-else class="empty">暂无数据或表单结构为空</div>
          </template>
        </el-auto-resizer>
      </div>
      <!-- 分页组件 -->
      <div class="pagination-block">
        <el-pagination
          v-model:current-page="currentPage2"
          v-model:page-size="pageSize2"
          :page-sizes="[100,200,300,400]"
          :size="size"
          :disabled="disabled"
          :background="background"
          layout="sizes, prev, pager, next"
          :total="displayRows.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
  
</template>

<script setup>
import AppHeader from '../components/common/AppHeader.vue'
import { useRoute } from 'vue-router'
import { useFormsStore } from '../stores/forms'
import { useExtractionsStore } from '../stores/extractions'
import { ref, computed, onMounted, onBeforeUnmount, h, defineComponent, nextTick } from 'vue'
import { toUnifiedFields, flatten as flatUtil, unflatten as unflatUtil } from '@/utils/flatten'
import { ElMessage, ElInput, ElInputNumber, ElCheckbox, ElDatePicker, TableV2Placeholder, ElAutoResizer } from 'element-plus'

const route = useRoute()
const formsStore = useFormsStore()
const extractionsStore = useExtractionsStore()

const formId = route.params.id
const loading = ref(false)
const error = ref('')
const saving = ref(false)

const form = computed(() => formsStore.formById(formId))
const formName = computed(() => form.value?.name || `表单 ${formId}`)

const rows = ref([])
const columns = ref([])
const headerGroups = ref([])
const contentRef = ref(null)
const displayRows = ref([])
const filterKey = ref('')
const sortKey = ref('createTime')
const sortOrder = ref('desc')
const tableWrapperHeight = ref(0)
// 分页相关状态
const currentPage2 = ref(1)
const pageSize2 = ref(100)
const size = ref('small')
const disabled = ref(false)
const background = ref(true)

const pagedRows = computed(() => {
  const start = (currentPage2.value - 1) * pageSize2.value
  return displayRows.value.slice(start, start + pageSize2.value)
})

function calcWrapperHeight() {
  // 计算视口可用高度: 视口高度 - 顶部已占高度（breadcrumb + top-bar + 外层 padding） - 底部预留
  const viewportH = window.innerHeight
  // 估算 breadcrumb 高度  (或实际获取)
  const breadcrumbEl = document.querySelector('.breadcrumb')
  const topBarEl = document.querySelector('.top-bar')
  const paginationEl = document.querySelector('.pagination-block')
  const breadcrumbH = breadcrumbEl ? breadcrumbEl.getBoundingClientRect().height : 52
  const topBarH = topBarEl ? topBarEl.getBoundingClientRect().height : 40
  const paginationH = paginationEl ? paginationEl.getBoundingClientRect().height : 0
  const verticalPadding = 16 * 2 // content padding top+bottom
  const bottomReserve = 12
  const available = viewportH - breadcrumbH - topBarH - paginationH - verticalPadding - bottomReserve - 100
  tableWrapperHeight.value = Math.max(260, available)
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    if (!formsStore.forms.length) await formsStore.loadForms()
    await loadData()
    await nextTick()
    // 使用 ElAutoResizer 不需要手动尺寸监听
    calcWrapperHeight()
    window.addEventListener('resize', calcWrapperHeight)
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calcWrapperHeight)
})



async function loadData() {
  await extractionsStore.loadExtractions({ form_id: formId, page: 1, pageSize: 1000 })
  const normalized = extractionsStore.extractions.map(e => buildRow(e))
  rows.value = normalized
  buildColumnsAndHeaders()
  applySort()
  applyFilter()
}

function buildRow(item) {
  const base = toUnifiedFields(item)
  const flat = flatUtil(base)
  return { id: item.id, esId: item.esId || item.esid || item.esID || '', createTime: item.createTime || item.created_at || item.updated_at || '', ...flat }
}

function buildColumnsAndHeaders() {
  const structure = form.value?.structure || form.value?.structureResult || form.value?.structure_result
  const fixedCols = [
    makeColumn('id', 'ID', 100, { fixed: 'left', editable: false }),
    makeLinkColumn('esId', 'esId', 220),
    makeDateColumn('createTime', '创建时间', 160),
    makeOpsColumn('ops', '操作', 140)
  ]
  const dynamicCols = []
  const groups = []
  if (structure && Array.isArray(structure.fields)) {
    structure.fields.forEach(f => {
      if (f.type === 'object' && Array.isArray(f.fields) && f.fields.length) {
        const startIndex = fixedCols.length + dynamicCols.length
        f.fields.forEach(sf => {
          dynamicCols.push(makeEditableColumn(`${f.name}.${sf.name}`, sf.name, 160, mapType(sf.type)))
        })
        groups.push({ label: f.name, start: startIndex, span: f.fields.length })
      } else if (f.type === 'array' && f.itemType === 'object' && Array.isArray(f.fields)) {
        // 数组的子对象字段只作为普通列展示，不创建分组
        f.fields.forEach(sf => {
          dynamicCols.push(makeEditableColumn(`${f.name}.${sf.name}`, sf.name, 160, mapType(sf.type)))
        })
      } else {
        dynamicCols.push(makeEditableColumn(f.name, f.name, 160, mapType(f.type)))
      }
    })
  } else {
    if (rows.value.length) {
      Object.keys(rows.value[0]).filter(k => !['id','esId','createTime','ops'].includes(k)).forEach(k => {
        dynamicCols.push(makeEditableColumn(k, k, 160, 'text'))
      })
    }
  }
  columns.value = [...fixedCols, ...dynamicCols]
  headerGroups.value = groups
}

function mapType(t) {
  switch (t) {
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    case 'date': return 'date'
    default: return 'text'
  }
}

const editedCount = computed(() => rows.value.filter(r => r.__dirty).length)

async function saveEdited() {
  saving.value = true
  try {
    const payload = rows.value.filter(r => r.__dirty).map(r => ({ id: r.id, data: unflatUtil(filterDataCells(r)) }))
    for (const item of payload) {
      await extractionsStore.updateExtraction(item.id, { extracted_data: item.data })
      const target = extractionsStore.extractions.find(e => String(e.id) === String(item.id))
      if (target) target.extracted_data = item.data
    }
    rows.value.forEach(r => { if (r.__dirty) r.__dirty = false })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败: ' + (e?.message || e))
  } finally {
    saving.value = false
  }
}

function reload() { loadData() }

function filterDataCells(row) {
  // 去掉 id 与 __ 前缀标记，仅保留数据单元
  const o = {}
  Object.entries(row).forEach(([k,v]) => { if (k !== 'id' && !k.startsWith('__')) o[k] = v })
  return o
}

// ---- TableV2 columns builders ----
function makeColumn(key, title, width = 160, opts = {}) {
  const base = {
    key,
    dataKey: key,
    title,
    width,
    align: 'left',
    ...opts,
  }
  if (key === 'id') {
    base.cellRenderer = ({ rowData }) => h('span', { class: 'cell-id' }, String(rowData.id))
  }
  return base
}

function makeLinkColumn(key, title, width = 200) {
  return {
    ...makeColumn(key, title, width, { editable: false }),
    cellRenderer: ({ rowData }) => h('a', {
      href: 'javascript:void(0)',
      onClick: () => openPreview(rowData[key]),
      class: 'link'
    }, rowData[key] || '-')
  }
}

function makeDateColumn(key, title, width = 160) {
  return {
    ...makeColumn(key, title, width, { editable: false }),
    cellRenderer: ({ rowData }) => h('span', {}, formatDate(rowData[key]))
  }
}

function makeOpsColumn(key, title, width = 140) {
  return {
    ...makeColumn(key, title, width, { fixed: 'right', editable: false }),
    cellRenderer: ({ rowData }) => h('div', { class: 'ops' }, [
      h('button', { class: 'btn text', onClick: () => openPreview(rowData.esId) }, '查看'),
      h('button', { class: 'btn primary', onClick: () => saveRowNow(rowData) }, '保存')
    ])
  }
}

async function saveRowNow(row) {
  try {
    const data = unflatUtil(filterDataCells(row))
    await extractionsStore.updateExtraction(row.id, { extracted_data: data })
    row.__dirty = false
    row.__editing = false
    ElMessage.success('行已保存')
  } catch (e) {
    ElMessage.error('保存失败: ' + (e?.message || e))
  }
}

function makeEditableColumn(key, title, width = 160, type = 'text') {
  return {
    ...makeColumn(key, title, width, { editable: true }),
    cellRenderer: ({ rowData }) => renderCell(rowData, key, type)
  }
}

function renderCell(row, key, type) {
  const val = row[key]
  if (row.__editing) {
    return h('div', { class: 'cell cell-editing' }, [renderEditor(row, key, type)])
  }
  let text = ''
  if (type === 'date') text = formatDate(val)
  else if (type === 'boolean') text = val ? '是' : '否'
  else text = val == null ? '' : String(val)
  return h('div', {
    class: 'cell cell-display',
    title: text,
    onDblclick: () => { row.__editing = true }
  }, [h('span', { class: 'cell-text' }, text)])
}

function renderEditor(row, key, type) {
  const val = row[key]
  const onDirty = () => { if (!row.__dirty) row.__dirty = true }
  if (type === 'boolean') {
    return h(ElCheckbox, {
      modelValue: !!val,
      size: 'small',
      onChange: (v) => { row[key] = v; onDirty() }
    })
  }
  if (type === 'number') {
    return h(ElInputNumber, {
      modelValue: (val === '' || val == null) ? null : Number(val),
      size: 'small',
      controls: false,
      placeholder: '数值',
      onChange: (v) => { row[key] = v; onDirty() }
    })
  }
  if (type === 'date') {
    // 允许时间戳或日期字符串
    const parsed = (() => {
      if (!val) return null
      const n = Number(val)
      const d = isNaN(n) ? new Date(val) : new Date(n)
      if (isNaN(d.getTime())) return null
      // 格式 YYYY-MM-DD
      const pad = (x) => String(x).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    })()
    return h(ElDatePicker, {
      modelValue: parsed,
      type: 'date',
      size: 'small',
      valueFormat: 'YYYY-MM-DD',
      format: 'YYYY-MM-DD',
      placeholder: '选择日期',
      onChange: (v) => { row[key] = v; onDirty() }
    })
  }
  return h(ElInput, {
    modelValue: val ?? '',
    size: 'small',
    placeholder: '文本',
    clearable: true,
    onInput: (v) => { row[key] = v; onDirty() }
  })
}

function openPreview(esId) {
  if (!esId) return
  window.location.hash = `#/preview/doc/${encodeURIComponent(esId)}?retureBtn=true`
}

// ---- Header slot component 多行分组表头 ----
const GroupedHeader = defineComponent({
  name: 'GroupedHeader',
  props: ['cells','columns','headerIndex','headerHeight','groups'],
  setup(props) {
    return () => {
      const { headerIndex, columns, cells } = props
      const groups = props.groups || []
      // 第一行: 分组父标题，需要与列数量匹配，用 Placeholder 占位
      if (headerIndex === 0) {
        const result = []
        let i = 0
        while (i < columns.length) {
          const g = groups.find(g => g.start === i)
          if (g) {
            // 计算组宽度
            let width = 0
            for (let k = 0; k < g.span; k++) width += columns[i + k]?.width || 0
            result.push(h('div', {
              class: 'group-cell',
              style: { width: width + 'px' }
            }, g.label))
            // 其余列用占位保证单元格总数一致
            for (let k = 1; k < g.span; k++) {
              result.push(h(TableV2Placeholder, { key: `ph-${i+k}` }))
            }
            i += g.span
          } else {
            // 非分组列单独展示
            const col = columns[i]
            result.push(h('div', { class: 'group-cell single', style: { width: col.width + 'px' } }, col.title))
            i++
          }
        }
        return result
      }
      // 第二行: 叶子列标题，直接使用默认 cells
      return cells
    }
  }
})

function headerClass({ headerIndex }) {
  return headerIndex === 0 ? 'group-row' : 'leaf-row'
}

function rowClass({ rowData }) { return rowData.__editing ? 'row-editing' : (rowData.__dirty ? 'row-dirty' : '') }

function applySort() {
  const key = sortKey.value
  const asc = sortOrder.value === 'asc'
  const factor = asc ? 1 : -1
  const sorted = [...rows.value].sort((a,b) => {
    const va = a[key] ?? ''
    const vb = b[key] ?? ''
    if (key === 'createTime') return (Number(va) - Number(vb)) * factor
    if (!isNaN(va) && !isNaN(vb)) return (Number(va) - Number(vb)) * factor
    return String(va).localeCompare(String(vb)) * factor
  })
  displayRows.value = sorted
  // 变更排序后回到第一页
  currentPage2.value = 1
}

function applyFilter() {
  const k = (filterKey.value || '').trim()
  if (!k) { applySort(); return }
  const lower = k.toLowerCase()
  const filtered = rows.value.filter(r => Object.entries(r).some(([kk,vv]) => {
    if (['id','esId','createTime','ops','__dirty'].includes(kk)) return false
    return String(vv ?? '').toLowerCase().includes(lower)
  }))
  const key = sortKey.value
  const asc = sortOrder.value === 'asc'
  const factor = asc ? 1 : -1
  filtered.sort((a,b) => {
    const va = a[key] ?? ''
    const vb = b[key] ?? ''
    if (key === 'createTime') return (Number(va) - Number(vb)) * factor
    if (!isNaN(va) && !isNaN(vb)) return (Number(va) - Number(vb)) * factor
    return String(va).localeCompare(String(vb)) * factor
  })
  displayRows.value = filtered
  // 过滤后回到第一页
  currentPage2.value = 1
}

function handleSizeChange(val) {
  pageSize2.value = val
  currentPage2.value = 1
}

function handleCurrentChange(val) {
  currentPage2.value = val
}

function formatDate(dateVal) {
  if (!dateVal) return ''
  try {
    const n = Number(dateVal)
    const d = isNaN(n) ? new Date(dateVal) : new Date(n)
    return d.toLocaleString('zh-CN')
  } catch { return String(dateVal) }
}
</script>

<style scoped>
.form-extractions-detail-view { background: var(--background-page); min-height:100vh; display:flex; flex-direction: column; }
.breadcrumb { padding:16px 24px; background: var(--background-color); border-bottom: 1px solid var(--border-color); }
.content { padding:16px; flex: 1; min-height: 0; display:flex; flex-direction: column; }
.content { overflow-x: hidden; }
.table-wrapper { width:100%; display:flex; }
.table-wrapper :deep(.el-table-v2__main) { max-width: 100%; }
.top-bar { display:flex; gap:8px; margin-bottom:12px; align-items: center; }
.empty { padding:60px 0; text-align:center; color:#888; }
.error { margin-bottom:12px; }

.vt2 :deep(.el-table-v2__row.row-dirty) { background: #fff7e6; }
.vt2 :deep(.el-table-v2__row.row-editing) { background: #e6f7ff; }
.custom-header-cell { display:flex; align-items:center; justify-content:center; font-weight:600; border-right:1px solid var(--el-border-color); height:40px; }
.custom-header-cell:last-child { border-right:none; }
.group-row { background: var(--el-fill-color-light); }
.leaf-row { background: var(--el-bg-color); }
.group-cell { display:flex;text-align: center; align-items:center; justify-content:center; height:30px; line-height:30px; font-weight:600; border-right:1px solid var(--el-border-color); box-sizing: border-box; }
.group-cell.single { font-weight:600; }
.group-cell:last-child { border-right:none; }
.group-cell:hover { background: var(--el-color-primary-light-9); }
.leaf-row :deep(.el-table-v2__header-cell) { font-weight:500; }
.cell-display { padding:2px 4px; cursor:default; }
.cell-display:hover { background: var(--el-fill-color-light); }
.cell-editing { padding:0 2px; }
.cell-text { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
.input-cell { width: 100%; box-sizing: border-box; padding:2px 4px; font-size:12px; }
.link { color: var(--el-color-primary); text-decoration: none; }
.link:hover { text-decoration: underline; }
.ops { display:flex; gap:6px; }
.btn { font-size:12px; padding:2px 6px; border:1px solid var(--el-border-color); border-radius:3px; background:#fff; cursor:pointer; }
.btn.primary { background: var(--el-color-primary); color:#fff; border-color: var(--el-color-primary); }
</style>
