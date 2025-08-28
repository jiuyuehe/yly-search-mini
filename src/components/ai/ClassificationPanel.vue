<template>
  <div class="classification-panel">
    <div class="panel-header">
      <h3>文档分类</h3>
      <div class="ops">
        <el-button size="small" type="primary" :loading="loadingRun" @click="runClassification">执行分类</el-button>
        <el-button size="small" @click="openManage">管理分类标签</el-button>
      </div>
    </div>

    <div class="body" v-loading="loadingRun">
      <template v-if="results.length">
        <el-table :data="results" size="small" border stripe style="width:100%">
          <el-table-column prop="category" label="类别" min-width="120" />
          <el-table-column label="概率" min-width="160">
            <template #default="{ row }">
              <div class="prob-row">
                <el-progress :percentage="(row.score*100).toFixed(1) * 1" :stroke-width="10" :status="row.score===maxScore?'success':''" />
                <span class="pct">{{ (row.score*100).toFixed(2) }}%</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else description="点击执行分类获得结果" />
    </div>

    <el-dialog v-model="manageVisible" title="分类标签管理" width="680px" class="cls-manage-dialog" @open="ensureFormsLoaded">
      <div class="manage-top">
        <el-input v-model="newName" placeholder="新增分类名称" size="small" style="width:200px" @keyup.enter="addForm" />
        <el-button size="small" type="primary" :disabled="!newName.trim()" @click="addForm">添加</el-button>
        <el-button size="small" @click="reloadForms" :loading="loadingForms">刷新</el-button>
      </div>
      <el-table :data="forms" size="small" border v-loading="loadingForms" style="margin-top:8px">
        <el-table-column type="index" width="46" />
        <el-table-column prop="name" label="名称" min-width="150">
          <template #default="{ row }">
            <div v-if="editId!==row.id" class="name-cell">
              <span>{{ row.name }}</span>
              <el-icon class="edit-icon" @click="startEdit(row)"><Edit /></el-icon>
            </div>
            <div v-else class="edit-row">
              <el-input v-model="editName" size="small" style="width:140px" />
              <el-button size="small" type="primary" @click="confirmEdit(row)">保存</el-button>
              <el-button size="small" text @click="cancelEdit">取消</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch size="small" v-model="row.enabled" @change="toggleEnabled(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-popconfirm title="删除该分类?" @confirm="removeForm(row)">
              <template #reference>
                <el-button size="small" type="danger" text>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="dlg-footer">
          <span class="hint">已启用 {{ enabledCount }} / {{ forms.length }} 个 (分类时仅使用已启用)</span>
          <el-button size="small" @click="manageVisible=false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiToolsStore } from '../../stores/aiTools'
import { Edit } from '@element-plus/icons-vue'

const props = defineProps({ fileId: { type: [String, Number], required: true } })
const store = useAiToolsStore()

const results = computed(() => store.classificationResults)
const maxScore = computed(() => results.value.reduce((m,r)=> r.score>m? r.score:m, 0))
const loadingRun = computed(() => store.loading.classification)

async function runClassification() {
  if (!props.fileId) return
  try {
    await store.classifyDocument(props.fileId)
    if (!results.value.length) {
      ElMessage.info('没有可用的分类标签或结果为空')
    }
  } catch (e) {
    ElMessage.error(e.message || '分类失败')
  }
}

// 管理弹窗
const manageVisible = ref(false)
const loadingForms = computed(()=>store.loading.classificationForms)
const forms = computed(()=>store.classificationForms)
const enabledCount = computed(()=>forms.value.filter(f=>f.enabled).length)
const newName = ref('')
const editId = ref(null)
const editName = ref('')

function openManage() { manageVisible.value = true }
async function ensureFormsLoaded() { if (!forms.value.length) await reloadForms() }
async function reloadForms() { await store.loadClassificationForms() }
async function addForm() {
  const name = newName.value.trim()
  if (!name) return
  if (forms.value.some(f=>f.name===name)) { ElMessage.warning('名称已存在'); return }
  await store.addClassificationForm(name)
  newName.value='' 
  ElMessage.success('已添加')
}
function startEdit(row){ editId.value=row.id; editName.value=row.name }
function cancelEdit(){ editId.value=null; editName.value='' }
async function confirmEdit(row){
  const name = editName.value.trim();
  if (!name) { ElMessage.warning('名称不能为空'); return }
  if (forms.value.some(f=>f.name===name && f.id!==row.id)) { ElMessage.warning('名称已存在'); return }
  await store.updateClassificationForm(row.id,{ name })
  ElMessage.success('已更新')
  cancelEdit()
}
async function toggleEnabled(row){ await store.updateClassificationForm(row.id,{ enabled: row.enabled }) }
async function removeForm(row){ await store.deleteClassificationForm(row.id); ElMessage.success('已删除') }

// 初始加载（非阻塞）
reloadForms()
</script>

<style scoped>
.classification-panel { padding:10px 12px 14px; display:flex; flex-direction:column; height:100%; }
.panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.panel-header h3 { margin:0; font-size:15px; font-weight:600; }
.ops { display:flex; gap:8px; }
.body { flex:1; overflow:auto; }
.prob-row { display:flex; align-items:center; gap:8px; }
.pct { width:55px; text-align:right; font-size:12px; color:#555; }
.cls-manage-dialog :deep(.el-dialog__body){ padding-top:4px; }
.manage-top { display:flex; gap:8px; align-items:center; }
.name-cell { display:flex; align-items:center; gap:6px; }
.edit-icon { cursor:pointer; color:#909399; font-size:14px; }
.edit-icon:hover { color: var(--el-color-primary); }
.edit-row { display:flex; align-items:center; gap:6px; }
.dlg-footer { display:flex; align-items:center; justify-content:space-between; width:100%; }
.hint { font-size:12px; color:#909399; }
</style>
