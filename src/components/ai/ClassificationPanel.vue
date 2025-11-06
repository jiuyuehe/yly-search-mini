<template>
  <div class="classification-panel">
    <div class="panel-header">
      <h3>主题分类</h3>
      <div class="ops">
        <!-- <el-select v-model="activeThemeId" clearable placeholder="(可选) 选择主题" size="small" style="width:200px" @change="onThemeChange" :loading="loadingThemes">
          <el-option v-for="t in themes" :key="t.id" :label="t.name" :value="t.id" />
        </el-select> -->
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
          <el-table-column label="匹配度" min-width="90">
            <template #default="{ row }">
              <span class="match-score" :class="{ top: isTop(row) }">{{ formatPercent(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="理由" min-width="300">
            <template #default="{ row }">
              <span v-if="row.reason" class="reason-text">{{ row.reason }}</span>
              <span v-else class="reason-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="98">
            <template #default="{ row }">
                <template v-if="row.isPersisted">
                  <el-button size="small" type="warning" text @click="cancelAssociation(row)">取消关联</el-button>
                </template>
                <template v-else>
                  <template v-if="selectedPickId===row.id">
                    <el-icon class="picked-icon"><Check /></el-icon>
                  </template>
                  <el-button v-else size="small" type="success" text @click="confirmPick(row)">选用</el-button>
                </template>
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
        <el-table-column label="关联" width="80">
          <template #default="{ row }">
            <el-checkbox :model-value="confirmedThemeId===row.id" disabled />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiToolsStore } from '../../stores/aiTools'
import { Edit, Check } from '@element-plus/icons-vue'
import { aiService } from '../../services/aiService'

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
// persisted matches loaded from getThemeMatches(esId)
const persistedMatches = ref([])

// 统一获取 esId: 优先外部显式传入，其次 file 对象链路 (参考 TagsPanel)
const effectiveEsId = computed(()=> {
  return props.esId || props.file?.esId || props.file?.esid || props.file?._raw?.esId || props.file?._raw?.esid || ''
})

// Tags now come directly from row.tags (page API), no per-theme label map needed here

// Classification results
const runningClassify = computed(()=> store.loading.themeClassify )
const classificationList = computed(()=>{
  // If a specific theme is selected, show its classification results from the store
  if(activeThemeId.value){
    if(store.themeClassification.themeId === activeThemeId.value) return store.themeClassification.results;
    return [];
  }
  // If we have persisted matches from the server for this document, show them first
  if(persistedMatches.value && persistedMatches.value.length) return persistedMatches.value;
  // Otherwise show global classification results (themeId === null)
  if(store.themeClassification.themeId==null) return store.themeClassification.results;
  return [];
})
// maxScore 使用百分比值以便和 scorePercent 对齐
const maxScore = computed(()=> classificationList.value.reduce((m,r)=>{
  const pct = calcPercent(r);
  return pct>m?pct:m;
},0))

// 选中的推荐
const selectedPickId = ref(null)
const confirmedThemeId = ref(null)

function calcPercent(row){
  // 优先使用 scorePercent；若 <1 认为是 rawScore
  if(row.scorePercent !== undefined && row.scorePercent !== null){
    const sp = Number(row.scorePercent);
    if(Number.isFinite(sp)) return sp <=1 ? sp*100 : sp; // 兼容误传 0-1
  }
  const base = (row.rawScore !== undefined && row.rawScore !== null) ? Number(row.rawScore) : Number(row.score || 0);
  if(Number.isFinite(base)) return base<=1? base*100 : base;
  return 0;
}
function formatPercent(row){ const pct = calcPercent(row); return Number.isFinite(pct)? pct.toFixed(2)+'%' : '-'; }
function isTop(row){ const pct = calcPercent(row); return Math.abs(pct - maxScore.value) < 1e-6; }

// onThemeChange removed (unused) - theme label loading now triggered where needed

async function runThemeClassification(){
  const esIdVal = effectiveEsId.value;
  if(!esIdVal){
    ElMessage.warning('缺少 esId，无法分类');
    return;
  }
  // debug removed
  await store.classifyTheme({ esId: esIdVal, themeId: activeThemeId.value || undefined })
  if(!classificationList.value.length){ ElMessage.info('无推荐结果') }
}

function confirmPick(row){
  (async ()=>{
    const esid = effectiveEsId.value;
    if(!esid){ ElMessage.warning('缺少 esId，无法确认主题'); return; }
    try{
      // New API: send the full row object (backend will persist the association)
      const res = await aiService.confirmTheme({ esId: esid, row });
      if(res && res.success){
        selectedPickId.value = row.id || row.themeId || row.theme?.id || row.labelId || null;
        confirmedThemeId.value = row.themeId || row.theme?.id || row.id || null;
        ElMessage.success('已选用主题: '+ (row.themeName || row.label || row.name));
      } else {
        ElMessage.error(res?.message || '确认失败');
      }
    } catch(e){ ElMessage.error('确认主题出错'); console.warn(e); }
  })();
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
  // fetch confirmed theme for this document and mark association
  try{
    const esid = effectiveEsId.value;
    if(esid){
        const matches = await aiService.getThemeMatches(esid);
        // API may return { code:0, data:{ theme: [...] } } or other shapes.
        let arr = null;
        if(matches){
          if(Array.isArray(matches)) arr = matches;
          else if(Array.isArray(matches.data?.theme)) arr = matches.data.theme;
          else if(Array.isArray(matches.theme)) arr = matches.theme;
        }
        if(arr && arr.length){
                const mapped = arr.map((r,i)=>({
                  id: r.themeId || r.id || `pm_${i}`,
                  themeId: r.themeId || r.id || null,
                  themeName: r.themeName || r.theme || r.name || '',
                  rawScore: r.rawScore !== undefined ? Number(r.rawScore) : (r.scorePercent!==undefined? Number(r.scorePercent)/100 : 0),
                  scorePercent: r.scorePercent !== undefined ? Number(r.scorePercent) : (r.rawScore!==undefined? Number(r.rawScore)*100 : 0),
                  reason: r.reason || r.explain || '',
                  isPersisted: true,
                  raw: r
                }));
                const first = mapped[0];
                confirmedThemeId.value = first?.themeId || first?.id || null;
                persistedMatches.value = mapped; // Populate persistedMatches with the fetched matches
        } else {
          // no persisted matches, run classification to get recommendations
          await runThemeClassification();
        }
    }
  } catch(e){ console.warn('load confirmed theme failed', e); }
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

async function cancelAssociation(row){
  const esid = effectiveEsId.value;
  if(!esid){ ElMessage.warning('缺少 esId，无法取消关联'); return; }
  try{
    const themeId = row.themeId || row.theme?.id || row.id || row.labelId || row.themeId;
    const res = await aiService.unconfirmTheme({ esId: esid, themeId });
    if(res && res.success){
      // remove from persistedMatches
      persistedMatches.value = persistedMatches.value.filter(m=> m.id !== row.id && m.themeId !== row.themeId);
      if(confirmedThemeId.value === row.themeId) confirmedThemeId.value = null;
      ElMessage.success('已取消关联');
    } else {
      ElMessage.error(res?.message || '取消关联失败');
    }
  } catch(e){ ElMessage.error('取消关联出错'); console.warn(e); }
}

// initial load
onMounted(async ()=>{
  // ensure theme list available
  await loadThemes();
  // if we have an esId, try to fetch any previously confirmed theme first
  const esid = effectiveEsId.value;
  if(esid){
    try{
      const matches = await aiService.getThemeMatches(esid);
      let arr = null;
      if(matches){
        if(Array.isArray(matches)) arr = matches;
        else if(Array.isArray(matches.data?.theme)) arr = matches.data.theme;
        else if(Array.isArray(matches.theme)) arr = matches.theme;
      }
      if(arr && arr.length){
            const mapped = arr.map((r,i)=>({
              id: r.themeId || r.id || `pm_init_${i}`,
              themeId: r.themeId || r.id || null,
              themeName: r.themeName || r.theme || r.name || '',
              rawScore: r.rawScore !== undefined ? Number(r.rawScore) : (r.scorePercent!==undefined? Number(r.scorePercent)/100 : 0),
              scorePercent: r.scorePercent !== undefined ? Number(r.scorePercent) : (r.rawScore!==undefined? Number(r.rawScore)*100 : 0),
              reason: r.reason || r.explain || '',
              isPersisted: true,
              raw: r
            }));
            const first = mapped[0];
            confirmedThemeId.value = first?.themeId || first?.id || null;
            persistedMatches.value = mapped; // populate persistedMatches for initial load
      } else {
        // no persisted matches -> run classification
        await runThemeClassification();
      }
    } catch(e){
      console.warn('[Classification] initial load theme matches failed', e);
      // fallback: best-effort to run classification
      try{ await runThemeClassification(); } catch { /* ignore */ }
    }
  }
})
</script>

<style scoped>
.classification-panel { padding:10px 12px 14px; display:flex; flex-direction:column; height:100%; }
.panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.panel-header h3 { margin:0; font-size: var(--font-size-md-plus); font-weight:600; }
.ops { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.body { flex:1; overflow:auto; }
.prob-row { display:flex; align-items:center; gap:8px; }
.pct { width:55px; text-align:right; font-size: var(--font-size-xs); color:#555; }
.match-score { font-size: var(--font-size-sm); font-weight:500; color:#444; }
.match-score.top { color: var(--el-color-success); font-weight:600; }
.manage-top { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.name-cell { display:flex; align-items:center; gap:6px; }
.edit-icon { cursor:pointer; color:var(--text-color-placeholder); font-size: var(--font-size-md); }
.edit-icon:hover { color: var(--el-color-primary); }
.edit-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.tags-inline { display:flex; align-items:center; flex-wrap:wrap; gap:4px; }
.tag-item { margin:2px 0; }
.inline-add-btn { padding:0 4px; }
.quick-add { display:flex; align-items:center; gap:6px; margin-top:4px; flex-wrap:wrap; }
.more-indicator { font-size: var(--font-size-xs); color:var(--text-color-secondary); margin:0 4px; }
.pagination-wrapper { margin-top:8px; display:flex; justify-content:flex-end; }
.table-toolbar .stats { font-size: var(--font-size-xs); color:var(--text-color-secondary); }
.table-toolbar .actions { display:flex; gap:8px; }
</style>
