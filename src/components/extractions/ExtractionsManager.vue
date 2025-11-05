<template>
  <div class="extractions-manager">
    <div class="manager-header">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-select 
            v-model="filters.form_id" 
            placeholder="按表单筛选"
            clearable
            @change="onFilterChange"
          >
            <el-option
              v-for="form in formsStore.formOptions"
              :key="form.value"
              :label="form.label"
              :value="form.value"
            />
          </el-select>
        </el-col>
        <el-col :span="16">
          <div class="actions-right">
            <el-dropdown @command="onExportCommand">
              <el-button type="primary" :loading="extractionsStore.loading.export">
                导出数据<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="export_all">导出全部数据</el-dropdown-item>
                  <el-dropdown-item command="export_by_form">导出抽取结果（当前表单）</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-button 
              type="danger" 
              @click="deleteSelected" 
              :disabled="selectedExtractions.length === 0"
              :loading="extractionsStore.loading.delete"
            >
              删除选中
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="extractions-list" v-loading="extractionsStore.loading.list">
      <el-table
        :data="extractionsStore.extractions"
        @selection-change="handleSelectionChange"
        row-key="id"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="表单" width="150">
          <template #default="{ row }">
            <el-tag>{{ getFormName(row.form_id) }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="文档ID" width="120">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDocument(row.document_id)">
              {{ row.document_id }}
            </el-link>
          </template>
        </el-table-column>
        
      
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)" 
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="抽取数据预览" min-width="300">
          <template #default="{ row }">
            <div class="data-preview">
              <!-- 传入新格式 fields（字符串数组）供 DataPreview 解析；回退使用 extracted_data -->
              <DataPreview :data="row.extracted_data" :fields="row.fields" />
              <div v-if="Array.isArray(row.fields)" class="fields-count-hint">
                <el-tag size="small" type="info">结果块: {{ row.fields.length }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="copyData(row)">
              <el-icon><DocumentCopy /></el-icon>
              复制
            </el-button>
            <el-button 
              v-if="isOwner(row)"
              size="small" 
              @click="editExtraction(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              v-if="isOwner(row)"
              size="small" 
              type="danger" 
              @click="deleteExtraction(row.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>


    </div>

    <!-- Pagination -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="extractionsStore.pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onPageSizeChange"
        @current-change="onPageChange"
      />
    </div>

    <!-- Detail Dialog -->
    <el-dialog
      v-model="showDetail"
      :title="`抽取详情 - ${selectedExtraction?.id}`"
      width="80%"
      :before-close="closeDetail"
    >
      <ExtractionDetail 
        v-if="selectedExtraction"
        :extraction="selectedExtraction"
        :editable="detailEditable && canEditDetail"
        :can-edit="canEditDetail"
        @update="updateExtraction"
        @edit="enableEdit"
        @save="(data)=>{ if(!canEditDetail){ ElMessage.error('无权限保存'); return; } saveExtraction(data); }"
        @cancel="cancelEdit"
      />
      <template #footer>
        <el-button @click="closeDetail">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑抽取数据"
      width="70%"
    >
      <el-form v-if="editingRow" :model="editingRow" label-width="120px">
        <el-form-item label="表单">
          <el-tag>{{ getFormName(editingRow.form_id) }}</el-tag>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editingRow.status" placeholder="选择状态">
            <el-option label="已完成" value="completed" />
            <el-option label="处理中" value="pending" />
            <el-option label="失败" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="抽取数据">
          <el-input 
            v-model="editingRow.extracted_data_json" 
            type="textarea"
            :rows="12"
            placeholder="JSON格式的抽取数据"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelEditDialog">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, DocumentCopy, Edit, Delete } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useExtractionsStore } from '../../stores/extractions';
import { useFormsStore } from '../../stores/forms';
import DataPreview from './DataPreview.vue';
import ExtractionDetail from './ExtractionDetail.vue';

const router = useRouter();
const extractionsStore = useExtractionsStore();
const formsStore = useFormsStore();

const searchKeyword = ref('');
const selectedExtractions = ref([]);
const showDetail = ref(false);
const selectedExtraction = ref(null);
const detailEditable = ref(false);
const canEditDetail = ref(false);

const filters = reactive({
  form_id: null,
  status: null,
  ai_model: null
});

const pagination = reactive({
  page: 1,
  pageSize: 20
});

onMounted(async () => {
  await formsStore.loadForms();
  // initialize from store if available
  if (extractionsStore.pagination) {
    pagination.page = extractionsStore.pagination.page || pagination.page;
    pagination.pageSize = extractionsStore.pagination.pageSize || pagination.pageSize;
  }
  await extractionsStore.loadExtractions({ page: pagination.page, pageSize: pagination.pageSize });
  // if backend returned page info update local pagination
  pagination.page = extractionsStore.pagination.page || pagination.page;
  pagination.pageSize = extractionsStore.pagination.pageSize || pagination.pageSize;
});

function onSearch() {
  extractionsStore.searchExtractions(searchKeyword.value, { ...filters, page: pagination.page, pageSize: pagination.pageSize });
}

function onFilterChange() {
  extractionsStore.setPagination(1, pagination.pageSize);
  pagination.page = 1;
  extractionsStore.loadExtractions({ ...filters, page: pagination.page, pageSize: pagination.pageSize });
}

function handleSelectionChange(selection) {
  selectedExtractions.value = selection.map(item => item.id);
  extractionsStore.setSelectedExtractions(selectedExtractions.value);
}

function getFormName(formId) {
  const form = formsStore.formById(formId);
  return form ? form.name : `表单${formId}`;
}

function getStatusType(status) {
  const types = {
    completed: 'success',
    pending: 'warning',
    error: 'danger'
  };
  return types[status] || 'info';
}

function getStatusText(status) {
  const texts = {
    completed: '已完成',
    pending: '处理中',
    error: '失败'
  };
  return texts[status] || status;
}

function viewDocument(documentId) {
  // Navigate to document preview
  router.push(`/preview/doc/${documentId}`);
}

// determine current user id
import { getUserInfo } from '../../services/api';
const _me = getUserInfo() || {};
const currentUserId = _me.id || _me.userId || _me.uid || _me.userID || '';

function getOwnerId(item) {
  if (!item || typeof item !== 'object') return null;
  return item.createUserId || item.createUser || item.creatorId || item.creator || item.userId || item.ownerId || item.created_by || null;
}

function isOwner(item) {
  const owner = getOwnerId(item);
  if (!owner) return false;
  return String(owner) === String(currentUserId);
}

function openDetail(extraction) {
  selectedExtraction.value = extraction;
  detailEditable.value = false; // start in view mode
  canEditDetail.value = isOwner(extraction);
  showDetail.value = true;
}

function enableEdit() {
  detailEditable.value = true;
}

function cancelEdit() {
  detailEditable.value = false;
}

async function saveExtraction(updatedData) {
  try {
    await extractionsStore.updateExtraction(selectedExtraction.value.id, {
      extracted_data: updatedData
    });
    
    selectedExtraction.value.extracted_data = updatedData;
    detailEditable.value = false;
    ElMessage.success('保存成功');
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message);
  }
}

