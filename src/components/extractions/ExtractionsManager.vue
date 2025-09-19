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
        <el-col :span="8" class="text-right">
          <el-button 
            type="primary" 
            @click="exportSelected" 
            :disabled="selectedExtractions.length === 0"
            :loading="extractionsStore.loading.export"
          >
            导出选中
          </el-button>
          <el-button 
            type="danger" 
            @click="deleteSelected" 
            :disabled="selectedExtractions.length === 0"
            :loading="extractionsStore.loading.delete"
          >
            删除选中
          </el-button>
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
        
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
            <el-button 
              v-if="isOwner(row)"
              size="small" 
              type="danger" 
              @click="deleteExtraction(row.id)"
            >
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
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
  padding: 20px;
}

.manager-header {
  margin-bottom: 20px;
}

.text-right {
  text-align: right;
}

.extractions-list {
  min-height: 400px;
}

.data-preview {
  max-height: 60px;
  overflow: hidden;
}

.empty-extractions {
  padding: 60px 0;
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}
</style>