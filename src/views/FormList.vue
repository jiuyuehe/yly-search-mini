<template>
  <div class="form-list-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1>
          <el-icon><Document /></el-icon>
          表单管理系统
        </h1>
      </div>
      <div class="toolbar-right">
        <el-button @click="handleTemplateMarket" :icon="Shop">
          模板市场
        </el-button>
        <el-button type="primary" @click="handleCreateForm" :icon="Plus">
          创建表单
        </el-button>
        <el-button @click="handleSettings" :icon="Setting">
          设置
        </el-button>
      </div>
    </div>

    <!-- 表单卡片列表 -->
    <div class="cards-container">
      <el-empty v-if="formStore.forms.length === 0" description="暂无表单，点击创建表单开始">
        <el-button type="primary" @click="handleCreateForm">立即创建</el-button>
      </el-empty>
      
      <el-row :gutter="20" v-else>
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="form in formStore.forms" :key="form.id">
          <el-card class="form-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <div>
                  <span class="card-title">{{ form.name }}</span>
                 
                </div>
                <div class="card-status-row" aria-label="表单状态标签">
                  <el-tag size="small" type="info" class="field-tag">{{ form.schema.length }} 字段</el-tag>
                </div>
              </div>
            </template>

            <div class="card-body">
               <el-tag
                    size="mini"
                    :type="isIndexed(form) ? 'success' : 'warning'"
                    class="status-tag"
                  >
                    <el-icon v-if="isIndexed(form)"><Check /></el-icon>
                    {{ isIndexed(form) ? '已索引' : '未索引' }}
                  </el-tag>
                  <el-tag
                    size="mini"
                    :type="form.userId && form.userId !== 0 ? 'primary' : 'info'"
                    class="status-tag"
                  >
                    {{ ownerLabel(form) }}
                  </el-tag>
                  <el-tag v-if="shouldShowVersion(form)" size="mini" type="success" class="status-tag">
                    版本 v{{ form.version }}
                  </el-tag>
              <p class="card-description">{{ form.description || '暂无描述' }}</p>
              <div class="card-meta">
                <el-text size="small" type="info">
                  <el-icon><Clock /></el-icon>
                  创建于: {{ formatDate(form.createTime) }}
                </el-text>
              </div>
            </div>
            
            <template #footer>
              <div class="card-actions">
                <el-button size="small" @click="handlePreview(form)" :icon="View">
                  预览
                </el-button>
                <el-button size="small" @click="handleEdit(form)" :icon="Edit">
                  编辑
                </el-button>
                <el-button size="small" @click="handleViewData(form)" :icon="List">
                  数据
                </el-button>
                <el-popconfirm
                  title="确定要删除这个表单吗？"
                  @confirm="handleDelete(form.id)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" :icon="Delete">
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 创建/编辑表单对话框 -->
    <FormDesigner
      v-model:visible="designerVisible"
      :form="editingForm"
      :storage-mode="appConfig.storageMode"
      @save="handleSaveForm"
    />

    <!-- 预览表单对话框 -->
    <FormPreview
      v-model:visible="previewVisible"
      :form="previewForm"
    />

    <!-- 数据查看对话框 -->
    <FormDataView
      v-model:visible="dataViewVisible"
      :form="dataViewForm"
      :storage-mode="appConfig.storageMode"
    />

    <!-- 模板市场对话框 -->
    <TemplateMarket
      v-model:visible="templateMarketVisible"
      @select-template="handleSelectTemplate"
    />

    <!-- 设置对话框 -->
    <SettingsDialog
      v-model:visible="settingsVisible"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formStore } from '../stores/formStore'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Shop,
  Setting,
  Document,
  View,
  Edit,
  List,
  Delete,
  Clock,
  Check
} from '@element-plus/icons-vue'
import FormDesigner from '../components/extractions/newforms/FormDesigner.vue'
import FormPreview from '../components/extractions/newforms/FormPreview.vue'
import FormDataView from '../components/extractions/newforms/FormDataView.vue'
import TemplateMarket from '../components/extractions/newforms/TemplateMarket.vue'
import SettingsDialog from '../components/extractions/newforms/SettingsDialog.vue'
import { appConfig } from '../config/appConfig'

// 状态管理
const designerVisible = ref(false)
const previewVisible = ref(false)
const dataViewVisible = ref(false)
const templateMarketVisible = ref(false)
const settingsVisible = ref(false)
const editingForm = ref(null)
const previewForm = ref(null)
const dataViewForm = ref(null)

onMounted(async () => {
  try {
    await formStore.loadForms()
  } catch (error) {
    console.error('加载表单列表失败:', error)
  }
})

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 创建表单
const handleCreateForm = () => {
  editingForm.value = null
  designerVisible.value = true
}

// 编辑表单
const handleEdit = (form) => {
  editingForm.value = form
  designerVisible.value = true
}

// 预览表单
const handlePreview = (form) => {
  previewForm.value = form
  previewVisible.value = true
}

// 查看数据
const handleViewData = (form) => {
  dataViewForm.value = form
  dataViewVisible.value = true
}

// 删除表单
const handleDelete = async (id) => {
  await formStore.deleteForm(id)
  ElMessage.success('表单已删除')
}

// 保存表单
const handleSaveForm = async (formData) => {
  if (editingForm.value) {
    // 更新现有表单
    await formStore.updateForm(editingForm.value.id, formData)
    ElMessage.success('表单已更新')
  } else {
    // 创建新表单
    await formStore.addForm(formData)
    ElMessage.success('表单已创建')
  }
}

// 打开模板市场
const handleTemplateMarket = () => {
  templateMarketVisible.value = true
}

const isIndexed = (form) => Boolean(form.esIndexName)
const ownerLabel = (form) => (form.userId && form.userId !== 0 ? '个人' : '公开')
const shouldShowVersion = (form) => (form.version ?? 1) > 1

// 从模板创建表单
const handleSelectTemplate = async (template) => {
  await formStore.addForm({
    name: template.name,
    description: template.description,
    schema: template.schema
  })
  ElMessage.success(`已从模板 "${template.name}" 创建表单`)
}

// 打开设置
const handleSettings = () => {
  settingsVisible.value = true
}
</script>

<style scoped>
.form-list-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.toolbar {
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.cards-container {
  padding: 20px 30px;
}

.form-card {
  margin-bottom: 20px;
  transition: transform 0.3s;
  background: var(--background-color);
  border: 1px solid var(--border-color-muted);
  border-radius: var( --border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.form-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
  color: var(--text-color-strong);
}

.card-status-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.status-tag {
  font-weight: 500;
  border-radius: 999px;
  padding: 0 6px;
}

.field-tag {
  margin-left: 8px;
  background: var(--background-info-soft);
  color: var(--status-info);
  border-color: transparent;
}

.card-body {
  min-height: 80px;
}

.card-description {
  color: #606266;
  margin-bottom: 10px;
  min-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
