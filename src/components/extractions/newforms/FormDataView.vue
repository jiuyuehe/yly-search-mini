<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`数据查看: ${form?.name || '表单'}`"
    width="95%"
    fullscreen
    @close="handleClose"
  >
    <div v-if="form" class="data-view-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchText"
            placeholder="搜索数据..."
            :prefix-icon="Search"
            style="width: 300px"
            clearable
          />
        </div>
        <div class="toolbar-right">
          <el-button @click="goFormExtractionStatus" :icon="DataLine">
            抽取状态
          </el-button>
          <el-button @click="handleViewPrompt" :icon="ChatLineSquare">
            查看提示词
          </el-button>
          <el-button @click="handleAddData" :icon="Plus" type="primary">
            添加数据
          </el-button>
          <el-button @click="handleUploadFile" :icon="Upload">
            上传文件提取
          </el-button>
          <el-button @click="handleExportData" :icon="Download">
            导出数据
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        :data="filteredResults"
        border
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
      >
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column
          v-for="field in form.schema"
          :key="field.key"
          :label="field.label"
          :prop="`data.${field.key}`"
          min-width="150"
          sortable
        >
          <template #default="{ row }">
            <span v-if="Array.isArray(row.data[field.key])">
              {{ row.data[field.key].join(', ') }}
            </span>
            <span v-else-if="typeof row.data[field.key] === 'object'">
              {{ JSON.stringify(row.data[field.key]) }}
            </span>
            <span v-else>
              {{ row.data[field.key] }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" prop="createdAt" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEditData(row)" :icon="Edit">
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除这条数据吗？"
              @confirm="handleDeleteData(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger" :icon="Delete">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 统计信息 -->
      <div class="stats">
        <el-tag>总计: {{ totalResults }} 条数据</el-tag>
        <el-tag v-if="searchText" type="info">
          筛选结果: {{ filteredResults.length }} 条
        </el-tag>
      </div>
      <div class="pagination-wrapper" v-if="totalResults > pageSize">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalResults"
          layout="prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 添加/编辑数据对话框 -->
    <el-dialog
      v-model="dataFormVisible"
      :title="isEditMode ? '编辑数据' : '添加数据'"
      width="60%"
      append-to-body
      @close="handleDataFormClose"
    >
      <FormRenderer
        v-if="form.schema"
        :schema="form.schema"
        v-model="currentData"
        ref="formRendererRef"
      />
      <template #footer>
        <el-button @click="dataFormVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveData">保存</el-button>
      </template>
    </el-dialog>

    <!-- 文件上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件提取数据"
      width="60%"
      append-to-body
    >
      <el-alert
        title="AI数据提取功能"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <p>上传文件或输入文本，系统将使用AI提取数据并填充到表单中。</p>
          <p style="color: #909399; font-size: 12px; margin-top: 5px;">
            注意：此功能需要配置AI服务。当前为演示模式，将生成模拟数据。
          </p>
        </template>
      </el-alert>
      
      <el-tabs v-model="extractMode">
        <el-tab-pane label="上传文件" name="file">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".txt,.pdf,.doc,.docx"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 txt/pdf/doc/docx 文件
              </div>
            </template>
          </el-upload>
        </el-tab-pane>
        
        <el-tab-pane label="输入文本" name="text">
          <el-input
            v-model="extractText"
            type="textarea"
            :rows="10"
            placeholder="请输入需要提取数据的文本内容..."
          />
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExtractData" :loading="extracting">
          提取数据
        </el-button>
      </template>
    </el-dialog>

    <!-- 提示词编辑器 -->
    <PromptEditor
      v-model:visible="promptEditorVisible"
      :form="form"
      @save="handlePromptSaved"
    />

    <!-- 隐藏的文件输入 -->
    <input ref="fileInput" type="file" style="display: none" />
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { formStore } from '../../../stores/formStore'
import { generateFormData, exportDataToCsv } from '../utils/formUtils'
import { extractDataWithAI, readFileContent, validateExtractedData } from '../../../services/aiPromptService'
import { appConfig } from '../../../config/appConfig'
import { ElMessage } from 'element-plus'
import {
  Search,
  Plus,
  Upload,
  Download,
  Edit,
  Delete,
  UploadFilled,
  ChatLineSquare,
  DataLine
} from '@element-plus/icons-vue'
import FormRenderer from './FormRenderer.vue'
import PromptEditor from './PromptEditor.vue'

const router = useRouter()

// Props
const props = defineProps({
  visible: Boolean,
  form: Object
})

// Emits
const emit = defineEmits(['update:visible'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const searchText = ref('')
const results = ref([])
const dataFormVisible = ref(false)
const uploadDialogVisible = ref(false)
const promptEditorVisible = ref(false)
const currentData = ref({})
const isEditMode = ref(false)
const editingDataId = ref(null)
const formRendererRef = ref(null)
const fileInput = ref(null)

const currentPage = ref(1)
const pageSize = ref(20)
const totalResults = ref(0)

// 文件提取相关
const extractMode = ref('file')
const extractText = ref('')
const extracting = ref(false)
const uploadFile = ref(null)

const loadResults = async (page = currentPage.value) => {
  if (!props.form || !props.form.id) {
    results.value = []
    totalResults.value = 0
    return
  }
  try {
  
    const { list, total } = await formStore.loadFormResults(props.form.id, {
      pageNo: page,
      pageSize: pageSize.value
    })
    results.value = list
    totalResults.value = total
    currentPage.value = page
  } catch (error) {
    console.error('加载表单数据失败:', error)
    results.value = []
    totalResults.value = 0
  }
}

const handlePageChange = (page) => {
  loadResults(page)
}

// 监听 form 变化，加载数据
watch(() => props.form, (newForm) => {
  if (newForm) {
    loadResults(1)
  } else {
    results.value = []
    totalResults.value = 0
  }
}, { immediate: true, deep: true })

// 筛选后的结果
const filteredResults = computed(() => {
  if (!searchText.value) {
    return results.value
  }
  
  const search = searchText.value.toLowerCase()
  return results.value.filter(result => {
    return Object.values(result.data).some(value => {
      if (Array.isArray(value)) {
        return value.some(v => String(v).toLowerCase().includes(search))
      }
      return String(value).toLowerCase().includes(search)
    })
  })
})

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 添加数据
const handleAddData = () => {
  isEditMode.value = false
  currentData.value = generateFormData(props.form.schema)
  dataFormVisible.value = true
}

// 编辑数据
const handleEditData = (row) => {
  isEditMode.value = true
  editingDataId.value = row.id
  currentData.value = JSON.parse(JSON.stringify(row.data))
  dataFormVisible.value = true
}

// 保存数据
const handleSaveData = async () => {
  try {
    // 验证表单
    await formRendererRef.value?.validate()
    
    if (isEditMode.value) {
      // 更新数据
      formStore.updateFormResult(props.form.id, editingDataId.value, currentData.value)
      ElMessage.success('数据已更新')
    } else {
      // 添加新数据
      formStore.addFormResult(props.form.id, currentData.value)
      ElMessage.success('数据已添加')
    }
    
    // 刷新数据
    results.value = formStore.getFormResults(props.form.id)
    dataFormVisible.value = false
  } catch (error) {
    console.error('保存数据失败:', error)
    ElMessage.warning('请填写完整的表单')
  }
}

// 删除数据
const handleDeleteData = (id) => {
  formStore.deleteFormResult(props.form.id, id)
  results.value = formStore.getFormResults(props.form.id)
  ElMessage.success('数据已删除')
}

// 导出数据
const handleExportData = () => {
  if (results.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  
  exportDataToCsv(results.value, props.form.schema, `${props.form.name}-data.csv`)
  ElMessage.success('数据已导出')
}

// 查看提示词
const handleViewPrompt = () => {
  promptEditorVisible.value = true
}

// 提示词保存成功回调
const handlePromptSaved = () => {
  ElMessage.success('提示词已保存')
}

// 上传文件提取
const handleUploadFile = () => {
  uploadDialogVisible.value = true
  extractMode.value = 'file'
  extractText.value = ''
  uploadFile.value = null
}

// 文件变化
const handleFileChange = (file) => {
  uploadFile.value = file
}

// 提取数据
const handleExtractData = async () => {
  extracting.value = true
  
  try {
    let content = ''
    
    // 获取内容
    if (extractMode.value === 'file') {
      if (!uploadFile.value) {
        ElMessage.warning('请先上传文件')
        extracting.value = false
        return
      }
      
      try {
        content = await readFileContent(uploadFile.value.raw)
      } catch (error) {
        ElMessage.error(error.message || '文件读取失败')
        extracting.value = false
        return
      }
    } else {
      content = extractText.value
      if (!content) {
        ElMessage.warning('请输入文本内容')
        extracting.value = false
        return
      }
    }
    
    // 检查是否启用了 AI 服务
    if (appConfig.ai.enabled && appConfig.ai.apiUrl) {
      try {
        // 使用真实的 AI 服务提取数据
        const extractedData = await extractDataWithAI(
          appConfig.ai,
          props.form.schema,
          content
        )
        
        // 验证提取的数据
        const validation = validateExtractedData(extractedData, props.form.schema)
        if (!validation.valid) {
          ElMessage.warning(`数据提取成功，但存在一些问题: ${validation.errors[0]}`)
        }
        
        // 添加提取的数据
        await formStore.addFormResult(props.form.id, extractedData)
        results.value = formStore.getFormResults(props.form.id)
        
        ElMessage.success('AI 数据提取成功')
        uploadDialogVisible.value = false
      } catch (error) {
        console.error('AI 提取失败:', error)
        ElMessage.error(`AI 提取失败: ${error.message}，将使用模拟数据`)
        
        // 如果 AI 提取失败，使用模拟数据
        await useMockExtraction()
      }
    } else {
      // 如果未启用 AI 服务，使用模拟数据
      await useMockExtraction()
    }
  } catch (error) {
    ElMessage.error('数据提取失败')
    console.error('提取错误:', error)
  } finally {
    extracting.value = false
  }
}

// 使用模拟数据提取
const useMockExtraction = async () => {
  // 模拟AI提取数据的过程
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 生成模拟数据
  const mockData = generateMockDataFromSchema(props.form.schema)
  
  // 添加提取的数据
  await formStore.addFormResult(props.form.id, mockData)
  results.value = formStore.getFormResults(props.form.id)
  
  ElMessage.success('数据提取成功（模拟数据）')
  uploadDialogVisible.value = false
}

// 生成模拟数据
const generateMockDataFromSchema = (schema) => {
  const data = {}
  
  schema.forEach(field => {
    switch (field.type) {
      case 'input-short':
        data[field.key] = `示例${field.label}`
        break
      case 'input-long':
        data[field.key] = `这是一段关于${field.label}的详细描述文本`
        break
      case 'input-number':
        data[field.key] = Math.floor(Math.random() * 100)
        break
      case 'input-phone':
        data[field.key] = '13800138000'
        break
      case 'input-email':
        data[field.key] = 'example@email.com'
        break
      case 'input-ip':
        data[field.key] = '192.168.1.1'
        break
      case 'input-date':
      case 'input-datetime':
        data[field.key] = new Date()
        break
      case 'select-single':
      case 'radio':
        if (field.options && field.options.length > 0) {
          data[field.key] = field.options[0].value
        }
        break
      case 'select-multiple':
      case 'checkbox':
        if (field.options && field.options.length > 0) {
          data[field.key] = [field.options[0].value]
        }
        break
      case 'object':
        if (field.children) {
          data[field.key] = generateMockDataFromSchema(field.children)
        }
        break
      default:
        data[field.key] = field.defaultValue || ''
    }
  })
  
  return data
}

// 关闭数据表单
const handleDataFormClose = () => {
  currentData.value = {}
  editingDataId.value = null
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  searchText.value = ''
}

// 跳转：当前表单抽取状态
const goFormExtractionStatus = () => {
  if (!props.form || !props.form.id) return
  router.push({ name: 'extraction-status-form', params: { id: props.form.id } })
}
</script>

<style scoped>
.data-view-container {
  padding: 10px 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.el-icon--upload {
  font-size: 67px;
  color: #409eff;
  margin: 40px 0 16px;
  line-height: 50px;
}
</style>
