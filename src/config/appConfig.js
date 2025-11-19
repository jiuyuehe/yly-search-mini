// 配置管理模块
import { reactive } from 'vue'

/**
 * 应用配置
 */
export const appConfig = reactive({
  // 存储模式: 'localStorage' 或 'api'
  storageMode: 'localStorage',
  
  // API 配置
  api: {
    enabled: false,
    baseUrl: '',
    apiKey: ''
  },
  
  // AI 服务配置
  ai: {
    enabled: false,
    apiUrl: '',
    apiKey: '',
    model: 'gpt-3.5-turbo'
  },
  
  // 从 localStorage 加载配置
  load() {
    try {
      const savedConfig = localStorage.getItem('appConfig')
      if (savedConfig) {
        const config = JSON.parse(savedConfig)
        Object.assign(this, config)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  },
  
  // 保存配置到 localStorage
  save() {
    try {
      const config = {
        storageMode: this.storageMode,
        api: { ...this.api },
        ai: { ...this.ai }
      }
      localStorage.setItem('appConfig', JSON.stringify(config))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  },
  
  // 更新存储模式
  setStorageMode(mode) {
    this.storageMode = mode
    this.save()
  },
  
  // 更新 API 配置
  setApiConfig(config) {
    Object.assign(this.api, config)
    this.save()
  },
  
  // 更新 AI 配置
  setAiConfig(config) {
    Object.assign(this.ai, config)
    this.save()
  }
})

// 初始化时加载配置
appConfig.load()

export default appConfig
