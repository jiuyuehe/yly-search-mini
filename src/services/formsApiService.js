// 后端 API 服务模块
// 提供表单 schema 和数据的 CRUD 操作接口

/**
 * API 服务类
 */

// 新后端 API 服务，字段与后端模型完全一致
class FormsApiService {
  constructor() {
    this.baseUrl = '' // 可根据需要设置
  }

  // 通用请求
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
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

  // ========== 表单 CRUD ==========

  // 创建表单
  async createForm(form) {
    // structure/schema 需序列化
    const payload = {
      ...form,
      structure: JSON.stringify(form.schema || []),
      structureResult: form.structureResult ? JSON.stringify(form.structureResult) : '',
      schema: undefined // 前端内部用，后端无此字段
    }
    return await this.request('/admin-api/rag/ai/form/create', {
      method: 'POST',
      body: JSON.stringify({ customFormDO: payload })
    })
  }

  // 更新表单
  async updateForm(form) {
    const payload = {
      ...form,
      structure: JSON.stringify(form.schema || []),
      structureResult: form.structureResult ? JSON.stringify(form.structureResult) : '',
      schema: undefined
    }
    return await this.request('/admin-api/rag/ai/form/update', {
      method: 'POST',
      body: JSON.stringify({ customFormDO: payload })
    })
  }

  // 获取单个表单
  async getForm(id) {
    const res = await this.request(`/admin-api/rag/ai/form/get?id=${id}`, {
      method: 'GET'
    })
    if (res?.data) {
      // 反序列化 structure/structureResult
      try {
        res.data.schema = res.data.structure ? JSON.parse(res.data.structure) : []
      } catch { res.data.schema = [] }
      try {
        res.data.structureResult = res.data.structureResult ? JSON.parse(res.data.structureResult) : undefined
      } catch { res.data.structureResult = undefined }
    }
    return res
  }

  // 删除表单
  async deleteForm(id) {
    return await this.request(`/admin-api/rag/ai/form/delete?id=${id}`, {
      method: 'DELETE'
    })
  }

  // ========== 其他接口可按需扩展 ==========
}

export const apiService = new FormsApiService()
export default FormsApiService
