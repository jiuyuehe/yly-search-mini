// 企业表单模板

/**
 * 员工档案模板
 */
export const employeeTemplate = {
  name: '员工档案',
  description: '企业员工基本信息登记表',
  category: 'enterprise',
  schema: [
    {
      label: '姓名',
      key: 'name',
      type: 'input-short',
      required: true,
      placeholder: '请输入员工姓名'
    },
    {
      label: '工号',
      key: 'employeeId',
      type: 'input-short',
      required: true,
      placeholder: '请输入工号'
    },
    {
      label: '性别',
      key: 'gender',
      type: 'radio',
      required: true,
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' }
      ]
    },
    {
      label: '出生日期',
      key: 'birthDate',
      type: 'input-date',
      required: true
    },
    {
      label: '手机号',
      key: 'phone',
      type: 'input-phone',
      required: true,
      placeholder: '请输入11位手机号'
    },
    {
      label: '邮箱',
      key: 'email',
      type: 'input-email',
      required: true,
      placeholder: '请输入邮箱地址'
    },
    {
      label: '部门',
      key: 'department',
      type: 'select-single',
      required: true,
      options: [
        { label: '技术部', value: 'tech' },
        { label: '产品部', value: 'product' },
        { label: '运营部', value: 'operations' },
        { label: '市场部', value: 'marketing' },
        { label: '人力资源部', value: 'hr' },
        { label: '财务部', value: 'finance' }
      ]
    },
    {
      label: '职位',
      key: 'position',
      type: 'input-short',
      required: true,
      placeholder: '请输入职位'
    },
    {
      label: '入职日期',
      key: 'hireDate',
      type: 'input-date',
      required: true
    },
    {
      label: '身份证号',
      key: 'idCard',
      type: 'input-short',
      placeholder: '请输入身份证号'
    },
    {
      label: '紧急联系人',
      key: 'emergencyContact',
      type: 'input-short',
      placeholder: '请输入紧急联系人姓名'
    },
    {
      label: '紧急联系电话',
      key: 'emergencyPhone',
      type: 'input-phone',
      placeholder: '请输入紧急联系电话'
    },
    {
      label: '家庭住址',
      key: 'address',
      type: 'input-long',
      placeholder: '请输入详细地址'
    },
    {
      label: '备注',
      key: 'notes',
      type: 'input-long',
      placeholder: '其他备注信息'
    }
  ]
}

/**
 * 项目档案模板
 */
export const projectTemplate = {
  name: '项目档案',
  description: '项目基本信息和进度管理表',
  category: 'enterprise',
  schema: [
    {
      label: '项目名称',
      key: 'projectName',
      type: 'input-short',
      required: true,
      placeholder: '请输入项目名称'
    },
    {
      label: '项目编号',
      key: 'projectCode',
      type: 'input-short',
      required: true,
      placeholder: '请输入项目编号'
    },
    {
      label: '项目类型',
      key: 'projectType',
      type: 'select-single',
      required: true,
      options: [
        { label: '研发项目', value: 'development' },
        { label: '实施项目', value: 'implementation' },
        { label: '咨询项目', value: 'consulting' },
        { label: '维护项目', value: 'maintenance' }
      ]
    },
    {
      label: '项目经理',
      key: 'projectManager',
      type: 'input-short',
      required: true,
      placeholder: '请输入项目经理姓名'
    },
    {
      label: '客户名称',
      key: 'clientName',
      type: 'input-short',
      required: true,
      placeholder: '请输入客户名称'
    },
    {
      label: '客户联系人',
      key: 'clientContact',
      type: 'input-short',
      placeholder: '请输入客户联系人'
    },
    {
      label: '联系电话',
      key: 'contactPhone',
      type: 'input-phone',
      placeholder: '请输入联系电话'
    },
    {
      label: '项目预算',
      key: 'budget',
      type: 'input-number',
      placeholder: '请输入预算金额（元）'
    },
    {
      label: '开始日期',
      key: 'startDate',
      type: 'input-date',
      required: true
    },
    {
      label: '计划结束日期',
      key: 'plannedEndDate',
      type: 'input-date',
      required: true
    },
    {
      label: '项目状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '未开始', value: 'not_started' },
        { label: '进行中', value: 'in_progress' },
        { label: '已完成', value: 'completed' },
        { label: '已暂停', value: 'paused' },
        { label: '已取消', value: 'cancelled' }
      ]
    },
    {
      label: '项目描述',
      key: 'description',
      type: 'input-long',
      placeholder: '请输入项目详细描述'
    },
    {
      label: '项目目标',
      key: 'objectives',
      type: 'input-long',
      placeholder: '请输入项目目标'
    },
    {
      label: '风险提示',
      key: 'risks',
      type: 'input-long',
      placeholder: '请输入项目风险'
    }
  ]
}

