// AI 数据提取服务
// 用于从文本或文件中提取结构化数据

/**
 * 生成 Schema 的自然语言描述
 * @param {Array} schema - 表单 schema 定义
 * @returns {string} 自然语言描述
 */
export const generateSchemaDescription = (schema) => {
  let description = '请根据以下表单字段要求提取数据：\n\n'
  
  const describeField = (field, indent = '') => {
    let fieldDesc = `${indent}字段: ${field.label} (键名: ${field.key})\n`
    fieldDesc += `${indent}类型: ${getFieldTypeDescription(field.type)}\n`
    
    if (field.required) {
      fieldDesc += `${indent}必填: 是\n`
    }
    
    if (field.options && field.options.length > 0) {
      fieldDesc += `${indent}可选值: ${field.options.map(opt => opt.label || opt.value).join(', ')}\n`
    }
    
    if (field.children && field.children.length > 0) {
      fieldDesc += `${indent}子字段:\n`
      field.children.forEach(child => {
        fieldDesc += describeField(child, indent + '  ')
      })
    }
    
    fieldDesc += '\n'
    return fieldDesc
  }
  
  schema.forEach(field => {
    description += describeField(field)
  })
  
  return description
}

/**
 * 获取字段类型的描述
 */
const getFieldTypeDescription = (type) => {
  const typeMap = {
    'input-short': '短文本 (字符串)',
    'input-long': '长文本 (字符串)',
    'input-number': '数字 (整数或小数)',
    'input-phone': '手机号 (11位数字，格式: 1XXXXXXXXXX)',
    'input-email': '邮箱 (格式: xxx@xxx.xxx)',
    'input-date': '日期 (格式: YYYY-MM-DD)',
    'input-datetime': '日期时间 (ISO 8601格式)',
    'input-ip': 'IP地址 (格式: XXX.XXX.XXX.XXX)',
    'select-single': '单选 (字符串)',
    'select-multiple': '多选 (字符串数组)',
    'radio': '单选 (字符串)',
    'checkbox': '多选 (字符串数组)',
    'file-upload': '文件 (文件数组)',
    'object': '对象 (嵌套结构)'
  }
  return typeMap[type] || '文本'
}

/**
 * 生成严格的 AI 提示词
 * @param {Array} schema - 表单 schema
 * @param {string} content - 待提取的内容
 * @returns {string} 完整的提示词
 */
export const generateAIPrompt = (schema, content) => {
  const schemaDesc = generateSchemaDescription(schema)
  const jsonStructure = generateJSONStructure(schema)
  
  return `你是一个专业的数据提取助手。请从以下文本中提取信息，并严格按照JSON格式返回。

${schemaDesc}

**重要要求：**
1. 必须返回有效的 JSON 对象，不要包含任何其他文字说明
2. JSON 的键名必须严格对应 schema 中的 "键名" 字段
3. 数据类型必须符合 schema 中的 "类型" 定义
4. 如果文本中没有某个字段的信息，该字段使用空值 (null, "", [], {})
5. 日期格式必须为 ISO 8601 标准 (YYYY-MM-DDTHH:mm:ss.sssZ)
6. 数字类型不要使用引号包裹
7. 布尔值使用 true/false，不要使用字符串
8. 数组类型必须返回数组，即使只有一个元素
9. 对象类型必须返回对象结构

**期望的 JSON 结构示例：**
\`\`\`json
${JSON.stringify(jsonStructure, null, 2)}
\`\`\`

**待提取的文本内容：**
${content}

**请直接返回 JSON 对象，不要添加任何额外的文字说明：**`
}

/**
 * 生成 JSON 结构示例
 */
