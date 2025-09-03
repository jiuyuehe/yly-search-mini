<template>
  <div class="classification-panel">
    <div class="panel-header">
      <h3>主题分类</h3>
      <div class="ops">
        <el-select v-model="activeThemeId" clearable placeholder="(可选) 选择主题" size="small" style="width:200px" @change="onThemeChange" :loading="loadingThemes">
          <el-option v-for="t in themes" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <el-button size="small" type="primary" :disabled="runningClassify" :loading="runningClassify" @click="runThemeClassification">执行分类</el-button>
        <el-button size="small" @click="openThemeManage">管理分类</el-button>
      </div>
    </div>

    <div class="body" v-loading="runningClassify">
      <template v-if="classificationList.length">
        <el-table :data="classificationList" size="small" border stripe>
          <el-table-column v-if="!activeThemeId" prop="themeName" label="主题" min-width="140">
            <template #default="{ row }">
              <span>{{ themeNameMap[row.themeId] || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="匹配度" min-width="120">
            <template #default="{ row }">
              <span class="match-score" :class="{ top: ((row.scorePercent ?? (row.score*100))===maxScore) }">{{ (row.scorePercent ?? (row.score*100)).toFixed(2) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="确认" width="90">
            <template #default="{ row }">
              <el-button size="small" type="success" text @click="confirmPick(row)">选用</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else description="执行分类获取推荐标签 (主题可不选)" />
    </div>

    <!-- 主题管理 -->
    <el-dialog v-model="themeDlgVisible" title="主题分类" width="960px" @open="onThemeDialogOpen">
      <div class="manage-top">
        <el-input v-model="newThemeName" placeholder="新增主题名称" size="small" style="width:200px" @keyup.enter="addTheme" />
        <el-input v-model="newThemeDesc" placeholder="描述(可选)" size="small" style="width:200px" />
        <el-button size="small" type="primary" :disabled="!newThemeName.trim()" @click="addTheme">添加</el-button>
      </div>
      <div class="table-toolbar" style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
        <div class="stats">共 {{ themesTotal }} 个主题</div>
        <div class="actions">
          <el-button size="small" :loading="loadingThemes" @click="loadThemes(themesPageNo, themesPageSize)">刷新</el-button>
        </div>
      </div>
      <el-table :data="themes" size="small" border :loading="loadingThemes" style="margin-top:6px">
        <el-table-column type="index" width="46" />
        <el-table-column prop="name" label="名称" min-width="160">
          <template #default="{ row }">
            <div v-if="editThemeId!==row.id" class="name-cell">
              <span>{{ row.name }}</span>
              <el-icon class="edit-icon" @click="startEditTheme(row)"><Edit /></el-icon>
            </div>
            <div v-else class="edit-row">
              <el-input v-model="editThemeName" size="small" style="width:140px" />
              <el-input v-model="editThemeDesc" size="small" style="width:160px" placeholder="描述" />
              <el-button size="small" type="primary" @click="confirmEditTheme(row)">保存</el-button>
              <el-button size="small" text @click="cancelEditTheme">取消</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="260">
          <template #default="{ row }">
            <div class="tags-inline">
              <template v-for="lbl in (row.tags || row.labels || []).slice(0, maxInlineTags)" :key="lbl.id">
                <el-tooltip v-if="lbl.synonyms" :content="'同义词: '+lbl.synonyms" placement="top">
                  <el-tag closable @close="removeLabel(row.id,lbl)" :type="lbl.enabled ? '' : 'info'" size="small" effect="light" class="tag-item">
                    {{ displayLabelName(lbl) }}
                  </el-tag>
                </el-tooltip>
                <el-tag v-else closable @close="removeLabel(row.id,lbl)" :type="lbl.enabled ? '' : 'info'" size="small" effect="light" class="tag-item">
                  {{ displayLabelName(lbl) }}
                </el-tag>
              </template>
              <span v-if="(row.tags || row.labels || []).length > maxInlineTags" class="more-indicator">+{{ (row.tags || row.labels || []).length - maxInlineTags }}</span>
              <el-button type="info" plain size="small" class="inline-add-btn" @click="startQuickAdd(row.id)" v-if="quickAddThemeId!==row.id">+添加</el-button>
            </div>
            <div v-if="quickAddThemeId===row.id" class="quick-add">
              <el-input v-model="quickLabelName" size="small" placeholder="名称" style="width:100px" @keyup.enter="confirmQuickAdd(row.id)" />
              <el-input v-model="quickLabelWeight" size="small" placeholder="权重" style="width:80px" @keyup.enter="confirmQuickAdd(row.id)" />
              <el-button size="small" type="primary" :disabled="!quickLabelName.trim()" @click="confirmQuickAdd(row.id)">保存</el-button>
              <el-button size="small" text @click="cancelQuickAdd">取消</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch size="small" v-model="row.enabled" @change="toggleThemeEnabled(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110">
          <template #default="{ row }">
            <el-popconfirm title="删除该主题?" @confirm="removeTheme(row)">
              <template #reference>
                <el-button size="small" type="danger" text>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="store.themesPageNo"
          v-model:page-size="store.themesPageSize"
          :total="themesTotal"
          :page-sizes="[10,20,30,50]"
          small
          background
          layout="prev, pager, next, jumper, ->, sizes, total"
          @current-change="(p)=>loadThemes(p, themesPageSize)"
          @size-change="(s)=>loadThemes(1, s)"
        />
      </div>
      <template #footer>
        <el-button size="small" @click="themeDlgVisible=false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiToolsStore } from '../../stores/aiTools'
import { Edit } from '@element-plus/icons-vue'

const props = defineProps({ fileId: { type: [String, Number], required: true }, fileText: { type:String, default:'' }, esId:{ type:String, default:'' }, file:{ type:Object, default:null } })
const store = useAiToolsStore()

// Themes
const themes = computed(()=> store.themes)
const loadingThemes = computed(()=> store.loading.themes)
const themesTotal = computed(()=> store.themesTotal)
const themesPageNo = computed(()=> store.themesPageNo)
const themesPageSize = computed(()=> store.themesPageSize)
const activeThemeId = ref(null)
const themeNameMap = computed(()=> Object.fromEntries(themes.value.map(t=>[t.id, t.name])))

// 统一获取 esId: 优先外部显式传入，其次 file 对象链路 (参考 TagsPanel)
const effectiveEsId = computed(()=> {
  return props.esId || props.file?.esId || props.file?.esid || props.file?._raw?.esId || props.file?._raw?.esid || ''
})

// Tags now come directly from row.tags (page API), no per-theme label map needed here

// Classification results
const runningClassify = computed(()=> store.loading.themeClassify )
const classificationList = computed(()=>{
  // 当未选择主题时, 使用全局结果(themeId 为 null)
  if(!activeThemeId.value && store.themeClassification.themeId==null) return store.themeClassification.results;
  if(store.themeClassification.themeId === activeThemeId.value) return store.themeClassification.results;
  return [];
})
// maxScore 使用百分比值以便和 scorePercent 对齐
const maxScore = computed(()=> classificationList.value.reduce((m,r)=>{
  const pct = (r.scorePercent !== undefined) ? Number(r.scorePercent) : (Number(r.score||0)*100);
  return pct>m?pct:m;
},0))

function onThemeChange(){ if(activeThemeId.value){ store.loadThemeLabels(activeThemeId.value) } }

async function runThemeClassification(){
  const esIdVal = effectiveEsId.value;
  if(!esIdVal){
    ElMessage.warning('缺少 esId，无法分类');
    return;
  }
  console.debug('[Classification] runThemeClassification', { esId: esIdVal, themeId: activeThemeId.value });
  await store.classifyTheme({ esId: esIdVal, themeId: activeThemeId.value || undefined })
  if(!classificationList.value.length){ ElMessage.info('无推荐结果') }
}

function confirmPick(row){
  ElMessage.success('已选择标签: '+ row.label)
  // 后续可在此调用保存接口: /admin-api/rag/ai/theme/label/apply (示例，若后端有)
}

// Theme management
const themeDlgVisible = ref(false)
const newThemeName = ref('')
const newThemeDesc = ref('')
const editThemeId = ref(null)
const editThemeName = ref('')
const editThemeDesc = ref('')
function openThemeManage(){ themeDlgVisible.value=true }
async function loadThemes(pageNo=themesPageNo.value, pageSize=themesPageSize.value){ await store.loadThemesPage(pageNo,pageSize) }
async function onThemeDialogOpen(){
  await loadThemes(1, themesPageSize.value)
}
async function addTheme(){ const name=newThemeName.value.trim(); if(!name) return; const res= await store.createTheme({ name, description:newThemeDesc.value.trim() }); if(res.success){ ElMessage.success('已创建'); newThemeName.value=''; newThemeDesc.value=''; } else ElMessage.error(res.message||'创建失败') }
function startEditTheme(row){ editThemeId.value=row.id; editThemeName.value=row.name; editThemeDesc.value=row.description||'' }
function cancelEditTheme(){ editThemeId.value=null; editThemeName.value=''; editThemeDesc.value='' }
async function confirmEditTheme(row){ const name=editThemeName.value.trim(); if(!name){ ElMessage.warning('名称不能为空'); return } const res= await store.updateTheme({ id: row.id, name, description: editThemeDesc.value.trim(), enabled: row.enabled }); if(res.success){ ElMessage.success('已更新'); cancelEditTheme(); } else ElMessage.error(res.message||'更新失败') }
async function toggleThemeEnabled(row){ await store.updateTheme({ id: row.id, enabled: row.enabled }) }
async function removeTheme(row){ const res= await store.deleteTheme(row.id); if(res.success!==false) ElMessage.success('已删除'); if(activeThemeId.value===row.id) activeThemeId.value=null }

async function removeLabel(themeId, lbl){ const res= await store.deleteThemeLabel(lbl.id, themeId); if(res.success!==false) ElMessage.success('已删除') }

// inline quick add tag
const quickAddThemeId = ref(null)
const quickLabelName = ref('')
const quickLabelWeight = ref('')
const maxInlineTags = 6
function startQuickAdd(themeId){ quickAddThemeId.value=themeId; quickLabelName.value=''; quickLabelWeight.value=''; }
function cancelQuickAdd(){ quickAddThemeId.value=null; }
async function confirmQuickAdd(themeId){ const name=quickLabelName.value.trim(); if(!name) return; const weight = quickLabelWeight.value.trim(); const res= await store.createThemeLabel({ themeId, name, description: weight, weight: weight ? Number(weight) : undefined }); if(res.success){ ElMessage.success('已添加'); quickAddThemeId.value=null; } else { ElMessage.error(res.message||'添加失败') } }
function displayLabelName(lbl){ return lbl.name || lbl.keyword || lbl.label || lbl.title || '未命名' }

// initial load
loadThemes()
</script>

<style scoped>
.classification-panel { padding:10px 12px 14px; display:flex; flex-direction:column; height:100%; }
.panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.panel-header h3 { margin:0; font-size:15px; font-weight:600; }
.ops { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.body { flex:1; overflow:auto; }
.prob-row { display:flex; align-items:center; gap:8px; }
.pct { width:55px; text-align:right; font-size:12px; color:#555; }
.match-score { font-size:13px; font-weight:500; color:#444; }
.match-score.top { color: var(--el-color-success); font-weight:600; }
.manage-top { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.name-cell { display:flex; align-items:center; gap:6px; }
.edit-icon { cursor:pointer; color:#909399; font-size:14px; }
.edit-icon:hover { color: var(--el-color-primary); }
.edit-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.tags-inline { display:flex; align-items:center; flex-wrap:wrap; gap:4px; }
.tag-item { margin:2px 0; }
.inline-add-btn { padding:0 4px; }
.quick-add { display:flex; align-items:center; gap:6px; margin-top:4px; flex-wrap:wrap; }
.more-indicator { font-size:12px; color:#666; margin:0 4px; }
.pagination-wrapper { margin-top:8px; display:flex; justify-content:flex-end; }
.table-toolbar .stats { font-size:12px; color:#666; }
.table-toolbar .actions { display:flex; gap:8px; }
</style>
