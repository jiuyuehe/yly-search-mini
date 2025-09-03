<template>
  <div style="display:inline">
    <el-button size="small" text :loading="loading" @click="open" title="保存到我的云盘">
      <span style="font-size:15px;">📁</span>
      <span style="margin-left:2px;">云盘</span>
    </el-button>
    <el-dialog v-model="visible" title="保存至我的云盘" width="520px">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          size="small"
          placeholder="搜索当前层..."
          clearable
          @input="filterChange"
          style="width:220px;"
        />
        <el-button size="small" link @click="refreshRoot" :disabled="treeLoading">刷新</el-button>
      </div>
      <div class="tree-wrap" v-loading="treeLoading">
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="treeProps"
          node-key="fileId"
          highlight-current
          lazy
          :load="loadNode"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          @current-change="handleCurrentChange"
          class="cloud-tree"
        >
          <template #default="{ data }">
            <span class="node-row">
              <span class="label" :title="data.name">{{ data.name }}</span>
            </span>
          </template>
        </el-tree>
      </div>
      <div class="select-info" v-if="currentNode">
        目标目录：<strong>{{ currentNode.name }}</strong>
      </div>
      <template #footer>
        <el-button @click="visible=false" size="small">取消</el-button>
        <el-button type="primary" size="small" :loading="loading" @click="confirm" :disabled="!currentNode">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchFolderTree, copyPublicToPersonal, createNasExportTask, pollNasExportTask } from '../../services/cloudSave';

const props = defineProps({ file: { type: Object, default: null } });

const loading = ref(false);
const visible = ref(false);
const treeLoading = ref(false);
const treeData = ref([]);
const currentNode = ref(null);
const treeRef = ref();
const keyword = ref('');

const treeProps = { label: 'name', children: 'children', isLeaf: (data)=> data.isLeaf === true || data.dir === false };

function open(){ visible.value = true; if(!treeData.value.length) refreshRoot(); }

function refreshRoot(){ loadRoot(); }

async function loadRoot(){
  treeLoading.value = true;
  try {
    treeData.value = await fetchFolderTree({ parentId:0 });
  } finally { treeLoading.value = false; }
}

async function loadNode(node, resolve){
  // root
  if(node.level === 0){
    if(!treeData.value.length){ await loadRoot(); }
    return resolve(treeData.value);
  }
  const data = node.data;
  try {
    const children = await fetchFolderTree({ parentId: data.fileId });
    resolve(children || []);
  } catch(e){ console.warn('[CloudSave] loadNode error', e); resolve([]); }
}

function handleCurrentChange(data){ currentNode.value = data; }

function filterNode(val, data){ if(!val) return true; return data.name && data.name.toLowerCase().includes(val.toLowerCase()); }
function filterChange(){ treeRef.value && treeRef.value.filter(keyword.value); }

async function confirm(){
  if(!currentNode.value){ ElMessage.warning('请选择目标目录'); return; }
  loading.value = true;
  try {
    const fc = props.file?.fileCategory || props.file?.fc;
    if(fc === 'nas'){
      const taskId = await createNasExportTask({ file: props.file, targetParentId: currentNode.value.fileId });
      await pollNasExportTask(taskId,{});
    } else {
      await copyPublicToPersonal({ file: props.file, targetFolderId: currentNode.value.fileId });
    }
    visible.value = false;
    ElMessage.success('已保存到云盘');
  } catch(e){
    console.warn('[CloudSave] save failed', e);
    ElMessage.error('保存失败');
  } finally { loading.value = false; }
}
</script>

<style scoped>
.toolbar { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.tree-wrap { max-height:340px; overflow:auto; border:1px solid #ebeef5; border-radius:4px; padding:6px 4px; }
.cloud-tree { font-size:13px; }
.node-row { display:flex; align-items:center; gap:6px; line-height:20px; }
.node-row .label { max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.select-info { margin-top:8px; font-size:12px; color:#555; }
</style>
