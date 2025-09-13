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
      <div v-if="props.type !== 'copy'" style="padding:8px 12px; border-top:1px solid #f0f0f0; display:flex; gap:8px; align-items:center;">
        <div style="font-size:12px;color:#606266;white-space:nowrap;">文件名：</div>
        <el-input v-model="customFileName" size="small" placeholder="输入保存的文件名，如 note.txt" style="flex:1" clearable />
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

const props = defineProps({ file: { type: Object, default: null }, type: { type: String, default: 'create' }, defaultFileName: { type: String, default: '' } });
const emit = defineEmits(['confirm']);

const loading = ref(false);
const visible = ref(false);
const treeLoading = ref(false);
const treeData = ref([]);
const currentNode = ref(null);
const treeRef = ref();
const keyword = ref('');
const customFileName = ref('');
let _rootLoadPromise = null;

function open(){
  // prefill filename only when empty to avoid overwriting user input
  if (!customFileName.value) {
    if (props.defaultFileName) {
      customFileName.value = props.defaultFileName;
    } else if (props.file && props.file.fileName) {
      const name = props.file.fileName;
      const idx = name.lastIndexOf('.');
      const base = idx > 0 ? name.slice(0, idx) : name;
      customFileName.value = `${base}-译文.txt`;
    } else {
      customFileName.value = '';
    }
  }
  visible.value = true;
}

function refreshRoot(){
  loadRoot();
}

async function loadRoot(){
  if (_rootLoadPromise) return _rootLoadPromise;
  treeLoading.value = true;
  _rootLoadPromise = (async () => {
    try {
      treeData.value = await fetchFolderTree({ parentId: null });
      return treeData.value;
    } finally { treeLoading.value = false; _rootLoadPromise = null; }
  })();
  return _rootLoadPromise;
}

async function loadNode(node, resolve) {
  try {
    let parentId;
    if (node.level === 0) {
      // 根节点，加载顶级目录（即 parentId 为 null 的文件夹）
      parentId = null;
    } else {
      // 子节点，加载该节点的子目录
      parentId = node.data.fileId;
    }

    const children = await fetchFolderTree({ parentId });
    resolve(children || []); // 返回当前节点的子节点
  } catch (e) {
    console.warn('[CloudSave] loadNode error', e);
    resolve([]); // 出错时返回空数组
  }
}

function handleCurrentChange(data){ currentNode.value = data; }

function filterNode(val, data){ if(!val) return true; return data.name && data.name.toLowerCase().includes(val.toLowerCase()); }
function filterChange(){ treeRef.value && treeRef.value.filter(keyword.value); }

async function confirm(){
  if(!currentNode.value){ ElMessage.warning('请选择目标目录'); return; }
  loading.value = true;
  try {
    if (props.type === 'copy') {
      // copy existing file into selected folder
      const fc = props.file?.fileCategory || props.file?.fc;
      if (fc === 'nas') {
        const taskId = await createNasExportTask({ file: props.file, targetParentId: currentNode.value.fileId });
        await pollNasExportTask(taskId, {});
      } else {
        await copyPublicToPersonal({ file: props.file, targetFolderId: currentNode.value.fileId });
      }
      visible.value = false;
      ElMessage.success('已保存到云盘');
    } else {
      // create new file in selected folder
      visible.value = false;
      const payload = Object.assign({}, currentNode.value, { fileName: customFileName.value && String(customFileName.value).trim() ? String(customFileName.value).trim() : undefined });
      emit('confirm', payload);
      ElMessage.success('已选择目标目录');
    }
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
