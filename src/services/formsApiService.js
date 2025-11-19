// 后端 API 服务模块
// 提供表单 schema 和数据的 CRUD 操作接口

/**
 * API 服务类
 */
class FormsApiService {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || ''
    this.apiKey = config.apiKey || ''
    this.enabled = config.enabled || false
  }

  /**
   * 配置 API 服务
   */
  configure(config) {
    this.baseUrl = config.baseUrl || this.baseUrl
    this.apiKey = config.apiKey || this.apiKey
    this.enabled = config.enabled !== undefined ? config.enabled : this.enabled
  }

  /**
   * 发送 HTTP 请求
   */
  async request(endpoint, options = {}) {
    if (!this.enabled) {
      throw new Error('API 服务未启用')
    }

    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
      ...options.headers
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API 请求错误:', error)
      throw error
    }
  }

  // ========== 表单 Schema CRUD ==========

  /**
   * 获取所有表单
   */
  async getForms() {
    return await this.request('/api/forms', {
      method: 'GET'
    })
  }

  /**
   * 获取单个表单
   */
  async getForm(formId) {
    return await this.request(`/api/forms/${formId}`, {
      method: 'GET'
    })
  }

  /**
   * 创建表单
   */
  async createForm(formData) {
    return await this.request('/api/forms', {
      method: 'POST',
      body: JSON.stringify(formData)
    })
  }

  /**
   * 更新表单
   */
  async updateForm(formId, formData) {
    return await this.request(`/api/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify(formData)
    })
  }

  /**
   * 删除表单
   */
  async deleteForm(formId) {
    return await this.request(`/api/forms/${formId}`, {
      method: 'DELETE'
    })
  }

  // ========== 表单数据结果 CRUD ==========

  /**
   * 获取表单的所有数据
   */
  async getFormResults(formId) {
    return await this.request(`/api/forms/${formId}/results`, {
      method: 'GET'
    })
  }

  /**
   * 获取单条数据
   */
  async getFormResult(formId, resultId) {
    return await this.request(`/api/forms/${formId}/results/${resultId}`, {
      method: 'GET'
    })
  }

  /**
   * 创建表单数据
   */
  async createFormResult(formId, resultData) {
    return await this.request(`/api/forms/${formId}/results`, {
      method: 'POST',
      body: JSON.stringify(resultData)
    })
  }

  /**
   * 更新表单数据
   */
  async updateFormResult(formId, resultId, resultData) {
    return await this.request(`/api/forms/${formId}/results/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify(resultData)
    })
  }

  /**
   * 删除表单数据
   */
  async deleteFormResult(formId, resultId) {
    return await this.request(`/api/forms/${formId}/results/${resultId}`, {
      method: 'DELETE'
    })
  }

  // ========== AI 数据提取 ==========

  /**
   * AI 数据提取
   */
  async extractData(formId, content, options = {}) {
    return await this.request(`/api/forms/${formId}/extract`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        ...options
      })
    })
  }

  // ========== 提示词管理 ==========

  /**
   * 获取表单的自定义提示词
   */
  async getFormPrompt(formId) {
    return await this.request(`/api/forms/${formId}/prompt`, {
      method: 'GET'
    })
  }

  /**
   * 保存表单的自定义提示词
   */
  async saveFormPrompt(formId, prompt) {
    return await this.request(`/api/forms/${formId}/prompt`, {
      method: 'PUT',
      body: JSON.stringify({ prompt })
    })
  }

  /**
   * 删除表单的自定义提示词（恢复默认）
   */
  async deleteFormPrompt(formId) {
    return await this.request(`/api/forms/${formId}/prompt`, {
      method: 'DELETE'
    })
  }

  // ========== 批量操作 ==========

  /**
   * 批量创建表单数据
   */
  async batchCreateFormResults(formId, resultsData) {
    return await this.request(`/api/forms/${formId}/results/batch`, {
      method: 'POST',
      body: JSON.stringify({ results: resultsData })
    })
  }

  /**
   * 批量删除表单数据
   */
  async batchDeleteFormResults(formId, resultIds) {
    return await this.request(`/api/forms/${formId}/results/batch`, {
      method: 'DELETE',
      body: JSON.stringify({ ids: resultIds })
    })
  }

  // ========== 导入导出 ==========

  /**
   * 导出表单 Schema
   */
  async exportSchema(formId) {
    return await this.request(`/api/forms/${formId}/export`, {
      method: 'GET'
    })
  }

  /**
   * 导入表单 Schema
   */
  async importSchema(schemaData) {
    return await this.request('/api/forms/import', {
      method: 'POST',
      body: JSON.stringify(schemaData)
    })
  }

  /**
   * 导出表单数据
   */
  async exportResults(formId, format = 'json') {
    return await this.request(`/api/forms/${formId}/results/export?format=${format}`, {
      method: 'GET'
    })
  }
}

// 创建单例实例
export const apiService = new FormsApiService()

// 导出类供需要时使用
export default FormsApiService
