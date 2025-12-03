// 表单数据管理存储
import { reactive } from 'vue'
import { formsService } from '../services/formsService'


const normalizeId = (id) => (id == null ? null : String(id))
const matchId = (storedId, targetId) => {
  const normalizedStored = normalizeId(storedId)
  const normalizedTarget = normalizeId(targetId)
  return normalizedStored !== null && normalizedTarget !== null && normalizedStored === normalizedTarget
}

const normalizeFormDataRecord = (raw, fallbackId) => {
  const data = raw?.data ?? raw?.fields ?? raw
  const createdAt = raw?.createdAt ?? raw?.createTime ?? data?.createdAt ?? ''
  const updatedAt = raw?.updatedAt ?? raw?.updateTime ?? data?.updatedAt ?? ''
  const id = raw?.id ?? raw?.documentId ?? raw?._id ?? fallbackId
  return { id, data, createdAt, updatedAt, raw }
}

export const formStore = reactive({
  forms: [],
  formTotal: 0,
  formResults: {},
  formDataPagination: {},
  formPrompts: {},

  async loadForms({ pageNo = 1, pageSize = 100 } = {}) {
    // Prefer server-side pagination when service supports it
    if (typeof formsService.getFormsPage === 'function') {
      const { list, total } = await formsService.getFormsPage({ pageNo, pageSize })
      console.log('Fetched forms (page):', list, total)
      this.forms = list || []
      this.formTotal = total;
      (this.forms || []).forEach((form) => {
        this.formResults[form.id] = form.structureResult || []
      })
      return { list: this.forms, total: this.formTotal }
    }

    // Fallback: full list
    const fetchedForms = await formsService.getForms()
    this.forms = fetchedForms
    this.formTotal = fetchedForms.length
    fetchedForms.forEach((form) => {
      this.formResults[form.id] = form.structureResult || []
    })
    return { list: this.forms, total: this.formTotal }
  },

  async addForm(form) {
    const payload = {
      name: form.name || '未命名表单',
      description: form.description || '',
      structure: form.schema || [],
      structureResult: form.structureResult || []
    }
    const savedForm = await formsService.createForm(payload)
    this.forms.push(savedForm)
    this.formResults[savedForm.id] = savedForm.structureResult || []
    return savedForm
  },

  async updateForm(id, updates) {
    const index = this.forms.findIndex(f => matchId(f.id, id))
    if (index === -1) {
      return null
    }
    const payload = {
      name: updates.name,
      description: updates.description,
      structure: updates.schema || []
    }
    const savedForm = await formsService.updateForm(id, payload)
    this.forms[index] = savedForm
    return savedForm
  },

  async deleteForm(id) {
    const index = this.forms.findIndex(f => matchId(f.id, id))
    if (index !== -1) {
      await formsService.deleteForm(id)
      this.forms.splice(index, 1)
      delete this.formResults[id]
    }
  },

  getForm(id) {
    if (id == null) {
      return null
    }
    return this.forms.find(f => matchId(f.id, id))
  },

  async saveFormResult(formId, result) {
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
    try {
      await formsService.saveFormData(formId, result)
    } catch (error) {
      console.error('保存用户表单数据到后端失败:', error)
    }
    this.formResults[formId].push(newResult)
    console.log("Saved new form result:", newResult)
    return newResult
  },

  async addFormResult(formId, result) {
    return this.saveFormResult(formId, result)
  },

  async loadFormResults(formId, { esId, pageNo = 1, pageSize = 10 } = {}) {
    if (!formId) {
      return { list: [], total: 0 }
    }
    const { list, total } = await formsService.pageFormData({ formId, esId, pageNo, pageSize })
    const normalizedList = list.map((item, idx) => normalizeFormDataRecord(item, `${formId}-${pageNo}-${idx}`))
    this.formResults[formId] = normalizedList
    this.formDataPagination[formId] = { pageNo, pageSize, total }
    return { list: normalizedList, total }
  },

  getFormDataPagination(formId) {
    return this.formDataPagination[formId] || { pageNo: 1, pageSize: 10, total: 0 }
  },

  async updateFormResult(formId, resultId, data) {
    if (this.formResults[formId]) {
      const index = this.formResults[formId].findIndex(r => r.id === resultId)
      if (index !== -1) {
        const updatedResult = {
          ...this.formResults[formId][index],
          data,
          updatedAt: new Date().toISOString()
        }
        this.formResults[formId][index] = updatedResult
      }
    }
  },

  async deleteFormResult(formId, resultId) {
    if (this.formResults[formId]) {
      const index = this.formResults[formId].findIndex(r => r.id === resultId)
      if (index !== -1) {
        this.formResults[formId].splice(index, 1)
      }
    }
  },

  getFormResults(formId) {
    return this.formResults[formId] || []
  },

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

  importSchema(schemaData) {
    return this.addForm({
      name: schemaData.name || '导入的表单',
      description: schemaData.description || '',
      schema: schemaData.schema || []
    })
  },

  async getFormPrompt(formId) {
    try {
      const response = await formsService.getFormPrompt(formId)
      const prompt = response?.prompt ?? null
      if (prompt) {
        this.formPrompts[formId] = prompt
      }
      return prompt
    } catch (error) {
      console.error('API 获取提示词失败:', error)
      return null
    }
  },

  async saveFormPrompt(formId, prompt) {
    try {
      await formsService.saveFormPrompt(formId, prompt)
      this.formPrompts[formId] = prompt
    } catch (error) {
      console.error('API 保存提示词失败:', error)
    }
  },

  async deleteFormPrompt(formId) {
    try {
      await formsService.deleteFormPrompt(formId)
      delete this.formPrompts[formId]
    } catch (error) {
      console.error('API 删除提示词失败:', error)
    }
  }
})
