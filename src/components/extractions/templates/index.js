// 表单模板汇总
import { enterpriseTemplates } from './enterpriseTemplates'
import { educationTemplates } from './educationTemplates'
import { militaryTemplates } from './militaryTemplates'

/**
 * 模板分类
 */
export const templateCategories = {
  enterprise: {
    name: '企业',
    description: '企业管理相关表单模板',
    icon: '🏢'
  },
  education: {
    name: '教育',
    description: '教育教学相关表单模板',
    icon: '🎓'
  },
  military: {
    name: '军工',
    description: '军工情报相关表单模板',
    icon: '🛡️'
  }
}

/**
 * 所有模板列表
 */
export const allTemplates = [
  ...enterpriseTemplates,
  ...educationTemplates,
  ...militaryTemplates
]

/**
 * 按分类获取模板
 */
export const getTemplatesByCategory = (category) => {
  return allTemplates.filter(template => template.category === category)
}

/**
 * 根据名称搜索模板
 */
export const searchTemplates = (keyword) => {
  if (!keyword) return allTemplates
  
  const lowerKeyword = keyword.toLowerCase()
  return allTemplates.filter(template => 
    template.name.toLowerCase().includes(lowerKeyword) ||
    template.description.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 根据ID获取模板
 */
export const getTemplateById = (id) => {
  return allTemplates.find((template, index) => index === id)
}

// 导出各类模板
export {
  enterpriseTemplates,
  educationTemplates,
  militaryTemplates
}
