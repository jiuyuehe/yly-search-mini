// 表单字段类型定义
export const FIELD_TYPES = {
  // 输入类型
  INPUT_SHORT: { label: '短文本', value: 'input-short', component: 'el-input' },
  INPUT_LONG: { label: '长文本', value: 'input-long', component: 'el-input' },
  INPUT_NUMBER: { label: '数字', value: 'input-number', component: 'el-input-number' },
  INPUT_PHONE: { label: '手机号', value: 'input-phone', component: 'el-input', pattern: /^1[3-9]\d{9}$/ },
  INPUT_EMAIL: { label: '邮箱', value: 'input-email', component: 'el-input', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  INPUT_DATE: { label: '日期', value: 'input-date', component: 'el-date-picker' },
  INPUT_DATETIME: { label: '日期时间', value: 'input-datetime', component: 'el-date-picker' },
  INPUT_IP: { label: 'IP地址', value: 'input-ip', component: 'el-input', pattern: /^(\d{1,3}\.){3}\d{1,3}$/ },
  
  // 选择类型
  SELECT_SINGLE: { label: '单选下拉', value: 'select-single', component: 'el-select' },
  SELECT_MULTIPLE: { label: '多选下拉', value: 'select-multiple', component: 'el-select' },
  RADIO: { label: '单选按钮', value: 'radio', component: 'el-radio-group' },
  CHECKBOX: { label: '多选框', value: 'checkbox', component: 'el-checkbox-group' },
  
  // 文件上传
  FILE_UPLOAD: { label: '文件上传', value: 'file-upload', component: 'el-upload' },
  
  // 对象类型（嵌套表单）
  OBJECT: { label: '对象(嵌套)', value: 'object', component: 'custom' }
}

// 获取所有字段类型选项
export const getFieldTypeOptions = () => {
  return Object.values(FIELD_TYPES).map(type => ({
    label: type.label,
    value: type.value
  }))
}

// 根据类型获取字段配置
export const getFieldConfig = (type) => {
  return Object.values(FIELD_TYPES).find(t => t.value === type) || FIELD_TYPES.INPUT_SHORT
}

// 验证字段值
export const validateFieldValue = (field, value) => {
  const config = getFieldConfig(field.type)
  
  // 必填验证
  if (field.required && !value) {
    return { valid: false, message: `${field.label}不能为空` }
  }
  
  // 类型特定验证
  if (value) {
    switch (field.type) {
      case 'input-phone':
        if (!config.pattern.test(value)) {
          return { valid: false, message: '手机号格式不正确' }
        }
        break
      case 'input-email':
        if (!config.pattern.test(value)) {
          return { valid: false, message: '邮箱格式不正确' }
        }
        break
      case 'input-ip':
        if (!config.pattern.test(value)) {
          return { valid: false, message: 'IP地址格式不正确' }
        }
        break
      case 'input-number':
        if (isNaN(value)) {
          return { valid: false, message: '必须是数字' }
        }
        break
    }
  }
  
  return { valid: true, message: '' }
}

// 生成默认值
export const generateDefaultValue = (field) => {
  switch (field.type) {
    case 'input-number':
      return 0
    case 'select-multiple':
    case 'checkbox':
      return []
    case 'object':
      return {}
    case 'file-upload':
      return []
    default:
      return field.defaultValue || ''
  }
}

// 生成表单的初始数据
export const generateFormData = (schema) => {
  const data = {}
  schema.forEach(field => {
    data[field.key] = field.defaultValue !== undefined ? field.defaultValue : generateDefaultValue(field)
    
    // 如果是对象类型，递归生成子字段数据
    if (field.type === 'object' && field.children) {
      data[field.key] = generateFormData(field.children)
    }
  })
  return data
}

// 导出 schema 到 JSON 文件
export const exportSchemaToJson = (schema, filename = 'form-schema.json') => {
  const dataStr = JSON.stringify(schema, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
  
  const exportFileDefaultName = filename
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

// 导出数据到 CSV 文件
export const exportDataToCsv = (data, schema, filename = 'form-data.csv') => {
  if (!data || data.length === 0) {
    return
  }
  
  // 生成表头
  const headers = schema.map(field => field.label).join(',')
  
  // 生成数据行
  const rows = data.map(item => {
    return schema.map(field => {
      const value = item.data[field.key]
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`
      }
      if (typeof value === 'object') {
        return `"${JSON.stringify(value)}"`
      }
      return `"${value || ''}"`
    }).join(',')
  })
  
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', url)
  linkElement.setAttribute('download', filename)
  linkElement.click()
  
  URL.revokeObjectURL(url)
}