/**
 * 产品档案模板
 */
export const productTemplate = {
  name: '产品档案',
  description: '产品信息管理表',
  category: 'enterprise',
  schema: [
    {
      label: '产品名称',
      key: 'productName',
      type: 'input-short',
      required: true,
      placeholder: '请输入产品名称'
    },
    {
      label: '产品编号',
      key: 'productCode',
      type: 'input-short',
      required: true,
      placeholder: '请输入产品编号'
    },
    {
      label: '产品类别',
      key: 'category',
      type: 'select-single',
      required: true,
      options: [
        { label: '软件产品', value: 'software' },
        { label: '硬件产品', value: 'hardware' },
        { label: '服务产品', value: 'service' },
        { label: '解决方案', value: 'solution' }
      ]
    },
    {
      label: '产品型号',
      key: 'model',
      type: 'input-short',
      placeholder: '请输入产品型号'
    },
    {
      label: '规格参数',
      key: 'specifications',
      type: 'input-long',
      placeholder: '请输入规格参数'
    },
    {
      label: '单价',
      key: 'price',
      type: 'input-number',
      placeholder: '请输入单价（元）'
    },
    {
      label: '成本',
      key: 'cost',
      type: 'input-number',
      placeholder: '请输入成本（元）'
    },
    {
      label: '库存数量',
      key: 'stockQuantity',
      type: 'input-number',
      placeholder: '请输入库存数量'
    },
    {
      label: '生产厂家',
      key: 'manufacturer',
      type: 'input-short',
      placeholder: '请输入生产厂家'
    },
    {
      label: '供应商',
      key: 'supplier',
      type: 'input-short',
      placeholder: '请输入供应商'
    },
    {
      label: '产品状态',
      key: 'status',
      type: 'select-single',
      options: [
        { label: '在售', value: 'active' },
        { label: '停售', value: 'inactive' },
        { label: '预售', value: 'presale' },
        { label: '缺货', value: 'out_of_stock' }
      ]
    },
    {
      label: '产品描述',
      key: 'description',
      type: 'input-long',
      placeholder: '请输入产品详细描述'
    },
    {
      label: '产品特性',
      key: 'features',
      type: 'input-long',
      placeholder: '请输入产品特性'
    },
    {
      label: '备注',
      key: 'notes',
      type: 'input-long',
      placeholder: '其他备注信息'
    }
  ]
}

/**
 * 合同信息模板
 */
