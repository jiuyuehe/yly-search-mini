<template>
  <div class="no-perm-wrapper">

    <template v-if="loadingHistory">
      <el-skeleton :rows="3" animated style="width:260px;" />
    </template>
    <template v-else>
      <!-- 已有申请记录 -->
      <div v-if="hasHistory" class="history-box">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          title="已提交申请，等待审批通过后即可访问"
        />
        <el-table :data="historyRows" size="small" style="width:100%; margin-top:10px;" v-if="historyRows.length">
          <el-table-column prop="applyTime" label="申请时间" width="160" />
            <el-table-column prop="applyDesc" label="说明" />
            <el-table-column prop="permissions" label="权限" width="100">
              <template #default="{ row }">{{ renderPerm(row.permissions) }}</template>
            </el-table-column>
            <el-table-column prop="applyStatus" label="状态" width="90">
              <template #default="{ row }">
                <el-tag type="info" v-if="row.applyStatus===0">待审批</el-tag>
                <el-tag type="success" v-else-if="row.applyStatus===1">已通过</el-tag>
                <el-tag type="danger" v-else-if="row.applyStatus===2">已拒绝</el-tag>
                <el-tag type="warning" v-else>未知</el-tag>
              </template>
            </el-table-column>
        </el-table>
      </div>
      <!-- 新申请按钮 -->
      <div v-else class="apply-actions">
        <el-button type="primary" :loading="applying" @click="openDialog">申请预览权限</el-button>
      </div>
    </template>

    <el-empty :description="descText" />
    
    <el-dialog v-model="dialogVisible" title="申请访问权限" width="420px" :close-on-click-modal="false">
      <el-form :model="form" label-width="90px" :disabled="submitting">
        <el-form-item label="权限类型">
          <el-select v-model="form.permissionKey" placeholder="请选择">
            <el-option label="预览" value="preview" />
            <el-option label="下载" value="download" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请理由">
          <el-input v-model="form.applyDesc" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入申请理由" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false" :disabled="submitting">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitApply">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { appsApi, getUserInfo } from '../../services/api';

const props = defineProps({
  fileId: { type: [String, Number], required: true },
  fileCategory: { type: String, required: true },
  isFolder: { type: Boolean, default: false }
});
const emit = defineEmits(['applied']);

const loadingHistory = ref(false);
const applying = ref(false);
const historyRows = ref([]);
const dialogVisible = ref(false);
const submitting = ref(false);

const form = ref({ permissionKey: 'preview', applyDesc: '' });

const PERMISSION_MAP = { preview: 8, download: 16 }; // 如需调整与后端确认

const hasHistory = computed(() => historyRows.value.length > 0);
const descText = computed(() => hasHistory.value ? '访问申请审核中' : '暂无预览权限');

function renderPerm(code) {
  if (code === PERMISSION_MAP.preview) return '预览';
  if (code === PERMISSION_MAP.download) return '下载';
  return code;
}

async function fetchHistory() {
  if (!props.fileId) return;
  loadingHistory.value = true;
  try {
    const user = getUserInfo() || {};
    const body = { fileCategory: props.fileCategory, isFolder: props.isFolder, fileId: Number(props.fileId), sort: '-updateTime', creatorId: user.userId };
    const resp = await appsApi.post('/apps/file-apply/history', body);
    if (resp && resp.status === 'ok') {
      const rows = resp.data?.rows || [];
      historyRows.value = rows;
    }
  } catch (e) {
    console.warn('[apply-history] failed', e);
  } finally { loadingHistory.value = false; }
}

function openDialog() { dialogVisible.value = true; form.value.permissionKey = 'preview'; form.value.applyDesc=''; }

async function submitApply() {
  if (!form.value.applyDesc.trim()) return ElMessage.warning('请填写申请理由');
  submitting.value = true;
  try {
    const perm = PERMISSION_MAP[form.value.permissionKey] || PERMISSION_MAP.preview;
    const body = { fileCategory: props.fileCategory, isFolder: props.isFolder, fileId: Number(props.fileId), permissions: perm, applyDesc: form.value.applyDesc.trim() };
    const resp = await appsApi.post('/apps/file-apply/request', body);
    if (resp && resp.status === 'ok') {
      ElMessage.success('申请已提交');
      dialogVisible.value = false;
      emit('applied');
      await fetchHistory();
    } else if (resp && resp.status === 'err_token') {
      ElMessage.error('登录已过期');
    } else {
      ElMessage.error('申请失败');
    }
  } catch (e) {
    console.warn('[apply-request] error', e); ElMessage.error('申请失败');
  } finally { submitting.value = false; }
}

onMounted(fetchHistory);
watch(() => [props.fileId, props.fileCategory], fetchHistory);
</script>

<style scoped>
.no-perm-wrapper { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; padding:24px 16px; }
.apply-actions { display:flex; gap:12px; }
.history-box { width:100%; max-width:640px; }
</style>
