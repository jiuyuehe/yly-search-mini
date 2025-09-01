<template>
  <div class="tags-panel">
    <div class="panel-header">
      <h3>文档标签</h3>
      <div class="actions">
        <el-input v-model="filter" placeholder="过滤" size="small" clearable class="filter-input" />
        <el-button size="small" @click="generateTags" :loading="loading">{{ loading ? '生成中...' : (displayTags.length? '重新生成':'生成标签') }}</el-button>
        <el-button size="small" :disabled="!displayTags.length" @click="openEdit">调整</el-button>
        <el-button v-if="false" size="small" :disabled="!displayTags.length" @click="copyTags">复制</el-button>
      </div>
    </div>

    <div class="tags-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="2" animated />
      </div>
      <div v-else-if="filteredTags.length" class="tags-list">
        <el-tag
          v-for="t in filteredTags"
          :key="t.tag"
          type="primary"
          effect="light"
          class="tag-item"
          size="default"
        >
          <span class="tag-text">{{ t.tag }}</span>
        </el-tag>
      </div>
      <el-empty v-else :description="error || '点击生成标签按钮开始'" />
    </div>

    <el-dialog v-model="editVisible" title="标签与权重调整" width="560px">
      <el-form label-width="0">
        <el-table :data="editTags" size="small" border height="360px" class="tags-table">
          <el-table-column prop="tag" label="标签" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.tag" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="权重" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.weight" :min="0" :max="1" :step="0.05" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeTag($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="edit-actions">
          <el-button size="small" @click="addTag">新增标签</el-button>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editVisible=false" size="small">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="saveTagAdjust">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';
import { ElMessage } from 'element-plus';
import { aiService } from '../../services/aiService';
import { fa } from 'element-plus/es/locales.mjs';

const props = defineProps({
  fileId: { type: [String, Number], required: true },
  file: { type: Object, default: null }
});

const aiToolsStore = useAiToolsStore();
const tags = ref([]); // legacy string list (if any)
const tagObjects = ref([]); // [{tag, weight}]
const loading = ref(false);
const filter = ref('');
const error = ref('');
const displayTags = computed(()=> tagObjects.value.length? tagObjects.value : tags.value.map(t=>({ tag:t, weight:0 })) );
const filteredTags = computed(()=> !filter.value? displayTags.value : displayTags.value.filter(t=> t.tag && t.tag.toLowerCase().includes(filter.value.toLowerCase())));
// 编辑弹窗
const editVisible = ref(false);
const editTags = ref([]); // 可编辑副本
const saving = ref(false);

async function generateTags() {
  if (loading.value) return;
  loading.value = true;
  try {
    error.value='';
  const res = await aiToolsStore.getTags(String(props.fileId||''), props.file||null);
  if (Array.isArray(res) && res.length && typeof res[0] === 'object') {
    tagObjects.value = res.map(r=>({ tag: r.tag, weight: Number(r.weight||0) }))
      .filter(r=> r.tag).slice(0,100);
    tags.value = tagObjects.value.map(r=>r.tag);
  } else {
    tagObjects.value = [];
    tags.value = Array.isArray(res)? res : [];
  }
  } catch (error) {
    console.error('Failed to generate tags:', error);
    error.value = error?.message || '生成失败';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
}

// 首次进入：尝试读取缓存；若无缓存且未生成过则自动生成一次
const inited = ref(false);
async function tryInitTags() {
  if (!props.file) return;
  const esId = props.file?.esId || props.file?.esid || props.file?._raw?.esId || props.file?._raw?.esid || '';
  if (!esId) { return; }
  if (inited.value) return; // 避免重复
  try {
    loading.value = true; error.value='';
    const cached = await aiService.fetchCachedTags(esId);
    if (cached && cached.length) {
      tagObjects.value = cached.map(c=>({ tag:c.tag, weight:Number(c.weight||0) })).filter(c=>c.tag);
      tags.value = tagObjects.value.map(t=>t.tag);
      inited.value = true;
    } else {
      // 自动生成一次
      await generateTags();
      inited.value = true;
    }
  } catch (e) {
    console.warn('[TagsPanel] init tags failed', e);
  } finally {
    loading.value = false;
  }
}

onMounted(()=>{ tryInitTags(); });
watch(()=> props.file?.esId || props.file?.esid, ()=> { inited.value=false; tryInitTags(); });

async function copyTags(){
  const list = tagObjects.value.length? tagObjects.value.map(t=>t.tag) : tags.value;
  if(!list.length) return;
  const txt = list.join(', ');
  try { await navigator.clipboard.writeText(txt); ElMessage.success('已复制'); } catch { ElMessage.error('复制失败'); }
}

// 列表展示不再区分权重颜色与显示权重，仅在编辑弹窗中编辑。
function openEdit(){ if (!displayTags.value.length) return; editTags.value = displayTags.value.map(t=>({ tag: t.tag, weight: Number(t.weight||0) })); editVisible.value = true; }
function addTag(){ editTags.value.push({ tag:'', weight:0 }); }
function removeTag(idx){ editTags.value.splice(idx,1); }
async function saveTagAdjust(){
  if (saving.value) return; saving.value = true;
  try {
    // 清洗
    const cleaned = editTags.value.map(t=>({ tag: (t.tag||'').trim(), weight: Math.min(1, Math.max(0, Number(t.weight||0))) }))
      .filter(t=> t.tag);
    // 排序(权重降序)
    cleaned.sort((a,b)=> b.weight - a.weight);
    tagObjects.value = cleaned;
    tags.value = cleaned.map(t=>t.tag);
    // 调用保存（后端接口占位）
    const esId = props.file?.esId || props.file?.esid || props.file?._raw?.esId || props.file?._raw?.esid || '';
    if (esId) await aiService.saveTags(esId, cleaned);
    editVisible.value = false;
    ElMessage.success('标签已更新');
  } catch (e) {
    ElMessage.error(e.message || '保存失败');
  } finally { saving.value=false; }
}

defineExpose({ generateTags });
</script>

<style scoped>
.tags-panel {
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
.actions { display:flex; gap:8px; align-items:center; }
.filter-input { width:120px; }

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.tags-content {
  flex: 1;
}

.tags-list { display:flex; flex-wrap:wrap; gap:6px; }
.tag-item { cursor:default; font-size:13px; }
.edit-actions { margin-top:8px; }
.tags-table { font-size:13px; }
.tags-table :deep(.el-input__wrapper) { padding:0 6px; }
.tags-table :deep(.el-input-number) { width:100%; }
.tags-table :deep(.el-input-number .el-input__inner) { text-align:center; }
.el-dialog :deep(.el-dialog__body) { font-size:13px; }

.loading {
  padding: 8px 0;
}
</style>