function updateExtraction(updatedData) {
  // Update local data without saving
  selectedExtraction.value.extracted_data = updatedData;
}

function closeDetail() {
  showDetail.value = false;
  selectedExtraction.value = null;
  detailEditable.value = false;
}

async function deleteExtraction(id) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条抽取记录吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await extractionsStore.deleteExtraction(id);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message);
    }
  }
}

function copyData(row) {
  try {
    // Get the extracted data
    let dataToCopy = '';
    if (row.fields && Array.isArray(row.fields)) {
      // Parse and combine all field data
      const combinedData = {};
      row.fields.forEach((fieldStr) => {
        try {
          const parsed = JSON.parse(fieldStr);
          Object.assign(combinedData, parsed);
        } catch (e) {
          console.warn('Failed to parse field data:', e);
        }
      });
      dataToCopy = JSON.stringify(combinedData, null, 2);
    } else if (row.extracted_data) {
      dataToCopy = JSON.stringify(row.extracted_data, null, 2);
    }
    
    // Copy to clipboard with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(dataToCopy).then(() => {
        ElMessage.success('数据已复制到剪贴板');
      }).catch(() => {
        // Fallback to textarea method
        fallbackCopy(dataToCopy);
      });
    } else {
      // Use fallback for browsers without clipboard API
      fallbackCopy(dataToCopy);
    }
  } catch (error) {
    ElMessage.error('复制失败: ' + error.message);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    ElMessage.success('数据已复制到剪贴板');
  } catch (err) {
    ElMessage.error('复制失败，请手动复制');
  }
  document.body.removeChild(textarea);
}

