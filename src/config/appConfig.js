// 配置管理模块
import { reactive } from 'vue'

/**
 * 应用配置
 */
export const appConfig = reactive({
  // 仅保留 AI 服务配置
  ai: {
    enabled: false,
    apiUrl: '',
    apiKey: '',
    model: 'gpt-3.5-turbo'
  },
  
  // 只保留 AI 配置方法
  setAiConfig(config) {
    Object.assign(this.ai, config)
  }
})

export default appConfig
