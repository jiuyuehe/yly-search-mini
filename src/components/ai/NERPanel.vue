<template>
  <div class="ner-panel">
    <div class="panel-header">
      <h3>实体识别</h3>
      <div class="actions">
        <el-button size="small" @click="recognizeEntities" :loading="loading">{{ loading? '识别中...' : (hasData? '重新识别':'识别实体') }}</el-button>
        <el-button size="small" :disabled="!hasData" @click="openEdit">手动调整</el-button>
        <el-button size="small" :disabled="!hasData" @click="copyAll">复制</el-button>
      </div>
    </div>
    
    <div class="entities-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>
  <div v-else-if="hasData" class="entities-list">
        <div v-if="entities.persons?.length" class="entity-group">
          <h4>人员</h4>
          <el-tag v-for="person in entities.persons" :key="person" type="success">{{ person }}</el-tag>
        </div>
        <div v-if="entities.organizations?.length" class="entity-group">
          <h4>组织</h4>
          <el-tag v-for="org in entities.organizations" :key="org" type="warning">{{ org }}</el-tag>
        </div>
        <div v-if="entities.locations?.length" class="entity-group">
          <h4>地点</h4>
          <el-tag v-for="loc in entities.locations" :key="loc" type="danger">{{ loc }}</el-tag>
        </div>
        <div v-if="entities.dates?.length" class="entity-group">
          <h4>日期</h4>
          <el-tag v-for="date in entities.dates" :key="date" type="info">{{ date }}</el-tag>
        </div>
        <div v-if="entities.others?.length" class="entity-group">
          <h4>其它</h4>
          <el-tag v-for="o in entities.others" :key="o" type="info">{{ o }}</el-tag>
        </div>
      </div>
      <el-empty v-else :description="error || '自动获取缓存，无数据时可点击识别实体'" />
    </div>

    <el-dialog v-model="editVisible" title="编辑实体" width="640px" append-to-body class="ner-edit-dialog">
      <div class="edit-groups">
        <div v-for="g in editGroups" :key="g.key" class="edit-group">
          <div class="eg-header">
            <span class="eg-title">{{ g.label }}</span>
            <el-button link type="primary" size="small" @click="addEntity(g.key)">添加</el-button>
          </div>
          <div class="eg-list">
            <div v-for="(val,idx) in draft[g.key]" :key="idx" class="eg-item">
              <el-input v-model="draft[g.key][idx]" size="small" placeholder="输入实体值" />
              <el-button circle size="small" type="danger" plain @click="removeEntity(g.key, idx)">-</el-button>
            </div>
            <div v-if="!draft[g.key].length" class="empty-hint">无</div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button size="small" @click="editVisible=false">取消</el-button>
          <el-button size="small" type="primary" :loading="saving" @click="saveChanges">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';
import { ElMessage } from 'element-plus';
import { aiService } from '../../services/aiService';
import { resolveEsId } from '../../utils/esid';

const props = defineProps({
  fileId: { type: [String, Number], required: true },
  file: { type: Object, default: null }
});

const aiToolsStore = useAiToolsStore();
const entities = ref({});
const loading = ref(false);
const error = ref('');
const initTried = ref(false);
const editVisible = ref(false);
const saving = ref(false);
const draft = ref({ persons:[], organizations:[], locations:[], dates:[], others:[] });
const editGroups = [
  { key:'persons', label:'人员' },
  { key:'organizations', label:'组织' },
  { key:'locations', label:'地点' },
  { key:'dates', label:'日期' },
  { key:'others', label:'其它' }
];
const hasData = computed(()=>{
  if(!entities.value) return false;
  return ['persons','organizations','locations','dates','others'].some(k=> Array.isArray(entities.value[k]) && entities.value[k].length);
});

function syncDraftFromEntities() {
  draft.value = {
    persons:[...(entities.value.persons||[])],
    organizations:[...(entities.value.organizations||[])],
    locations:[...(entities.value.locations||[])],
    dates:[...(entities.value.dates||[])],
    others:[...(entities.value.others||[])]
  };
}

async function initIfNeeded() {
  if (initTried.value) return;
  initTried.value = true;
  const esId = resolveEsId(props.file, props.fileId);
  if (!esId) return;
  loading.value = true; error.value='';
  try {
    const cached = await aiService.fetchCachedNER(esId);
    if (cached) {
      entities.value = cached;
      syncDraftFromEntities();
    } else {
      // auto generate once
      await recognizeEntities();
    }
  } catch (e) {
    console.warn('init ner failed', e);
  } finally {
    loading.value = false;
  }
}

async function recognizeEntities() {
  if (loading.value) return;
  loading.value = true;
  error.value='';
  entities.value = {};
  try {
  const res = await aiToolsStore.getNEREntities(String(props.fileId||''), props.file||null);
  entities.value = res && typeof res === 'object' ? res : {};
  syncDraftFromEntities();
  } catch (e) {
    console.error('Failed to recognize entities:', e);
    error.value = e?.message || '识别失败';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
}

async function copyAll() {
  if (!hasData.value) return;
  const lines = [];
  const groups = { 人员:'persons', 组织:'organizations', 地点:'locations', 日期:'dates', 其它:'others' };
  Object.entries(groups).forEach(([label,key])=>{ const arr = entities.value[key]; if (arr?.length) lines.push(`${label}: ${arr.join(', ')}`); });
  try { await navigator.clipboard.writeText(lines.join('\n')); ElMessage.success('已复制'); } catch { ElMessage.error('复制失败'); }
}

function openEdit() {
  if (!hasData.value) return;
  syncDraftFromEntities();
  editVisible.value = true;
}
function addEntity(groupKey) { draft.value[groupKey].push(''); }
function removeEntity(groupKey, idx) { draft.value[groupKey].splice(idx,1); }

async function saveChanges() {
  saving.value = true;
  const esId = resolveEsId(props.file, props.fileId);
  try {
    const cleaned = {};
    Object.keys(draft.value).forEach(k=>{ cleaned[k] = draft.value[k].map(v=> (v||'').trim()).filter(Boolean); });
    const resp = await aiService.saveNER(esId, cleaned);
    if (resp.success) {
      entities.value = cleaned;
      editVisible.value = false;
      ElMessage.success('已保存');
    } else {
      ElMessage.error(resp.message || '保存失败');
    }
  } catch (e) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

watch(()=>props.fileId, ()=>{ initTried.value = false; initIfNeeded(); });
onMounted(()=>{ initIfNeeded(); });
</script>

<style scoped>
.ner-panel {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.actions { display:flex; gap:8px; }

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.entities-content {
  flex: 1;
  overflow-y: auto;
}

.ner-edit-dialog :deep(.el-dialog__body) { padding-top:8px; }
.edit-groups { display:flex; flex-wrap:wrap; gap:16px; }
.edit-group { width:280px; border:1px solid #ebeef5; padding:8px 10px; border-radius:6px; background:#fafafa; }
.eg-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.eg-title { font-size:13px; font-weight:600; }
.eg-list { display:flex; flex-direction:column; gap:6px; }
.eg-item { display:flex; gap:6px; align-items:center; }
.eg-item .el-input { flex:1; }
.empty-hint { font-size:12px; color:#999; }
.dialog-footer { text-align:right; width:100%; }

.entity-group {
  margin-bottom: 15px;
}

.entity-group h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.entity-group .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.entity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