export const contractTemplate = {
  name: '合同信息',
  description: '合同管理登记表',
  category: 'enterprise',
  schema: [
    {
      label: '合同编号',
      key: 'contractNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入合同编号'
    },
    {
      label: '合同名称',
      key: 'contractName',
      type: 'input-short',
      required: true,
      placeholder: '请输入合同名称'
    },
    {
      label: '合同类型',
      key: 'contractType',
      type: 'select-single',
      required: true,
      options: [
        { label: '销售合同', value: 'sales' },
        { label: '采购合同', value: 'purchase' },
        { label: '服务合同', value: 'service' },
        { label: '租赁合同', value: 'lease' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '甲方（我方）',
      key: 'partyA',
      type: 'input-short',
      required: true,
      placeholder: '请输入甲方名称'
    },
    {
      label: '乙方（客户/供应商）',
      key: 'partyB',
      type: 'input-short',
      required: true,
      placeholder: '请输入乙方名称'
    },
    {
      label: '乙方联系人',
      key: 'partyBContact',
      type: 'input-short',
      placeholder: '请输入乙方联系人'
    },
    {
      label: '联系电话',
      key: 'contactPhone',
      type: 'input-phone',
      placeholder: '请输入联系电话'
    },
    {
      label: '合同金额',
      key: 'amount',
      type: 'input-number',
      required: true,
      placeholder: '请输入合同金额（元）'
    },
    {
      label: '签订日期',
      key: 'signDate',
      type: 'input-date',
      required: true
    },
    {
      label: '生效日期',
      key: 'effectiveDate',
      type: 'input-date',
      required: true
    },
    {
      label: '到期日期',
      key: 'expiryDate',
      type: 'input-date',
      required: true
    },
    {
      label: '合同状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '草稿', value: 'draft' },
        { label: '审批中', value: 'pending' },
        { label: '已生效', value: 'active' },
        { label: '已完成', value: 'completed' },
        { label: '已终止', value: 'terminated' }
      ]
    },
    {
      label: '付款方式',
      key: 'paymentMethod',
      type: 'select-single',
      options: [
        { label: '一次性付款', value: 'lump_sum' },
        { label: '分期付款', value: 'installment' },
        { label: '按进度付款', value: 'milestone' }
      ]
    },
    {
      label: '负责人',
      key: 'owner',
      type: 'input-short',
      placeholder: '请输入负责人姓名'
    },
    {
      label: '合同内容',
      key: 'content',
      type: 'input-long',
      placeholder: '请输入合同主要内容'
    },
    {
      label: '备注',
      key: 'notes',
      type: 'input-long',
      placeholder: '其他备注信息'
    }
  ]
}

/**
 * 财务信息模板
 */
export const financeTemplate = {
  name: '财务信息',
  description: '财务收支记录表',
  category: 'enterprise',
  schema: [
    {
      label: '单据编号',
      key: 'documentNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入单据编号'
    },
    {
      label: '业务类型',
      key: 'transactionType',
      type: 'select-single',
      required: true,
      options: [
        { label: '收入', value: 'income' },
        { label: '支出', value: 'expense' }
      ]
    },
    {
      label: '科目分类',
      key: 'category',
      type: 'select-single',
      required: true,
      options: [
        { label: '销售收入', value: 'sales_revenue' },
        { label: '服务收入', value: 'service_revenue' },
        { label: '工资支出', value: 'salary' },
        { label: '办公费用', value: 'office' },
        { label: '差旅费用', value: 'travel' },
        { label: '采购支出', value: 'procurement' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '金额',
      key: 'amount',
      type: 'input-number',
      required: true,
      placeholder: '请输入金额（元）'
    },
    {
      label: '交易日期',
      key: 'transactionDate',
      type: 'input-date',
      required: true
    },
    {
      label: '付款方式',
      key: 'paymentMethod',
      type: 'select-single',
      options: [
        { label: '现金', value: 'cash' },
        { label: '银行转账', value: 'bank_transfer' },
        { label: '支付宝', value: 'alipay' },
        { label: '微信', value: 'wechat' },
        { label: '支票', value: 'cheque' }
      ]
    },
    {
      label: '对方单位',
      key: 'counterparty',
      type: 'input-short',
      placeholder: '请输入对方单位名称'
    },
    {
      label: '经办人',
      key: 'handler',
      type: 'input-short',
      placeholder: '请输入经办人姓名'
    },
    {
      label: '审批人',
      key: 'approver',
      type: 'input-short',
      placeholder: '请输入审批人姓名'
    },
    {
      label: '审批状态',
      key: 'approvalStatus',
      type: 'select-single',
      options: [
        { label: '待审批', value: 'pending' },
        { label: '已审批', value: 'approved' },
        { label: '已驳回', value: 'rejected' }
      ]
    },
    {
      label: '摘要说明',
      key: 'description',
      type: 'input-long',
      placeholder: '请输入摘要说明'
    },
    {
      label: '备注',
      key: 'notes',
      type: 'input-long',
      placeholder: '其他备注信息'
    }
  ]
}

/**
 * 售后工单模板
 */
export const serviceTicketTemplate = {
  name: '售后工单',
  description: '售后服务工单管理表',
  category: 'enterprise',
  schema: [
    {
      label: '工单编号',
      key: 'ticketNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入工单编号'
    },
    {
      label: '工单标题',
      key: 'title',
      type: 'input-short',
      required: true,
      placeholder: '请输入工单标题'
    },
    {
      label: '客户名称',
      key: 'customerName',
      type: 'input-short',
      required: true,
      placeholder: '请输入客户名称'
    },
    {
      label: '联系人',
      key: 'contactPerson',
      type: 'input-short',
      required: true,
      placeholder: '请输入联系人姓名'
    },
    {
      label: '联系电话',
      key: 'contactPhone',
      type: 'input-phone',
      required: true,
      placeholder: '请输入联系电话'
    },
    {
      label: '问题类型',
      key: 'issueType',
      type: 'select-single',
      required: true,
      options: [
        { label: '产品故障', value: 'malfunction' },
        { label: '使用咨询', value: 'consultation' },
        { label: '投诉建议', value: 'complaint' },
        { label: '退换货', value: 'return' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '优先级',
      key: 'priority',
      type: 'select-single',
      required: true,
      options: [
        { label: '紧急', value: 'urgent' },
        { label: '高', value: 'high' },
        { label: '中', value: 'medium' },
        { label: '低', value: 'low' }
      ]
    },
    {
      label: '产品名称',
      key: 'productName',
      type: 'input-short',
      placeholder: '请输入产品名称'
    },
    {
      label: '产品序列号',
      key: 'serialNumber',
      type: 'input-short',
      placeholder: '请输入产品序列号'
    },
    {
      label: '问题描述',
      key: 'description',
      type: 'input-long',
      required: true,
      placeholder: '请详细描述问题'
    },
    {
      label: '创建时间',
      key: 'createTime',
      type: 'input-datetime',
      required: true
    },
    {
      label: '处理人',
      key: 'handler',
      type: 'input-short',
      placeholder: '请输入处理人姓名'
    },
    {
      label: '工单状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '待处理', value: 'pending' },
        { label: '处理中', value: 'in_progress' },
        { label: '已解决', value: 'resolved' },
        { label: '已关闭', value: 'closed' }
      ]
    },
    {
      label: '处理结果',
      key: 'resolution',
      type: 'input-long',
      placeholder: '请输入处理结果'
    },
    {
      label: '客户满意度',
      key: 'satisfaction',
      type: 'select-single',
      options: [
        { label: '非常满意', value: 'very_satisfied' },
        { label: '满意', value: 'satisfied' },
        { label: '一般', value: 'neutral' },
        { label: '不满意', value: 'dissatisfied' }
      ]
    }
  ]
}

/**
 * 客户拜访模板
 */
export const visitTemplate = {
  name: '客户拜访',
  description: '客户拜访记录表',
  category: 'enterprise',
  schema: [
    {
      label: '拜访编号',
      key: 'visitNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入拜访编号'
    },
    {
      label: '客户名称',
      key: 'customerName',
      type: 'input-short',
      required: true,
      placeholder: '请输入客户名称'
    },
    {
      label: '拜访对象',
      key: 'visitee',
      type: 'input-short',
      required: true,
      placeholder: '请输入拜访对象姓名'
    },
    {
      label: '对方职位',
      key: 'position',
      type: 'input-short',
      placeholder: '请输入对方职位'
    },
    {
      label: '联系电话',
      key: 'phone',
      type: 'input-phone',
      placeholder: '请输入联系电话'
    },
    {
      label: '拜访人',
      key: 'visitor',
      type: 'input-short',
      required: true,
      placeholder: '请输入拜访人姓名'
    },
    {
      label: '陪同人员',
      key: 'companions',
      type: 'input-short',
      placeholder: '请输入陪同人员'
    },
    {
      label: '拜访日期',
      key: 'visitDate',
      type: 'input-date',
      required: true
    },
    {
      label: '拜访时间',
      key: 'visitTime',
      type: 'input-short',
      placeholder: '请输入拜访时间（如：14:00-16:00）'
    },
    {
      label: '拜访地点',
      key: 'location',
      type: 'input-short',
      required: true,
      placeholder: '请输入拜访地点'
    },
    {
      label: '拜访目的',
      key: 'purpose',
      type: 'select-multiple',
      options: [
        { label: '商务洽谈', value: 'negotiation' },
        { label: '产品演示', value: 'demo' },
        { label: '需求调研', value: 'research' },
        { label: '售后服务', value: 'service' },
        { label: '关系维护', value: 'maintenance' }
      ]
    },
    {
      label: '拜访内容',
      key: 'content',
      type: 'input-long',
      required: true,
      placeholder: '请详细描述拜访内容'
    },
    {
      label: '客户需求',
      key: 'customerNeeds',
      type: 'input-long',
      placeholder: '请记录客户需求'
    },
    {
      label: '后续计划',
      key: 'followUp',
      type: 'input-long',
      placeholder: '请输入后续跟进计划'
    },
    {
      label: '备注',
      key: 'notes',
      type: 'input-long',
      placeholder: '其他备注信息'
    }
  ]
}

/**
 * 邀约管理模板
 */
export const invitationTemplate = {
  name: '邀约管理',
  description: '会议/活动邀约管理表',
  category: 'enterprise',
  schema: [
    {
      label: '邀约编号',
      key: 'invitationNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入邀约编号'
    },
    {
      label: '邀约主题',
      key: 'subject',
      type: 'input-short',
      required: true,
      placeholder: '请输入邀约主题'
    },
    {
      label: '邀约类型',
      key: 'type',
      type: 'select-single',
      required: true,
      options: [
        { label: '会议', value: 'meeting' },
        { label: '活动', value: 'event' },
        { label: '培训', value: 'training' },
        { label: '研讨会', value: 'seminar' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '发起人',
      key: 'initiator',
      type: 'input-short',
      required: true,
      placeholder: '请输入发起人姓名'
    },
    {
      label: '被邀约人',
      key: 'invitee',
      type: 'input-short',
      required: true,
      placeholder: '请输入被邀约人姓名'
    },
    {
      label: '联系电话',
      key: 'phone',
      type: 'input-phone',
      placeholder: '请输入联系电话'
    },
    {
      label: '邮箱',
      key: 'email',
      type: 'input-email',
      placeholder: '请输入邮箱地址'
    },
    {
      label: '邀约日期',
      key: 'invitationDate',
      type: 'input-date',
      required: true
    },
    {
      label: '活动日期',
      key: 'eventDate',
      type: 'input-date',
      required: true
    },
    {
      label: '活动时间',
      key: 'eventTime',
      type: 'input-short',
      placeholder: '请输入活动时间（如：14:00-16:00）'
    },
    {
      label: '活动地点',
      key: 'location',
      type: 'input-short',
      required: true,
      placeholder: '请输入活动地点'
    },
    {
      label: '邀约状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '待确认', value: 'pending' },
        { label: '已接受', value: 'accepted' },
        { label: '已拒绝', value: 'declined' },
        { label: '已取消', value: 'cancelled' }
      ]
    },
    {
      label: '邀约内容',
      key: 'content',
      type: 'input-long',
      placeholder: '请输入邀约详细内容'
    },
    {
      label: '回复内容',
      key: 'response',
      type: 'input-long',
      placeholder: '请输入被邀约人的回复'
    },
    {
      label: '备注',
      key: 'notes',
      type: 'input-long',
      placeholder: '其他备注信息'
    }
  ]
}

// 导出所有企业模板
export const enterpriseTemplates = [
  employeeTemplate,
  projectTemplate,
  productTemplate,
  contractTemplate,
  financeTemplate,
  serviceTicketTemplate,
  visitTemplate,
  invitationTemplate
]
