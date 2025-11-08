# Spec: Inline QA Panel

## ADDED Requirements

### Requirement: 应提供InlineQAPanel组件用于就近展示AI问答结果
**Rationale**: 当前问答模式切换到独立视图,丢失搜索上下文。内联问答面板允许用户在搜索页面直接查看AI回答,无需离开当前页面。

#### Scenario: QA面板初始状态为隐藏
**Given** 用户未点击AI图标  
**When** SearchView渲染  
**Then** InlineQAPanel应不可见(`visible=false`)

#### Scenario: 点击AI图标后显示QA面板
**Given** 用户在搜索框输入"什么是RAG?"  
**When** 用户点击AI图标按钮  
**Then** SearchView应设置 `qaQuestion="什么是RAG?"` 并设置 `showQAPanel=true`
**And** InlineQAPanel应可见并开始加载问答内容

#### Scenario: QA面板位于搜索框与结果列表之间
**Given** QA面板已显示  
**When** 页面布局渲染  
**Then** QA面板应位于SearchBox下方、搜索结果列表上方
**And** QA面板高度应固定或可折叠,不遮挡搜索结果

### Requirement: InlineQAPanel应复用FileChatPanel组件实现问答功能
**Rationale**: FileChatPanel已实现流式问答、消息列表等功能,无需重复开发。

#### Scenario: 传递正确的问答API配置
**Given** InlineQAPanel接收 `question="解释一下Vue3"` prop  
**When** 组件挂载  
**Then** 应传递以下props给FileChatPanel:
```typescript
{
  fileId: "",
  esId: "",
  url: "/admin-api/rag/ai/text/general-chat/stream",
  defaultUseContext: false,
  sessionchat: false,
  showReturn: false,
  chatType: "general",
  initialQuestion: "解释一下Vue3"
}
```

#### Scenario: 流式响应逐字显示答案
**Given** 用户问题为"RAG的优势是什么?"  
**When** 后端通过SSE返回答案流  
**Then** FileChatPanel应逐字/逐句显示答案内容
**And** 用户应看到类似打字机的效果

### Requirement: InlineQAPanel应支持折叠/展开/关闭操作
**Rationale**: 长答案可能占用大量空间,用户需要控制面板状态以查看下方搜索结果。

#### Scenario: 用户点击收起按钮折叠内容区
**Given** QA面板处于展开状态  
**When** 用户点击"收起"按钮  
**Then** 内容区应隐藏(`v-show="!collapsed"`)
**And** 仅显示头部(问题标题+操作按钮)
**And** 按钮文字应变为"展开"

#### Scenario: 用户点击展开按钮恢复内容区
**Given** QA面板处于折叠状态  
**When** 用户点击"展开"按钮  
**Then** 内容区应显示
**And** 按钮文字应变为"收起"

#### Scenario: 用户点击关闭按钮隐藏面板
**Given** QA面板可见  
**When** 用户点击关闭图标(×)  
**Then** 应发射 `close` 事件(`emit('close')`)
**And** SearchView应设置 `showQAPanel=false`

### Requirement: InlineQAPanel应使用渐变边框和炫彩样式突出AI属性
**Rationale**: 与常规搜索结果区分,强化AI功能的科技感和吸引力。

#### Scenario: 面板边框应用渐变色
**Given** QA面板可见  
**When** 渲染面板样式  
**Then** 应应用2px渐变边框(紫-蓝-粉渐变: `#667eea → #764ba2 → #f093fb`)
**And** 使用 `::before` 伪元素+mask实现边框渐变

#### Scenario: 头部背景应用半透明渐变
**Given** QA面板头部渲染  
**When** 应用样式  
**Then** 头部背景应为半透明渐变(`linear-gradient(135deg, rgba(102,126,234,0.05), rgba(240,147,251,0.05))`)
**And** AI图标应使用渐变色(`#667eea`)

#### Scenario: 展开/折叠应有平滑过渡动画
**Given** 用户点击收起/展开按钮  
**When** 内容区显示/隐藏  
**Then** 应应用 `expand` transition(高度+透明度变化)
**And** 动画时长应为300ms

## MODIFIED Requirements

### Requirement: 问答功能不应切换SearchView的uiMode
**Rationale**: 原设计中 `searchType='qa'` 会切换 `uiMode='qa'` 并隐藏搜索结果。新设计中问答与搜索结果共存,不切换模式。

#### Scenario: 触发AI问答后SearchView保持搜索模式
**Given** SearchView当前 `uiMode='search'` 且已有搜索结果  
**When** 用户点击AI图标触发问答  
**Then** `uiMode` 应保持为 `'search'`
**And** 搜索结果列表应继续可见
**And** QA面板应在结果列表上方展示

## REMOVED Requirements

### ~~Requirement: 问答模式应占据整个内容区域~~
**Rationale**: 原设计中 `uiMode='qa'` 时隐藏搜索结果,切换为FileChatPanel全屏显示。新设计中问答为内联面板,不独占页面。

### ~~Requirement: 问答模式需要返回按钮切换回搜索~~
**Rationale**: 内联面板通过关闭按钮即可隐藏,无需返回按钮。
