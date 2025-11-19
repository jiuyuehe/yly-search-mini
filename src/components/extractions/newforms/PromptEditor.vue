<template>
  <el-dialog
    v-model="dialogVisible"
    title="AI提示词管理"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="prompt-editor-container">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-tag type="info">
            <el-icon><Document /></el-icon>
            表单: {{ form?.name || '未知' }}
          </el-tag>
          <el-tag v-if="tokenCount > 0" type="warning">
            <el-icon><DataLine /></el-icon>
            Token数: {{ tokenCount }}
          </el-tag>
          <el-tag v-if="isCustomPrompt" type="success">
            <el-icon><EditPen /></el-icon>
            自定义提示词
          </el-tag>
        </div>
        <div class="toolbar-right">
          <el-button @click="handleGenerateDefault" :icon="Refresh">
            生成默认提示词
          </el-button>
          <el-button @click="handleTestPrompt" :icon="ChatLineSquare" :loading="testing">
            测试提取
          </el-button>
        </div>
      </div>

      <!-- 提示词编辑区 -->
      <div class="prompt-section">
        <div class="section-header">
          <h3>提示词内容</h3>
          <el-text size="small" type="info">
            提示词将发送给AI模型用于数据提取。可以自定义修改以提高提取准确度。
          </el-text>
        </div>
        <el-input
          v-model="promptContent"
          type="textarea"
          :rows="20"
          placeholder="提示词内容..."
          :disabled="loading"
        />
      </div>

      <!-- 测试区域 -->
      <div v-if="showTestArea" class="test-section">
        <div class="section-header">
          <h3>测试数据提取</h3>
        </div>
        <el-input
          v-model="testContent"
          type="textarea"
          :rows="8"
          placeholder="输入要测试的文本内容..."
        />
        
        <div v-if="testResult" class="test-result">
          <h4>提取结果:</h4>
          <el-alert
            v-if="testError"
            :title="testError"
            type="error"
            :closable="false"
          />
          <pre v-else>{{ JSON.stringify(testResult, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        保存提示词
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox  } from 'element-plus'
import { 
  Document, 
  DataLine, 
  EditPen, 
  Refresh, 
  ChatLineSquare 
} from '@element-plus/icons-vue'
import { generateAIPrompt,extractDataWithAI } from '../../../services/aiPromptService'
import { appConfig } from '../../../config/appConfig'

// Props
const props = defineProps({
  visible: Boolean,
  form: Object,
  storageMode: {
    type: String,
    default: 'localStorage'
  }
})

// Emits
const emit = defineEmits(['update:visible', 'save'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const promptContent = ref('')
const isCustomPrompt = ref(false)
const tokenCount = ref(0)
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const showTestArea = ref(false)
const testContent = ref('')
const testResult = ref(null)
const testError = ref('')

// 监听 form 变化，加载提示词
watch(() => props.form, async (newForm) => {
  if (newForm && newForm.id) {
    await loadPrompt()
  }
}, { immediate: true })

// 加载提示词
const loadPrompt = async () => {
  if (!props.form) return
  
  loading.value = true
  try {
    // 检查是否有自定义提示词
    const customPrompt = await getCustomPrompt(props.form.id)
    if (customPrompt) {
      promptContent.value = customPrompt
      isCustomPrompt.value = true
    } else {
      // 生成默认提示词
      generateDefaultPrompt()
    }
    
    // 计算token数
    calculateTokens()
  } catch (error) {
    console.error('加载提示词失败:', error)
    ElMessage.error('加载提示词失败')
  } finally {
    loading.value = false
  }
}

// 获取自定义提示词
const getCustomPrompt = async (formId) => {
  // 从本地存储或API获取
  if (props.storageMode === 'api' && appConfig.api.enabled) {
    try {
      // TODO: 调用后端API获取自定义提示词
      // const response = await apiService.getFormPrompt(formId)
      // return response.prompt
    } catch (error) {
      console.error('API获取提示词失败:', error)
    }
  }
  
  // 从localStorage获取
  const key = `form_prompt_${formId}`
  return localStorage.getItem(key)
}

// 生成默认提示词
const generateDefaultPrompt = () => {
  if (!props.form || !props.form.schema) return
  
  const sampleContent = '这是示例文本内容'
  promptContent.value = generateAIPrompt(props.form.schema, sampleContent)
  isCustomPrompt.value = false
  calculateTokens()
}

// 计算token数（简化版本，实际应使用tiktoken库）
const calculateTokens = () => {
  if (!promptContent.value) {
    tokenCount.value = 0
    return
  }
  
  // 简化的token计算：中文字符按1.5个token，英文单词按1个token，标点按0.5个token
  const chineseChars = (promptContent.value.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (promptContent.value.match(/[a-zA-Z]+/g) || []).length
  const punctuation = (promptContent.value.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length
  
  tokenCount.value = Math.ceil(chineseChars * 1.5 + englishWords + punctuation * 0.5)
}

// 处理生成默认提示词
const handleGenerateDefault = () => {
  ElMessageBox.confirm('生成默认提示词将覆盖当前内容，是否继续？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    generateDefaultPrompt()
    ElMessage.success('已生成默认提示词')
  }).catch(() => {
    // 用户取消
  })
}

// 处理测试提示词
const handleTestPrompt = () => {
  showTestArea.value = !showTestArea.value
  if (showTestArea.value && !testContent.value) {
    // 设置示例测试文本
    testContent.value = '张三，男，电话：13800138000，邮箱：zhangsan@example.com'
  }
  
  // 如果有测试内容，立即执行测试
  if (showTestArea.value && testContent.value) {
    executeTest()
  }
}

// 执行测试
const executeTest = async () => {
  if (!testContent.value) {
    ElMessage.warning('请输入测试文本')
    return
  }
  
  testing.value = true
  testResult.value = null
  testError.value = ''
  
  try {
    // 如果AI服务未配置，使用模拟数据
    if (!appConfig.ai.enabled || !appConfig.ai.apiUrl) {
      ElMessage.info('AI服务未配置，使用模拟数据')
      // 生成模拟结果
      const mockResult = {}
      props.form.schema.forEach(field => {
        if (field.type === 'input-number') {
          mockResult[field.key] = Math.floor(Math.random() * 100)
        } else if (field.type === 'select-multiple' || field.type === 'checkbox') {
          mockResult[field.key] = []
        } else if (field.type === 'object') {
          mockResult[field.key] = {}
        } else {
          mockResult[field.key] = `模拟${field.label}`
        }
      })
      testResult.value = mockResult
    } else {
      // 调用真实AI服务
  
      testResult.value = await extractDataWithAI(
        appConfig.ai,
        props.form.schema,
        testContent.value
      )
    }
    
    ElMessage.success('测试提取成功')
  } catch (error) {
    console.error('测试提取失败:', error)
    testError.value = error.message || '测试提取失败'
    ElMessage.error('测试提取失败')
  } finally {
    testing.value = false
  }
}

// 保存提示词
const handleSave = async () => {
  if (!promptContent.value) {
    ElMessage.warning('提示词内容不能为空')
    return
  }
  
  saving.value = true
  try {
    // 保存到后端或本地存储
    if (props.storageMode === 'api' && appConfig.api.enabled) {
      // TODO: 调用后端API保存
      // await apiService.saveFormPrompt(props.form.id, promptContent.value)
    }
    
    // 保存到localStorage
    const key = `form_prompt_${props.form.id}`
    localStorage.setItem(key, promptContent.value)
    
    isCustomPrompt.value = true
    
    ElMessage.success('保存成功')
    emit('save', promptContent.value)
    dialogVisible.value = false
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 监听提示词内容变化，重新计算token
watch(() => promptContent.value, () => {
  calculateTokens()
})
</script>

<style scoped>
.prompt-editor-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.section-header {
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.prompt-section {
  margin-top: 20px;
}

.test-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
}

.test-result {
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.test-result h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.test-result pre {
  margin: 0;
  padding: 10px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  color: #303133;
}
</style>
