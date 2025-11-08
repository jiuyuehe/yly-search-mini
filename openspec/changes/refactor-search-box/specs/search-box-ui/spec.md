# Spec: SearchBox UI Refactor

## MODIFIED Requirements

### Requirement: SearchBox组件应提供简化的搜索输入界面
**Rationale**: 当前搜索框包含过多控件(搜索类型下拉、模式下拉、上传按钮),用户认知负担重。简化后用户可专注于输入搜索内容,次要操作通过图标化按钮提供。

#### Scenario: 用户查看搜索框布局
**Given** 用户打开搜索页面  
**When** 搜索框渲染完成  
**Then** 应仅包含以下元素:
- 文本输入框(textarea, 2-3行)
- 图片搜索图标按钮(Picture icon, circle)
- AI问答图标按钮(MagicStick icon, circle, 渐变色)
- 搜索按钮(primary, 蓝色)
**And** 不应显示搜索类型下拉选择器
**And** 不应显示文本模式下拉选择器

#### Scenario: 用户按回车键触发搜索
**Given** 用户在搜索框输入"年度报告"  
**When** 用户按下Enter键(非Shift+Enter)  
**Then** 应触发全文搜索(`emit('search', '年度报告', 'fullText', null, {precisionMode})`)
**And** 不应换行

### Requirement: 图片搜索应通过图标按钮触发
**Rationale**: 将图片上传按钮改为图标,减少文字描述占用的空间,提升视觉清晰度。

#### Scenario: 用户点击图片图标选择文件
**Given** 用户未选择图片  
**When** 用户点击图片搜索图标按钮  
**Then** 应唤起系统文件选择器
**And** 文件类型限制为 `accept="image/*"`

#### Scenario: 用户选择图片后显示预览
**Given** 用户通过图标按钮选择了 `logo.png`  
**When** 文件选择完成  
**Then** 应在输入框下方显示图片预览chip
**And** chip应包含缩略图、文件名、文件大小、删除图标
**And** chip应使用 `slide-down` 过渡动画

#### Scenario: 用户点击搜索按钮执行图片搜索
**Given** 用户已选择图片文件 `logo.png`  
**And** 输入框内容为空或有关键词  
**When** 用户点击搜索按钮  
**Then** 应触发图片搜索(`emit('search', query, 'image', fileObject, opts)`)

### Requirement: AI问答应通过独立图标按钮触发
**Rationale**: 新增AI问答入口,但不占用搜索类型下拉位置,通过炫彩图标吸引用户注意并与常规搜索区分。

#### Scenario: AI按钮仅在有输入时可点击
**Given** 输入框内容为空  
**When** 渲染AI图标按钮  
**Then** 按钮应处于禁用状态(`disabled`)
**And** 按钮应显示灰度样式

**Given** 输入框内容为"如何使用系统?"  
**When** 渲染AI图标按钮  
**Then** 按钮应处于可用状态
**And** 按钮应显示渐变色样式

#### Scenario: 用户点击AI图标触发问答请求
**Given** 输入框内容为"RAG是什么?"  
**When** 用户点击AI问答图标按钮  
**Then** 应发射 `qa-request` 事件(`emit('qa-request', 'RAG是什么?')`)
**And** 不应触发搜索事件

## ADDED Requirements

### Requirement: SearchBox应支持通过props初始化查询文本
**Rationale**: 支持从URL参数或其他来源恢复搜索状态。

#### Scenario: 通过initialQuery prop设置默认文本
**Given** SearchBox接收 `initialQuery="测试文档"` prop  
**When** 组件挂载  
**Then** 输入框应显示"测试文档"

### Requirement: SearchBox应对外暴露清晰的事件接口
**Rationale**: 父组件需要区分全文搜索、图片搜索、AI问答三种操作。

#### Scenario: 发射search事件携带完整参数
**Given** 用户输入"报告"并点击搜索按钮  
**When** 无图片文件  
**Then** 应发射 `search` 事件,参数为:
```typescript
{
  query: "报告",
  searchType: "fullText",
  imageFile: null,
  options: { precisionMode: 3 } // 从store读取
}
```

**Given** 用户选择图片 `image.jpg` 并点击搜索  
**Then** 应发射 `search` 事件,参数为:
```typescript
{
  query: "", // 可能为空
  searchType: "image",
  imageFile: File对象,
  options: { precisionMode: 3 }
}
```

#### Scenario: 发射qa-request事件仅携带问题文本
**Given** 输入框内容为"总结这个文档"  
**When** 用户点击AI图标  
**Then** 应发射 `qa-request` 事件,参数为 `"总结这个文档"`

## REMOVED Requirements

### ~~Requirement: SearchBox应提供搜索类型下拉选择器~~
**Rationale**: 移除搜索类型下拉,默认回车触发全文搜索,图片/AI通过图标按钮区分,简化用户操作路径。

### ~~Requirement: SearchBox应提供文本搜索模式下拉选择器~~
**Rationale**: 模式选择器移至FilterSidebar,与其他筛选条件统一管理,释放搜索框空间。

### ~~Requirement: 图片搜索应显示文字上传按钮~~
**Rationale**: 文字按钮改为图标,视觉更简洁,语义同样清晰(配合tooltip)。

### ~~Requirement: 搜索类型切换应触发mode-change事件~~
**Rationale**: 移除搜索类型下拉后,不再需要此事件。QA模式通过 `qa-request` 事件独立处理,不切换整体UI模式。
