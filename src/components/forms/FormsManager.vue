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
        @row-click="selectForm"
        row-key="id"
        highlight-current-row
      >
        <el-table-column prop="name" label="表单名称" min-width="200">
          <template #default="{ row }">
            <div class="form-name">
              <strong>{{ row.name }}</strong>
              <div class="form-description">{{ row.structure.formName }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="字段数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.structure.fields?.length || 0 }} 个</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button size="small" @click.stop="selectForm(row)">选择</el-button>
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
        <el-button type="primary" @click="confirmSelectForm">选择此表单</el-button>
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
</script>

<style scoped>
.forms-manager {
  padding: 20px;
}

.manager-header {
  margin-bottom: 20px;
}

.text-right {
  text-align: right;
}

.forms-list {
  min-height: 400px;
}

.form-name {
  display: flex;
  flex-direction: column;
}

.form-description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.empty-forms {
  padding: 60px 0;
  text-align: center;
}

.el-table :deep(.el-table__row) {
  cursor: pointer;
}

.el-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>