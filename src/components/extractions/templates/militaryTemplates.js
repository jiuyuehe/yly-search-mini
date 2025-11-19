// 军工表单模板

/**
 * 情报抽取模板
 */
export const intelligenceTemplate = {
  name: '情报抽取',
  description: '情报信息抽取和分析表',
  category: 'military',
  schema: [
    {
      label: '情报编号',
      key: 'intelligenceNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入情报编号'
    },
    {
      label: '情报标题',
      key: 'title',
      type: 'input-short',
      required: true,
      placeholder: '请输入情报标题'
    },
    {
      label: '情报类型',
      key: 'intelligenceType',
      type: 'select-single',
      required: true,
      options: [
        { label: '战略情报', value: 'strategic' },
        { label: '战术情报', value: 'tactical' },
        { label: '技术情报', value: 'technical' },
        { label: '经济情报', value: 'economic' },
        { label: '政治情报', value: 'political' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '机密等级',
      key: 'classificationLevel',
      type: 'select-single',
      required: true,
      options: [
        { label: '绝密', value: 'top_secret' },
        { label: '机密', value: 'secret' },
        { label: '秘密', value: 'confidential' },
        { label: '内部', value: 'internal' },
        { label: '公开', value: 'public' }
      ]
    },
    {
      label: '来源',
      key: 'source',
      type: 'input-short',
      required: true,
      placeholder: '请输入情报来源'
    },
    {
      label: '来源可靠性',
      key: 'sourceReliability',
      type: 'select-single',
      options: [
        { label: 'A级（完全可靠）', value: 'A' },
        { label: 'B级（通常可靠）', value: 'B' },
        { label: 'C级（尚可靠）', value: 'C' },
        { label: 'D级（通常不可靠）', value: 'D' },
        { label: 'E级（不可靠）', value: 'E' },
        { label: 'F级（无法判定）', value: 'F' }
      ]
    },
    {
      label: '信息准确性',
      key: 'accuracy',
      type: 'select-single',
      options: [
        { label: '1级（已证实）', value: '1' },
        { label: '2级（可能为真）', value: '2' },
        { label: '3级（可能不真）', value: '3' },
        { label: '4级（真实性可疑）', value: '4' },
        { label: '5级（不太可能）', value: '5' },
        { label: '6级（无法判定）', value: '6' }
      ]
    },
    {
      label: '获取时间',
      key: 'acquisitionTime',
      type: 'input-datetime',
      required: true
    },
    {
      label: '报告时间',
      key: 'reportTime',
      type: 'input-datetime',
      required: true
    },
    {
      label: '地理位置',
      key: 'location',
      type: 'input-short',
      placeholder: '请输入地理位置'
    },
    {
      label: '相关目标',
      key: 'targets',
      type: 'input-short',
      placeholder: '请输入相关目标'
    },
    {
      label: '关键实体',
      key: 'keyEntities',
      type: 'input-short',
      placeholder: '请输入关键实体（多个用逗号分隔）'
    },
    {
      label: '关键词',
      key: 'keywords',
      type: 'input-short',
      placeholder: '请输入关键词（用逗号分隔）'
    },
    {
      label: '情报内容',
      key: 'content',
      type: 'input-long',
      required: true,
      placeholder: '请输入情报详细内容'
    },
    {
      label: '分析评估',
      key: 'analysis',
      type: 'input-long',
      placeholder: '请输入分析评估'
    },
    {
      label: '建议措施',
      key: 'recommendations',
      type: 'input-long',
      placeholder: '请输入建议措施'
    },
    {
      label: '处理状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '待处理', value: 'pending' },
        { label: '处理中', value: 'processing' },
        { label: '已分析', value: 'analyzed' },
        { label: '已验证', value: 'verified' },
        { label: '已归档', value: 'archived' }
      ]
    },
    {
      label: '处理人',
      key: 'handler',
      type: 'input-short',
      placeholder: '请输入处理人姓名'
    },
    {
      label: '审核人',
      key: 'reviewer',
      type: 'input-short',
      placeholder: '请输入审核人姓名'
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
 * 网络分析模板
 */
export const networkAnalysisTemplate = {
  name: '网络分析',
  description: '网络安全分析和监控表',
  category: 'military',
  schema: [
    {
      label: '分析编号',
      key: 'analysisNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入分析编号'
    },
    {
      label: '分析标题',
      key: 'title',
      type: 'input-short',
      required: true,
      placeholder: '请输入分析标题'
    },
    {
      label: '分析类型',
      key: 'analysisType',
      type: 'select-single',
      required: true,
      options: [
        { label: '流量分析', value: 'traffic' },
        { label: '入侵检测', value: 'intrusion' },
        { label: '漏洞扫描', value: 'vulnerability' },
        { label: '威胁情报', value: 'threat' },
        { label: '日志分析', value: 'log' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '威胁等级',
      key: 'threatLevel',
      type: 'select-single',
      required: true,
      options: [
        { label: '严重', value: 'critical' },
        { label: '高', value: 'high' },
        { label: '中', value: 'medium' },
        { label: '低', value: 'low' },
        { label: '信息', value: 'info' }
      ]
    },
    {
      label: '源IP地址',
      key: 'sourceIP',
      type: 'input-ip',
      placeholder: '请输入源IP地址'
    },
    {
      label: '目标IP地址',
      key: 'targetIP',
      type: 'input-ip',
      placeholder: '请输入目标IP地址'
    },
    {
      label: '端口',
      key: 'port',
      type: 'input-number',
      placeholder: '请输入端口号'
    },
    {
      label: '协议类型',
      key: 'protocol',
      type: 'select-single',
      options: [
        { label: 'TCP', value: 'tcp' },
        { label: 'UDP', value: 'udp' },
        { label: 'HTTP', value: 'http' },
        { label: 'HTTPS', value: 'https' },
        { label: 'FTP', value: 'ftp' },
        { label: 'SSH', value: 'ssh' },
        { label: 'DNS', value: 'dns' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '攻击类型',
      key: 'attackType',
      type: 'select-multiple',
      options: [
        { label: 'DDoS攻击', value: 'ddos' },
        { label: 'SQL注入', value: 'sql_injection' },
        { label: 'XSS攻击', value: 'xss' },
        { label: '木马病毒', value: 'trojan' },
        { label: '钓鱼攻击', value: 'phishing' },
        { label: '暴力破解', value: 'brute_force' },
        { label: '零日漏洞', value: 'zero_day' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '发现时间',
      key: 'discoveryTime',
      type: 'input-datetime',
      required: true
    },
    {
      label: '开始时间',
      key: 'startTime',
      type: 'input-datetime',
      placeholder: '请输入事件开始时间'
    },
    {
      label: '结束时间',
      key: 'endTime',
      type: 'input-datetime',
      placeholder: '请输入事件结束时间'
    },
    {
      label: '受影响资产',
      key: 'affectedAssets',
      type: 'input-short',
      placeholder: '请输入受影响的资产'
    },
    {
      label: '数据包数量',
      key: 'packetCount',
      type: 'input-number',
      placeholder: '请输入数据包数量'
    },
    {
      label: '流量大小（MB）',
      key: 'trafficSize',
      type: 'input-number',
      placeholder: '请输入流量大小'
    },
    {
      label: '事件描述',
      key: 'description',
      type: 'input-long',
      required: true,
      placeholder: '请输入事件详细描述'
    },
    {
      label: '技术细节',
      key: 'technicalDetails',
      type: 'input-long',
      placeholder: '请输入技术细节'
    },
    {
      label: '影响分析',
      key: 'impactAnalysis',
      type: 'input-long',
      placeholder: '请输入影响分析'
    },
    {
      label: '处置措施',
      key: 'remediation',
      type: 'input-long',
      placeholder: '请输入处置措施'
    },
    {
      label: '处理状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '新发现', value: 'new' },
        { label: '分析中', value: 'analyzing' },
        { label: '处置中', value: 'remediating' },
        { label: '已解决', value: 'resolved' },
        { label: '已关闭', value: 'closed' }
      ]
    },
    {
      label: '分析人员',
      key: 'analyst',
      type: 'input-short',
      placeholder: '请输入分析人员姓名'
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
 * 信息速递源模板
 */
export const informationSourceTemplate = {
  name: '信息速递源',
  description: '信息来源和速递管理表',
  category: 'military',
  schema: [
    {
      label: '信息编号',
      key: 'infoNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入信息编号'
    },
    {
      label: '信息标题',
      key: 'title',
      type: 'input-short',
      required: true,
      placeholder: '请输入信息标题'
    },
    {
      label: '信息类别',
      key: 'category',
      type: 'select-single',
      required: true,
      options: [
        { label: '军事动态', value: 'military' },
        { label: '技术情报', value: 'technical' },
        { label: '装备信息', value: 'equipment' },
        { label: '人员动向', value: 'personnel' },
        { label: '战略分析', value: 'strategic' },
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
        { label: '重要', value: 'important' },
        { label: '一般', value: 'normal' },
        { label: '低', value: 'low' }
      ]
    },
    {
      label: '信息来源',
      key: 'source',
      type: 'input-short',
      required: true,
      placeholder: '请输入信息来源'
    },
    {
      label: '来源类型',
      key: 'sourceType',
      type: 'select-single',
      options: [
        { label: '公开来源', value: 'open_source' },
        { label: '内部渠道', value: 'internal' },
        { label: '合作机构', value: 'partner' },
        { label: '技术侦察', value: 'technical' },
        { label: '人工情报', value: 'human' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '可信度',
      key: 'credibility',
      type: 'select-single',
      required: true,
      options: [
        { label: '高', value: 'high' },
        { label: '中', value: 'medium' },
        { label: '低', value: 'low' },
        { label: '未知', value: 'unknown' }
      ]
    },
    {
      label: '获取时间',
      key: 'acquisitionTime',
      type: 'input-datetime',
      required: true
    },
    {
      label: '发布时间',
      key: 'publishTime',
      type: 'input-datetime',
      required: true
    },
    {
      label: '时效性',
      key: 'timeliness',
      type: 'select-single',
      options: [
        { label: '实时', value: 'realtime' },
        { label: '当天', value: 'today' },
        { label: '近期', value: 'recent' },
        { label: '历史', value: 'historical' }
      ]
    },
    {
      label: '地区',
      key: 'region',
      type: 'input-short',
      placeholder: '请输入相关地区'
    },
    {
      label: '关键词',
      key: 'keywords',
      type: 'input-short',
      placeholder: '请输入关键词（用逗号分隔）'
    },
    {
      label: '关联事件',
      key: 'relatedEvents',
      type: 'input-short',
      placeholder: '请输入关联事件'
    },
    {
      label: '信息摘要',
      key: 'summary',
      type: 'input-long',
      required: true,
      placeholder: '请输入信息摘要'
    },
    {
      label: '详细内容',
      key: 'content',
      type: 'input-long',
      required: true,
      placeholder: '请输入详细内容'
    },
    {
      label: '价值评估',
      key: 'valueAssessment',
      type: 'input-long',
      placeholder: '请输入价值评估'
    },
    {
      label: '分发范围',
      key: 'distribution',
      type: 'select-multiple',
      options: [
        { label: '指挥部', value: 'command' },
        { label: '作战部门', value: 'operations' },
        { label: '情报部门', value: 'intelligence' },
        { label: '技术部门', value: 'technical' },
        { label: '后勤部门', value: 'logistics' }
      ]
    },
    {
      label: '处理状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '待审核', value: 'pending' },
        { label: '已审核', value: 'reviewed' },
        { label: '已分发', value: 'distributed' },
        { label: '已归档', value: 'archived' }
      ]
    },
    {
      label: '审核人',
      key: 'reviewer',
      type: 'input-short',
      placeholder: '请输入审核人姓名'
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
 * 装备档案模板
 */
export const equipmentTemplate = {
  name: '装备档案',
  description: '军工装备信息管理表',
  category: 'military',
  schema: [
    {
      label: '装备编号',
      key: 'equipmentNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入装备编号'
    },
    {
      label: '装备名称',
      key: 'name',
      type: 'input-short',
      required: true,
      placeholder: '请输入装备名称'
    },
    {
      label: '装备类型',
      key: 'type',
      type: 'select-single',
      required: true,
      options: [
        { label: '武器系统', value: 'weapon' },
        { label: '通信装备', value: 'communication' },
        { label: '侦察设备', value: 'reconnaissance' },
        { label: '防护装备', value: 'protection' },
        { label: '后勤装备', value: 'logistics' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '型号',
      key: 'model',
      type: 'input-short',
      placeholder: '请输入装备型号'
    },
    {
      label: '生产厂家',
      key: 'manufacturer',
      type: 'input-short',
      placeholder: '请输入生产厂家'
    },
    {
      label: '生产日期',
      key: 'productionDate',
      type: 'input-date',
      placeholder: '请输入生产日期'
    },
    {
      label: '配发日期',
      key: 'issueDate',
      type: 'input-date',
      required: true
    },
    {
      label: '所属单位',
      key: 'unit',
      type: 'input-short',
      required: true,
      placeholder: '请输入所属单位'
    },
    {
      label: '保管人',
      key: 'custodian',
      type: 'input-short',
      placeholder: '请输入保管人姓名'
    },
    {
      label: '装备状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '完好', value: 'good' },
        { label: '一般', value: 'fair' },
        { label: '损坏', value: 'damaged' },
        { label: '维修中', value: 'under_repair' },
        { label: '报废', value: 'scrapped' }
      ]
    },
    {
      label: '技术参数',
      key: 'specifications',
      type: 'input-long',
      placeholder: '请输入技术参数'
    },
    {
      label: '性能指标',
      key: 'performance',
      type: 'input-long',
      placeholder: '请输入性能指标'
    },
    {
      label: '维护记录',
      key: 'maintenanceLog',
      type: 'input-long',
      placeholder: '请输入维护记录'
    },
    {
      label: '备注',
      key: 'notes',
      type: 'input-long',
      placeholder: '其他备注信息'
    }
  ]
}

// 导出所有军工模板
export const militaryTemplates = [
  intelligenceTemplate,
  networkAnalysisTemplate,
  informationSourceTemplate,
  equipmentTemplate
]
