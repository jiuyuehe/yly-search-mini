// 表单数据管理存储
import { reactive, watch } from 'vue'
import { apiService } from '../services/formsApiService'
import { appConfig } from '../config/appConfig'

// 从 localStorage 加载数据
const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('加载数据失败:', error)
    return defaultValue
  }
}

// 保存数据到 localStorage
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('保存数据失败:', error)
  }
}

// 全局状态
export const formStore = reactive({
  // 表单模板列表
  forms: loadFromStorage('forms', []),
  
  // 表单数据结果集
  formResults: loadFromStorage('formResults', {}),
  
  // 表单自定义提示词
  formPrompts: loadFromStorage('formPrompts', {}),
  
  // 添加新表单
  async addForm(form) {
    const newForm = {
      id: Date.now().toString(),
      name: form.name || '未命名表单',
      description: form.description || '',
      schema: form.schema || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // 如果启用了 API 模式，先保存到后端
    if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
      try {
        const savedForm = await apiService.createForm(newForm)
        this.forms.push(savedForm)
        this.formResults[savedForm.id] = []
        return savedForm
      } catch (error) {
        console.error('API 保存表单失败，使用本地存储:', error)
      }
    }
    
    // 使用本地存储
    this.forms.push(newForm)
    // 初始化该表单的结果集
    this.formResults[newForm.id] = []
    return newForm
  },
  
  // 更新表单
  async updateForm(id, updates) {
    const index = this.forms.findIndex(f => f.id === id)
    if (index !== -1) {
      const updatedForm = {
        ...this.forms[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      // 如果启用了 API 模式，先更新到后端
      if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
        try {
          await apiService.updateForm(id, updatedForm)
        } catch (error) {
          console.error('API 更新表单失败，使用本地存储:', error)
        }
      }
      
      this.forms[index] = updatedForm
    }
  },
  
  // 删除表单
  async deleteForm(id) {
    const index = this.forms.findIndex(f => f.id === id)
    if (index !== -1) {
      // 如果启用了 API 模式，先从后端删除
      if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
        try {
          await apiService.deleteForm(id)
        } catch (error) {
          console.error('API 删除表单失败，使用本地存储:', error)
        }
      }
      
      this.forms.splice(index, 1)
      delete this.formResults[id]
    }
  },
  
  // 获取表单
  getForm(id) {
    return this.forms.find(f => f.id === id)
  },
  
  // 添加表单数据结果
  async addFormResult(formId, result) {
    if (!this.formResults[formId]) {
      this.formResults[formId] = []
    }
    const newResult = {
      id: Date.now().toString(),
      formId,
      data: result,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // 如果启用了 API 模式，先保存到后端
    if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
      try {
        const savedResult = await apiService.createFormResult(formId, newResult)
        this.formResults[formId].push(savedResult)
        return savedResult
      } catch (error) {
        console.error('API 保存数据失败，使用本地存储:', error)
      }
    }
    
    this.formResults[formId].push(newResult)
    return newResult
  },
  
  // 更新表单数据结果
  async updateFormResult(formId, resultId, data) {
    if (this.formResults[formId]) {
      const index = this.formResults[formId].findIndex(r => r.id === resultId)
      if (index !== -1) {
        const updatedResult = {
          ...this.formResults[formId][index],
          data,
          updatedAt: new Date().toISOString()
        }
        
        // 如果启用了 API 模式，先更新到后端
        if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
          try {
            await apiService.updateFormResult(formId, resultId, updatedResult)
          } catch (error) {
            console.error('API 更新数据失败，使用本地存储:', error)
          }
        }
        
        this.formResults[formId][index] = updatedResult
      }
    }
  },
  
  // 删除表单数据结果
  async deleteFormResult(formId, resultId) {
    if (this.formResults[formId]) {
      const index = this.formResults[formId].findIndex(r => r.id === resultId)
      if (index !== -1) {
        // 如果启用了 API 模式，先从后端删除
        if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
          try {
            await apiService.deleteFormResult(formId, resultId)
          } catch (error) {
            console.error('API 删除数据失败，使用本地存储:', error)
          }
        }
        
        this.formResults[formId].splice(index, 1)
      }
    }
  },
  
  // 获取表单的所有结果
  getFormResults(formId) {
    return this.formResults[formId] || []
  },
  
  // 导出表单 schema
  exportSchema(formId) {
    const form = this.getForm(formId)
    if (form) {
      return {
        name: form.name,
        description: form.description,
        schema: form.schema,
        version: '1.0.0'
      }
    }
    return null
  },
  
  // 导入表单 schema
  importSchema(schemaData) {
    return this.addForm({
      name: schemaData.name || '导入的表单',
      description: schemaData.description || '',
      schema: schemaData.schema || []
    })
  },
  
  // ========== 提示词管理 ==========
  
  // 获取表单的自定义提示词
  async getFormPrompt(formId) {
    // 如果启用了 API 模式，先从后端获取
    if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
      try {
        const response = await apiService.getFormPrompt(formId)
        return response.prompt
      } catch (error) {
        console.error('API 获取提示词失败，使用本地存储:', error)
      }
    }
    
    // 使用本地存储
    return this.formPrompts[formId] || null
  },
  
  // 保存表单的自定义提示词
  async saveFormPrompt(formId, prompt) {
    // 如果启用了 API 模式，先保存到后端
    if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
      try {
        await apiService.saveFormPrompt(formId, prompt)
      } catch (error) {
        console.error('API 保存提示词失败，使用本地存储:', error)
      }
    }
    
    // 保存到本地存储
    this.formPrompts[formId] = prompt
  },
  
  // 删除表单的自定义提示词（恢复默认）
  async deleteFormPrompt(formId) {
    // 如果启用了 API 模式，先从后端删除
    if (appConfig.storageMode === 'api' && appConfig.api.enabled) {
      try {
        await apiService.deleteFormPrompt(formId)
      } catch (error) {
        console.error('API 删除提示词失败，使用本地存储:', error)
      }
    }
    
    // 从本地存储删除
    delete this.formPrompts[formId]
  }
})

// 监听状态变化并持久化到 localStorage
watch(() => formStore.forms, (newForms) => {
  saveToStorage('forms', newForms)
}, { deep: true })

watch(() => formStore.formResults, (newResults) => {
  saveToStorage('formResults', newResults)
}, { deep: true })

watch(() => formStore.formPrompts, (newPrompts) => {
  saveToStorage('formPrompts', newPrompts)
}, { deep: true })
