// 教育表单模板

/**
 * 作业模板
 */
export const homeworkTemplate = {
  name: '作业',
  description: '学生作业提交表',
  category: 'education',
  schema: [
    {
      label: '作业编号',
      key: 'homeworkNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入作业编号'
    },
    {
      label: '作业标题',
      key: 'title',
      type: 'input-short',
      required: true,
      placeholder: '请输入作业标题'
    },
    {
      label: '课程名称',
      key: 'courseName',
      type: 'input-short',
      required: true,
      placeholder: '请输入课程名称'
    },
    {
      label: '学生姓名',
      key: 'studentName',
      type: 'input-short',
      required: true,
      placeholder: '请输入学生姓名'
    },
    {
      label: '学号',
      key: 'studentId',
      type: 'input-short',
      required: true,
      placeholder: '请输入学号'
    },
    {
      label: '班级',
      key: 'className',
      type: 'input-short',
      required: true,
      placeholder: '请输入班级'
    },
    {
      label: '任课教师',
      key: 'teacherName',
      type: 'input-short',
      placeholder: '请输入任课教师姓名'
    },
    {
      label: '作业类型',
      key: 'homeworkType',
      type: 'select-single',
      required: true,
      options: [
        { label: '课后作业', value: 'regular' },
        { label: '实验报告', value: 'lab' },
        { label: '课程设计', value: 'design' },
        { label: '小组作业', value: 'group' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '提交日期',
      key: 'submitDate',
      type: 'input-date',
      required: true
    },
    {
      label: '截止日期',
      key: 'dueDate',
      type: 'input-date',
      required: true
    },
    {
      label: '作业内容',
      key: 'content',
      type: 'input-long',
      required: true,
      placeholder: '请输入作业内容'
    },
    {
      label: '作业要求',
      key: 'requirements',
      type: 'input-long',
      placeholder: '请输入作业要求'
    },
    {
      label: '提交状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '未提交', value: 'not_submitted' },
        { label: '已提交', value: 'submitted' },
        { label: '已批改', value: 'graded' },
        { label: '需修改', value: 'need_revision' }
      ]
    },
    {
      label: '成绩',
      key: 'score',
      type: 'input-number',
      placeholder: '请输入成绩'
    },
    {
      label: '教师评语',
      key: 'comments',
      type: 'input-long',
      placeholder: '请输入教师评语'
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
 * 信息填报模板
 */
export const informationFormTemplate = {
  name: '信息填报',
  description: '学生信息填报表',
  category: 'education',
  schema: [
    {
      label: '填报编号',
      key: 'formNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入填报编号'
    },
    {
      label: '填报类型',
      key: 'formType',
      type: 'select-single',
      required: true,
      options: [
        { label: '学生基本信息', value: 'basic_info' },
        { label: '家庭情况', value: 'family_info' },
        { label: '健康状况', value: 'health_info' },
        { label: '奖助学金申请', value: 'scholarship' },
        { label: '实习信息', value: 'internship' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '学生姓名',
      key: 'studentName',
      type: 'input-short',
      required: true,
      placeholder: '请输入学生姓名'
    },
    {
      label: '学号',
      key: 'studentId',
      type: 'input-short',
      required: true,
      placeholder: '请输入学号'
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
      label: '身份证号',
      key: 'idCard',
      type: 'input-short',
      placeholder: '请输入身份证号'
    },
    {
      label: '手机号',
      key: 'phone',
      type: 'input-phone',
      required: true,
      placeholder: '请输入手机号'
    },
    {
      label: '邮箱',
      key: 'email',
      type: 'input-email',
      placeholder: '请输入邮箱地址'
    },
    {
      label: '学院',
      key: 'college',
      type: 'input-short',
      required: true,
      placeholder: '请输入学院名称'
    },
    {
      label: '专业',
      key: 'major',
      type: 'input-short',
      required: true,
      placeholder: '请输入专业名称'
    },
    {
      label: '班级',
      key: 'className',
      type: 'input-short',
      required: true,
      placeholder: '请输入班级'
    },
    {
      label: '年级',
      key: 'grade',
      type: 'select-single',
      options: [
        { label: '大一', value: 'freshman' },
        { label: '大二', value: 'sophomore' },
        { label: '大三', value: 'junior' },
        { label: '大四', value: 'senior' },
        { label: '研一', value: 'graduate_1' },
        { label: '研二', value: 'graduate_2' },
        { label: '研三', value: 'graduate_3' }
      ]
    },
    {
      label: '家庭住址',
      key: 'address',
      type: 'input-long',
      placeholder: '请输入家庭住址'
    },
    {
      label: '家长姓名',
      key: 'parentName',
      type: 'input-short',
      placeholder: '请输入家长姓名'
    },
    {
      label: '家长联系电话',
      key: 'parentPhone',
      type: 'input-phone',
      placeholder: '请输入家长联系电话'
    },
    {
      label: '填报内容',
      key: 'content',
      type: 'input-long',
      required: true,
      placeholder: '请输入填报内容'
    },
    {
      label: '填报日期',
      key: 'submitDate',
      type: 'input-date',
      required: true
    },
    {
      label: '审核状态',
      key: 'status',
      type: 'select-single',
      options: [
        { label: '待审核', value: 'pending' },
        { label: '已通过', value: 'approved' },
        { label: '已驳回', value: 'rejected' }
      ]
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
 * 论文模板
 */
export const thesisTemplate = {
  name: '论文',
  description: '学术论文信息登记表',
  category: 'education',
  schema: [
    {
      label: '论文编号',
      key: 'thesisNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入论文编号'
    },
    {
      label: '论文标题',
      key: 'title',
      type: 'input-short',
      required: true,
      placeholder: '请输入论文标题'
    },
    {
      label: '论文类型',
      key: 'thesisType',
      type: 'select-single',
      required: true,
      options: [
        { label: '学士论文', value: 'bachelor' },
        { label: '硕士论文', value: 'master' },
        { label: '博士论文', value: 'phd' },
        { label: '期刊论文', value: 'journal' },
        { label: '会议论文', value: 'conference' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      label: '作者姓名',
      key: 'authorName',
      type: 'input-short',
      required: true,
      placeholder: '请输入作者姓名'
    },
    {
      label: '学号/工号',
      key: 'authorId',
      type: 'input-short',
      required: true,
      placeholder: '请输入学号或工号'
    },
    {
      label: '学院/单位',
      key: 'organization',
      type: 'input-short',
      required: true,
      placeholder: '请输入学院或单位名称'
    },
    {
      label: '专业/方向',
      key: 'major',
      type: 'input-short',
      required: true,
      placeholder: '请输入专业或研究方向'
    },
    {
      label: '指导教师',
      key: 'advisor',
      type: 'input-short',
      required: true,
      placeholder: '请输入指导教师姓名'
    },
    {
      label: '合作作者',
      key: 'coAuthors',
      type: 'input-short',
      placeholder: '请输入合作作者（多人用逗号分隔）'
    },
    {
      label: '研究领域',
      key: 'field',
      type: 'input-short',
      placeholder: '请输入研究领域'
    },
    {
      label: '关键词',
      key: 'keywords',
      type: 'input-short',
      placeholder: '请输入关键词（用逗号分隔）'
    },
    {
      label: '摘要',
      key: 'abstract',
      type: 'input-long',
      required: true,
      placeholder: '请输入论文摘要'
    },
    {
      label: '提交日期',
      key: 'submitDate',
      type: 'input-date',
      required: true
    },
    {
      label: '答辩日期',
      key: 'defenseDate',
      type: 'input-date',
      placeholder: '请输入答辩日期（如适用）'
    },
    {
      label: '发表日期',
      key: 'publishDate',
      type: 'input-date',
      placeholder: '请输入发表日期（如适用）'
    },
    {
      label: '发表刊物/会议',
      key: 'publication',
      type: 'input-short',
      placeholder: '请输入发表刊物或会议名称'
    },
    {
      label: '论文状态',
      key: 'status',
      type: 'select-single',
      required: true,
      options: [
        { label: '撰写中', value: 'writing' },
        { label: '待审核', value: 'pending_review' },
        { label: '审核中', value: 'under_review' },
        { label: '需修改', value: 'need_revision' },
        { label: '已通过', value: 'approved' },
        { label: '已发表', value: 'published' }
      ]
    },
    {
      label: '评审意见',
      key: 'reviewComments',
      type: 'input-long',
      placeholder: '请输入评审意见'
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
 * 考试成绩模板
 */
export const examTemplate = {
  name: '考试成绩',
  description: '考试成绩登记表',
  category: 'education',
  schema: [
    {
      label: '考试编号',
      key: 'examNo',
      type: 'input-short',
      required: true,
      placeholder: '请输入考试编号'
    },
    {
      label: '考试名称',
      key: 'examName',
      type: 'input-short',
      required: true,
      placeholder: '请输入考试名称'
    },
    {
      label: '课程名称',
      key: 'courseName',
      type: 'input-short',
      required: true,
      placeholder: '请输入课程名称'
    },
    {
      label: '学生姓名',
      key: 'studentName',
      type: 'input-short',
      required: true,
      placeholder: '请输入学生姓名'
    },
    {
      label: '学号',
      key: 'studentId',
      type: 'input-short',
      required: true,
      placeholder: '请输入学号'
    },
    {
      label: '班级',
      key: 'className',
      type: 'input-short',
      required: true,
      placeholder: '请输入班级'
    },
    {
      label: '考试类型',
      key: 'examType',
      type: 'select-single',
      required: true,
      options: [
        { label: '期中考试', value: 'midterm' },
        { label: '期末考试', value: 'final' },
        { label: '随堂测验', value: 'quiz' },
        { label: '补考', value: 'makeup' },
        { label: '重修', value: 'retake' }
      ]
    },
    {
      label: '考试日期',
      key: 'examDate',
      type: 'input-date',
      required: true
    },
    {
      label: '成绩',
      key: 'score',
      type: 'input-number',
      required: true,
      placeholder: '请输入成绩'
    },
    {
      label: '满分',
      key: 'totalScore',
      type: 'input-number',
      placeholder: '请输入满分（默认100）'
    },
    {
      label: '等级',
      key: 'grade',
      type: 'select-single',
      options: [
        { label: '优秀', value: 'excellent' },
        { label: '良好', value: 'good' },
        { label: '中等', value: 'average' },
        { label: '及格', value: 'pass' },
        { label: '不及格', value: 'fail' }
      ]
    },
    {
      label: '任课教师',
      key: 'teacherName',
      type: 'input-short',
      placeholder: '请输入任课教师姓名'
    },
    {
      label: '备注',
      key: 'notes',
      type: 'input-long',
      placeholder: '其他备注信息'
    }
  ]
}

// 导出所有教育模板
export const educationTemplates = [
  homeworkTemplate,
  informationFormTemplate,
  thesisTemplate,
  examTemplate
]
