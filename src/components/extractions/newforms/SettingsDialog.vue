<template>
  <el-dialog
    v-model="dialogVisible"
    title="系统设置"
    width="700px"
    @close="handleClose"
  >
    <el-tabs v-model="activeTab">
      <!-- 存储设置 -->
      <el-tab-pane label="存储设置" name="storage">
        <el-form label-width="120px">
          <el-form-item label="存储模式">
            <el-radio-group v-model="storageConfig.mode">
              <el-radio label="localStorage">本地存储</el-radio>
              <el-radio label="api">后端API</el-radio>
            </el-radio-group>
            <div style="margin-top: 10px">
              <el-text type="info" size="small">
                本地存储：数据保存在浏览器中<br />
                后端API：数据保存到后端服务器（需配置API服务）
              </el-text>
            </div>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- API 设置 -->
      <el-tab-pane label="API服务" name="api">
        <el-form label-width="120px">
          <el-form-item label="启用API服务">
            <el-switch v-model="apiConfig.enabled" />
          </el-form-item>
          
          <el-form-item label="API地址" v-if="apiConfig.enabled">
            <el-input
              v-model="apiConfig.baseUrl"
              placeholder="https://api.example.com"
            />
            <div style="margin-top: 5px">
              <el-text type="info" size="small">
                后端API的基础URL，例如: https://api.example.com
              </el-text>
            </div>
          </el-form-item>
          
          <el-form-item label="API密钥" v-if="apiConfig.enabled">
            <el-input
              v-model="apiConfig.apiKey"
              type="password"
              placeholder="请输入API密钥"
              show-password
            />
            <div style="margin-top: 5px">
              <el-text type="info" size="small">
                用于认证的API密钥（可选）
              </el-text>
            </div>
          </el-form-item>
          
          <el-form-item v-if="apiConfig.enabled">
            <el-button @click="testApiConnection" :loading="testing">
              测试连接
            </el-button>
          </el-form-item>
          
          <el-alert
            v-if="!apiConfig.enabled"
            title="API服务未启用"
            type="info"
            :closable="false"
          >
            启用后，表单数据和结果将通过API保存到后端服务器
          </el-alert>
        </el-form>
      </el-tab-pane>

      <!-- AI 设置 -->
      <el-tab-pane label="AI服务" name="ai">
        <el-form label-width="120px">
          <el-form-item label="启用AI服务">
            <el-switch v-model="aiConfig.enabled" />
          </el-form-item>
          
          <el-form-item label="AI API地址" v-if="aiConfig.enabled">
            <el-input
              v-model="aiConfig.apiUrl"
              placeholder="https://api.openai.com/v1/chat/completions"
            />
            <div style="margin-top: 5px">
              <el-text type="info" size="small">
                支持OpenAI兼容的API端点
              </el-text>
            </div>
          </el-form-item>
          
          <el-form-item label="API密钥" v-if="aiConfig.enabled">
            <el-input
              v-model="aiConfig.apiKey"
              type="password"
              placeholder="sk-..."
              show-password
            />
            <div style="margin-top: 5px">
              <el-text type="info" size="small">
                AI服务的API密钥
              </el-text>
            </div>
          </el-form-item>
          
          <el-form-item label="模型" v-if="aiConfig.enabled">
            <el-input
              v-model="aiConfig.model"
              placeholder="gpt-3.5-turbo"
            />
            <div style="margin-top: 5px">
              <el-text type="info" size="small">
                使用的AI模型，例如: gpt-3.5-turbo, gpt-4等
              </el-text>
            </div>
          </el-form-item>
          
          <el-alert
            v-if="!aiConfig.enabled"
            title="AI服务未启用"
            type="info"
            :closable="false"
          >
            启用后，可以使用AI智能提取表单数据。未启用时将使用模拟数据。
          </el-alert>
        </el-form>
      </el-tab-pane>

      <!-- 关于 -->
      <el-tab-pane label="关于" name="about">
        <div class="about-content">
          <h3>Form-Create 表单管理系统</h3>
          <p>版本: 1.0.0</p>
          <el-divider />
          
          <h4>功能特性</h4>
          <ul>
            <li>可视化表单设计器</li>
            <li>完整的数据管理功能</li>
            <li>AI智能数据提取</li>
            <li>丰富的表单模板市场</li>
            <li>支持本地存储和后端API</li>
            <li>模块化组件设计</li>
          </ul>
          
          <el-divider />
          
          <h4>API接口说明</h4>
          <p>后端API需要实现以下接口：</p>
          <ul>
            <li>GET/POST/PUT/DELETE /api/forms - 表单CRUD</li>
            <li>GET/POST/PUT/DELETE /api/forms/:id/results - 数据CRUD</li>
            <li>POST /api/forms/:id/extract - AI数据提取</li>
          </ul>
          
          <el-divider />
          
          <h4>技术栈</h4>
          <p>Vue 3 + Element Plus + Vite</p>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存设置</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { appConfig } from '../../../config/appConfig'
import { apiService } from '../../../services/formsApiService'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  visible: Boolean
})

// Emits
const emit = defineEmits(['update:visible'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const activeTab = ref('storage')
const testing = ref(false)

// 配置数据（使用本地副本）
const storageConfig = ref({
  mode: appConfig.storageMode
})

const apiConfig = ref({
  enabled: appConfig.api.enabled,
  baseUrl: appConfig.api.baseUrl,
  apiKey: appConfig.api.apiKey
})

const aiConfig = ref({
  enabled: appConfig.ai.enabled,
  apiUrl: appConfig.ai.apiUrl,
  apiKey: appConfig.ai.apiKey,
  model: appConfig.ai.model
})

// 监听对话框打开，重新加载配置
watch(() => props.visible, (visible) => {
  if (visible) {
    storageConfig.value = {
      mode: appConfig.storageMode
    }
    apiConfig.value = {
      enabled: appConfig.api.enabled,
      baseUrl: appConfig.api.baseUrl,
      apiKey: appConfig.api.apiKey
    }
    aiConfig.value = {
      enabled: appConfig.ai.enabled,
      apiUrl: appConfig.ai.apiUrl,
      apiKey: appConfig.ai.apiKey,
      model: appConfig.ai.model
    }
  }
})

// 测试API连接
const testApiConnection = async () => {
  testing.value = true
  
  try {
    // 临时配置API服务
    apiService.configure({
      baseUrl: apiConfig.value.baseUrl,
      apiKey: apiConfig.value.apiKey,
      enabled: true
    })
    
    // 尝试获取表单列表
    await apiService.getForms()
    
    ElMessage.success('API连接成功')
  } catch (error) {
    ElMessage.error(`API连接失败: ${error.message}`)
  } finally {
    testing.value = false
  }
}

// 保存设置
const handleSave = () => {
  // 更新存储模式
  appConfig.setStorageMode(storageConfig.value.mode)
  
  // 更新API配置
  appConfig.setApiConfig(apiConfig.value)
  apiService.configure(apiConfig.value)
  
  // 更新AI配置
  appConfig.setAiConfig(aiConfig.value)
  
  ElMessage.success('设置已保存')
  dialogVisible.value = false
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.about-content {
  padding: 20px;
}

.about-content h3 {
  margin-bottom: 10px;
  color: #303133;
}

.about-content h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #606266;
}

.about-content p {
  color: #909399;
  margin-bottom: 10px;
}

.about-content ul {
  padding-left: 20px;
  color: #606266;
}

.about-content li {
  margin-bottom: 8px;
}
</style>