const showEditDialog = ref(false);
const editingRow = ref(null);

function editExtraction(row) {
  editingRow.value = { ...row };
  showEditDialog.value = true;
}

async function saveEdit() {
  try {
    await extractionsStore.updateExtraction(editingRow.value.id, editingRow.value);
    ElMessage.success('更新成功');
    showEditDialog.value = false;
    editingRow.value = null;
    // Reload data
    await extractionsStore.loadExtractions({ page: pagination.page, pageSize: pagination.pageSize });
  } catch (error) {
    ElMessage.error('更新失败: ' + error.message);
  }
}

function cancelEditDialog() {
  showEditDialog.value = false;
  editingRow.value = null;
}

async function deleteSelected() {
  if (selectedExtractions.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedExtractions.value.length} 条记录吗？删除后无法恢复。`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await extractionsStore.deleteSelectedExtractions();
    ElMessage.success('批量删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败: ' + error.message);
    }
  }
}

async function exportSelected() {
  if (selectedExtractions.value.length === 0) return;
  
  try {
    await extractionsStore.exportExtractions(selectedExtractions.value, 'json');
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message);
  }
}

// 导出下拉命令处理
async function onExportCommand(command) {
  try {

    // 如果有选中项则在请求中传递 ids，否则不传 ids
    const ids = (selectedExtractions.value && selectedExtractions.value.length) ? selectedExtractions.value : null;
    // 调用导出接口：所有/按表单的分支根据 command 处理，统一在参数中附带 ids（如果存在）
    if (command === 'export_all') {
      await extractionsStore.exportByForm({ ...(ids ? { ids } : {}), fieldsOnly: false });
      ElMessage.success('导出全部任务已提交，下载应已开始');
      return;
    }

    if (command === 'export_by_form') {
      const fid = filters.form_id || null;
      if (!fid) {
        ElMessage.warning('请先选择表单');
        return;
      }
      await extractionsStore.exportByForm({ formId: fid, ...(ids ? { ids } : {}), fieldsOnly: true });
      ElMessage.success('按表单导出完成');
      return;
    }
  } catch (e) {
    ElMessage.error('导出失败: ' + (e?.message || e));
  }
}


function onPageChange(page) {
  pagination.page = page;
  extractionsStore.setPagination(page, pagination.pageSize);
  extractionsStore.loadExtractions({ ...filters, page, pageSize: pagination.pageSize });
}

function onPageSizeChange(pageSize) {
  pagination.pageSize = pageSize;
  extractionsStore.setPagination(pagination.page, pageSize);
  extractionsStore.loadExtractions({ ...filters, page: pagination.page, pageSize });
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
</script>

<style scoped>
.extractions-manager {
  padding: 24px;
  background-color: #F7F8FA;
  min-height: calc(100vh - 60px);
}

.manager-header {
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.text-right {
  text-align: right;
}

.actions-right { 
  display:flex; 
  justify-content:flex-end; 
  gap:8px; 
  align-items:center; 
}

.extractions-list {
  min-height: 400px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.extractions-list :deep(.el-table) {
  border-radius: 8px;
}

.extractions-list :deep(.el-table__header) {
  background: #F9FAFB;
}

.extractions-list :deep(.el-table__header th) {
  background: #F9FAFB;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
}

.extractions-list :deep(.el-table__row:hover) {
  background: #F0F9FF;
}

.extractions-list :deep(.el-table__body tr.el-table__row--striped) {
  background: #FAFBFC;
}

.data-preview {
  max-height: 60px;
  overflow: hidden;
}

.empty-extractions {
  padding: 60px 0;
  text-align: center;
  background: #FFFFFF;
  border-radius: 8px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
  padding: 16px;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-color: #3B82F6;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  border-color: #2563EB;
}

:deep(.el-button--danger) {
  background: #EF4444;
  border-color: #EF4444;
}

:deep(.el-button--danger:hover) {
  background: #DC2626;
  border-color: #DC2626;
}

:deep(.el-tag--success) {
  background-color: #D1FAE5;
  color: #065F46;
  border-color: #A7F3D0;
}

:deep(.el-tag--warning) {
  background-color: #FEF3C7;
  color: #92400E;
  border-color: #FDE68A;
}

:deep(.el-tag--danger) {
  background-color: #FEE2E2;
  color: #991B1B;
  border-color: #FCA5A5;
}
</style>