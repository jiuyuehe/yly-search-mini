<template>
  <div class="forms-manager">
    <div class="manager-header">
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索表单名称"
            clearable
            @input="onSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-button type="primary" @click="createForm">新建表单</el-button>
        </el-col>
      </el-row>
    </div>

    <div class="forms-list" v-loading="formsStore.loading.list">
      <el-table
        :data="filteredForms"
        row-key="id"
        highlight-current-row
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="表单名称" min-width="200">
          <template #default="{ row }">
            <div class="form-name">
              <strong>{{ row.name }}</strong>
              <div class="form-description">{{ row.description || row.structure.formName }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="字段数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.structure.fields?.length || 0 }} 个</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="关联数据结果" width="140" align="center">
          <template #default="{ row }">
            <el-link 
              type="primary" 
              :underline="false"
              @click="viewFormData(row.id)"
            >
              <el-tag size="small" type="success">
                {{ row.dataCount || 0 }} 条
              </el-tag>
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column label="可用状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch 
              v-model="row.enabled" 
              size="small"
              :active-value="true"
              :inactive-value="false"
              @change="toggleFormStatus(row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="selectable" size="small" type="primary" @click.stop="selectForm(row)">选择</el-button>
            <el-button size="small" @click.stop="editForm(row.id)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click.stop="deleteForm(row.id)"
              :loading="formsStore.loading.delete"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="filteredForms.length === 0 && !formsStore.loading.list" class="empty-forms">
        <el-empty description="暂无表单数据">
          <el-button type="primary" @click="createForm">创建第一个表单</el-button>
        </el-empty>
      </div>
    </div>

    <!-- Form Detail Dialog -->
    <el-dialog
      v-model="showFormDetail"
      :title="selectedFormData?.name || '表单详情'"
      width="60%"
    >
      <FormPreview 
        v-if="selectedFormData"
        :structure="selectedFormData.structure" 
        :show-examples="true"
      />
      <template #footer>
        <el-button @click="showFormDetail = false">关闭</el-button>
        <el-button v-if="selectable" type="primary" @click="confirmSelectForm">选择此表单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { useFormsStore } from '../../stores/forms';
import FormPreview from '../forms/FormPreview.vue';

const emit = defineEmits(['form-selected']);

const _props = defineProps({
  selectable: { type: Boolean, default: false }
});

const router = useRouter();
const formsStore = useFormsStore();

const searchKeyword = ref('');
const showFormDetail = ref(false);
const selectedFormData = ref(null);

const filteredForms = computed(() => {
  if (!searchKeyword.value) {
    return formsStore.forms;
  }
  return formsStore.forms.filter(form => 
    form.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

onMounted(async () => {
  await formsStore.loadForms();
});

function onSearch() {
  // Search is handled by computed property
}

function selectForm(form) {
  selectedFormData.value = form;
  showFormDetail.value = true;
}

function confirmSelectForm() {
  if (selectedFormData.value) {
    emit('form-selected', selectedFormData.value);
    showFormDetail.value = false;
  }
}

function createForm() {
  router.push('/forms/create');
}

function editForm(id) {
  router.push(`/forms/edit/${id}`);
}

async function deleteForm(id) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个表单吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await formsStore.deleteForm(id);
    ElMessage.success('表单删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message);
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function viewFormData(formId) {
  // Navigate to extractions view filtered by this form
  router.push(`/extractions?form_id=${formId}`);
}

async function toggleFormStatus(form) {
  try {
    // Update form status - this would call an API in real implementation
    await formsStore.updateFormStatus(form.id, form.enabled);
    ElMessage.success(form.enabled ? '表单已启用' : '表单已禁用');
  } catch (error) {
    // Revert the switch on error
    form.enabled = !form.enabled;
    ElMessage.error('状态更新失败: ' + (error.message || error));
  }
}
</script>

<style scoped>
.forms-manager {
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

.forms-list {
  min-height: 400px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.forms-list :deep(.el-table) {
  border-radius: 8px;
}

.forms-list :deep(.el-table__header) {
  background: #F9FAFB;
}

.forms-list :deep(.el-table__header th) {
  background: #F9FAFB;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
}

.forms-list :deep(.el-table__row:hover) {
  background: #F0F9FF;
  cursor: pointer;
}

.forms-list :deep(.el-table__body tr.el-table__row--striped) {
  background: #FAFBFC;
}

.form-name {
  display: flex;
  flex-direction: column;
}

.form-name strong {
  color: #1F2937;
  font-size: 14px;
  font-weight: 600;
}

.form-description {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.empty-forms {
  padding: 60px 0;
  text-align: center;
  background: #FFFFFF;
  border-radius: 8px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-color: #3B82F6;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  border-color: #2563EB;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #3B82F6;
  border-color: #3B82F6;
}

:deep(.el-tag--success) {
  background-color: #D1FAE5;
  color: #065F46;
  border-color: #A7F3D0;
}

:deep(.el-tag--info) {
  background-color: #E0E7FF;
  color: #3730A3;
  border-color: #C7D2FE;
}
</style>