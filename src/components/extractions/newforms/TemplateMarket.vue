<template>
  <el-dialog
    v-model="dialogVisible"
    title="表单模板市场"
    width="80%"
    @close="handleClose"
  >
    <div class="template-market">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索模板..."
          :prefix-icon="Search"
          clearable
          style="max-width: 400px"
        />
      </div>

      <!-- 分类标签 -->
      <div class="category-tabs">
        <el-radio-group v-model="selectedCategory" size="large">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="enterprise">
            🏢 企业
          </el-radio-button>
          <el-radio-button label="education">
            🎓 教育
          </el-radio-button>
          <el-radio-button label="military">
            🛡️ 军工
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 模板列表 -->
      <div class="template-list">
        <el-empty v-if="filteredTemplates.length === 0" description="没有找到匹配的模板" />
        
        <el-row :gutter="20" v-else>
          <el-col
            v-for="(template, index) in filteredTemplates"
            :key="index"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <el-card class="template-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="template-name">{{ template.name }}</span>
                  <el-tag size="small" :type="getCategoryTagType(template.category)">
                    {{ getCategoryName(template.category) }}
                  </el-tag>
                </div>
              </template>
              
              <div class="card-body">
                <p class="template-description">{{ template.description }}</p>
                <div class="template-info">
                  <el-text type="info" size="small">
                    字段数: {{ template.schema.length }}
                  </el-text>
                </div>
              </div>
              
              <template #footer>
                <el-button
                  type="primary"
                  size="small"
                  @click="handleUseTemplate(template)"
                  :icon="DocumentAdd"
                >
                  使用模板
                </el-button>
                <el-button
                  size="small"
                  @click="handlePreviewTemplate(template)"
                  :icon="View"
                >
                  预览
                </el-button>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="模板预览"
      width="60%"
      append-to-body
    >
      <div v-if="previewTemplate" class="template-preview">
        <h3>{{ previewTemplate.name }}</h3>
        <p>{{ previewTemplate.description }}</p>
        
        <el-divider />
        
        <h4>字段列表：</h4>
        <el-table :data="previewTemplate.schema" border>
          <el-table-column prop="label" label="字段标签" width="150" />
          <el-table-column prop="key" label="字段Key" width="150" />
          <el-table-column prop="type" label="字段类型" width="150">
            <template #default="{ row }">
              {{ getFieldTypeLabel(row.type) }}
            </template>
          </el-table-column>
          <el-table-column prop="required" label="必填" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.required" type="danger" size="small">是</el-tag>
              <el-tag v-else type="info" size="small">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="placeholder" label="提示文本" min-width="200" />
        </el-table>
      </div>
      
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          @click="handleUseTemplate(previewTemplate)"
        >
          使用此模板
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { allTemplates, searchTemplates, getTemplatesByCategory, templateCategories } from '../templates'
import { FIELD_TYPES } from '../utils/formUtils'
import { Search, DocumentAdd, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  visible: Boolean
})

// Emits
const emit = defineEmits(['update:visible', 'select-template'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const searchKeyword = ref('')
const selectedCategory = ref('all')
const previewDialogVisible = ref(false)
const previewTemplate = ref(null)

// 过滤后的模板
const filteredTemplates = computed(() => {
  let templates = allTemplates
  
  // 按分类过滤
  if (selectedCategory.value !== 'all') {
    templates = getTemplatesByCategory(selectedCategory.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    templates = templates.filter(template =>
      template.name.toLowerCase().includes(keyword) ||
      template.description.toLowerCase().includes(keyword)
    )
  }
  
  return templates
})

// 获取分类名称
const getCategoryName = (category) => {
  return templateCategories[category]?.name || category
}

// 获取分类标签类型
const getCategoryTagType = (category) => {
  const typeMap = {
    enterprise: 'primary',
    education: 'success',
    military: 'warning'
  }
  return typeMap[category] || 'info'
}

// 获取字段类型标签
const getFieldTypeLabel = (type) => {
  const fieldType = Object.values(FIELD_TYPES).find(t => t.value === type)
  return fieldType?.label || type
}

// 使用模板
const handleUseTemplate = (template) => {
  emit('select-template', template)
  ElMessage.success(`已选择模板: ${template.name}`)
  dialogVisible.value = false
  previewDialogVisible.value = false
}

// 预览模板
const handlePreviewTemplate = (template) => {
  previewTemplate.value = template
  previewDialogVisible.value = true
}

// 关闭对话框
const handleClose = () => {
  searchKeyword.value = ''
  selectedCategory.value = 'all'
}
</script>

<style scoped>
.template-market {
  min-height: 500px;
}

.search-bar {
  margin-bottom: 20px;
}

.category-tabs {
  margin-bottom: 20px;
}

.template-list {
  margin-top: 20px;
}

.template-card {
  margin-bottom: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-name {
  font-weight: bold;
  font-size: 16px;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.template-description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 10px;
  flex: 1;
}

.template-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.template-preview h3 {
  margin-bottom: 10px;
}

.template-preview p {
  color: #606266;
  margin-bottom: 20px;
}

.template-preview h4 {
  margin-bottom: 15px;
  color: #303133;
}
</style>