const generateJSONStructure = (schema) => {
  const structure = {}
  
  schema.forEach(field => {
    switch (field.type) {
      case 'input-short':
      case 'input-long':
      case 'input-phone':
      case 'input-email':
      case 'input-ip':
      case 'select-single':
      case 'radio':
        structure[field.key] = `示例${field.label}`
        break
      case 'input-number':
        structure[field.key] = 0
        break
      case 'input-date':
        structure[field.key] = '2024-01-01'
        break
      case 'input-datetime':
        structure[field.key] = '2024-01-01T00:00:00.000Z'
        break
      case 'select-multiple':
      case 'checkbox':
        structure[field.key] = field.options && field.options.length > 0 
          ? [field.options[0].value] 
          : []
        break
      case 'file-upload':
        structure[field.key] = []
        break
      case 'object':
        if (field.children && field.children.length > 0) {
          structure[field.key] = generateJSONStructure(field.children)
        } else {
          structure[field.key] = {}
        }
        break
      default:
        structure[field.key] = ''
    }
  })
  
  return structure
}

/**
 * 验证提取的数据是否符合 schema
 * @param {Object} data - 提取的数据
 * @param {Array} schema - 表单 schema
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateExtractedData = (data, schema) => {
  const errors = []
  
  const validateField = (value, field, path = '') => {
    const fieldPath = path ? `${path}.${field.key}` : field.key
    
    // 检查必填字段
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldPath}: 必填字段不能为空`)
      return
    }
    
    // 类型检查
    switch (field.type) {
      case 'input-number':
        if (value !== null && value !== undefined && value !== '' && typeof value !== 'number') {
          errors.push(`${fieldPath}: 必须是数字类型`)
        }
        break
      case 'input-phone':
        if (value && !/^1[3-9]\d{9}$/.test(value)) {
          errors.push(`${fieldPath}: 手机号格式不正确`)
        }
        break
      case 'input-email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${fieldPath}: 邮箱格式不正确`)
        }
        break
      case 'input-ip':
        if (value && !/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
          errors.push(`${fieldPath}: IP地址格式不正确`)
        }
        break
      case 'select-multiple':
      case 'checkbox':
        if (value !== null && value !== undefined && !Array.isArray(value)) {
          errors.push(`${fieldPath}: 必须是数组类型`)
        }
        break
      case 'object':
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          if (field.children) {
            field.children.forEach(child => {
              validateField(value[child.key], child, fieldPath)
            })
          }
        } else if (value !== null && value !== undefined) {
          errors.push(`${fieldPath}: 必须是对象类型`)
        }
        break
    }
  }
  
  schema.forEach(field => {
    validateField(data[field.key], field)
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 调用 AI 服务提取数据
 * @param {Object} config - AI 服务配置
 * @param {Array} schema - 表单 schema
 * @param {string} content - 待提取的内容
 * @returns {Promise<Object>} 提取的数据
 */
export const extractDataWithAI = async (config, schema, content) => {
  const { apiUrl, apiKey, model } = config
  
  if (!apiUrl) {
    throw new Error('AI 服务 API URL 未配置')
  }
  
  const prompt = generateAIPrompt(schema, content)
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的数据提取助手，擅长从文本中提取结构化数据。你的回答必须是有效的 JSON 格式，不要包含任何其他文字说明。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    })
    
    if (!response.ok) {
      throw new Error(`AI 服务请求失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    // 解析 AI 返回的内容
    let extractedData
    if (result.choices && result.choices[0] && result.choices[0].message) {
      const content = result.choices[0].message.content
      extractedData = JSON.parse(content)
    } else if (result.data) {
      extractedData = result.data
    } else {
      extractedData = result
    }
    
    // 验证提取的数据
    const validation = validateExtractedData(extractedData, schema)
    if (!validation.valid) {
      console.warn('数据验证警告:', validation.errors)
      // 即使有警告也返回数据，让用户可以手动修正
    }
    
    return extractedData
  } catch (error) {
    console.error('AI 数据提取失败:', error)
    throw error
  }
}

/**
 * 从文件读取内容
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件内容
 */
export const readFileContent = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    
    reader.onerror = (error) => {
      reject(error)
    }
    
    // 根据文件类型选择读取方式
    if (file.type === 'application/pdf') {
      // PDF 需要特殊处理，这里简化为提示用户
      reject(new Error('PDF 文件需要额外的解析库，请使用文本文件或手动输入文本'))
    } else {
      reader.readAsText(file)
    }
  })
}
