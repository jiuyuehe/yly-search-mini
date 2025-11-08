# Spec: AI Visual Design

## ADDED Requirements

### Requirement: AI图标按钮应使用渐变色突出智能化特性
**Rationale**: 与常规蓝色搜索按钮区分,通过紫-蓝-粉渐变色系营造科技感,提升AI功能的视觉吸引力和品牌识别度。

#### Scenario: AI按钮默认状态应用三色渐变背景
**Given** AI按钮处于可用状态  
**When** 渲染按钮样式  
**Then** 背景应为线性渐变(`linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)`)
**And** 边框应为 `none`
**And** 文字/图标颜色应为白色(`color: white`)
**And** 应有投影效果(`box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4)`)

#### Scenario: AI按钮悬停时渐变方向反转并加深阴影
**Given** AI按钮可用  
**When** 用户悬停鼠标  
**Then** 背景渐变应反转(`linear-gradient(135deg, #764ba2 0%, #667eea 50%, #f093fb 100%)`)
**And** 按钮应向上移动2px(`transform: translateY(-2px)`)
**And** 阴影应加深(`box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6)`)
**And** 过渡动画应为300ms缓动(`transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`)

#### Scenario: AI按钮点击时应有下压动画
**Given** 用户鼠标按下AI按钮  
**When** `:active` 伪类触发  
**Then** 按钮应恢复原位(`transform: translateY(0)`)
**And** 阴影应恢复到默认状态

#### Scenario: AI按钮禁用时应显示灰度样式
**Given** 输入框为空,AI按钮禁用  
**When** 渲染按钮  
**Then** 背景应为灰色(`background: #e0e0e0`)
**And** 阴影应移除(`box-shadow: none`)
**And** 不透明度应降低(`opacity: 0.6`)
**And** 不应有悬停效果

### Requirement: QA面板应使用渐变边框和半透明背景强化AI属性
**Rationale**: 通过视觉设计将QA面板与普通搜索结果区分,传递"智能助手"的概念。

#### Scenario: QA面板应用2px渐变边框
**Given** QA面板可见  
**When** 渲染面板容器  
**Then** 应通过 `::before` 伪元素创建渐变边框
**And** 渐变色应为 `linear-gradient(135deg, #667eea, #764ba2, #f093fb)`
**And** 边框宽度应为2px
**And** 圆角应为12px(`border-radius: 12px`)
**And** 使用 `-webkit-mask-composite: xor` 实现边框效果

#### Scenario: QA面板头部应用半透明渐变背景
**Given** QA面板头部渲染  
**When** 应用样式  
**Then** 背景应为半透明渐变:
```css
background: linear-gradient(
  135deg,
  rgba(102, 126, 234, 0.05),
  rgba(240, 147, 251, 0.05)
);
```
**And** 内容区背景应为纯白(`background: white`)

#### Scenario: QA面板AI图标应使用渐变色
**Given** QA面板头部包含AI图标(MagicStick)  
**When** 渲染图标  
**Then** 图标颜色应为 `#667eea`(渐变主色)
**And** 图标尺寸应为20px

### Requirement: 图片搜索图标应使用标准样式与AI按钮区分
**Rationale**: 图片搜索为常规功能,应使用中性色彩,避免与炫彩AI按钮视觉冲突。

#### Scenario: 图片图标按钮使用灰蓝色调
**Given** 图片图标按钮渲染  
**When** 应用默认样式  
**Then** 背景应为半透明灰色(`background: rgba(0, 0, 0, 0.04)`)
**And** 图标颜色应为深灰(`color: #606266`)
**And** 边框应为细线(`border: 1px solid #dcdfe6`)

#### Scenario: 图片图标悬停时变为主题蓝色
**Given** 用户悬停图片图标  
**When** `:hover` 触发  
**Then** 背景应变为浅蓝(`background: rgba(64, 158, 255, 0.1)`)
**And** 图标颜色应变为主题蓝(`color: #409EFF`)
**And** 边框颜色应变为主题蓝(`border-color: #409EFF`)

### Requirement: 炫彩样式应支持暗色模式适配
**Rationale**: 用户可能启用暗色主题,需确保AI渐变色在深色背景下依然清晰可辨。

#### Scenario: 暗色模式下AI按钮降低亮度
**Given** 系统处于暗色模式(`prefers-color-scheme: dark`)  
**When** 渲染AI按钮  
**Then** 渐变色应调整为深色版本:
```css
background: linear-gradient(
  135deg,
  #5568d3 0%,  /* 降低10%亮度 */
  #653a8b 50%,
  #d97ae3 100%
);
```
**And** 阴影颜色应调整为深色兼容

#### Scenario: 暗色模式下QA面板边框增加对比度
**Given** 系统处于暗色模式  
**When** 渲染QA面板  
**Then** 渐变边框应保持原色
**And** 面板背景应为深灰(`background: #1e1e1e`)
**And** 文字颜色应为浅色(`color: #e0e0e0`)

## MODIFIED Requirements

### Requirement: 搜索按钮保持标准主题蓝色
**Rationale**: 主搜索按钮为核心操作,应使用品牌主色(蓝色),不与AI渐变色混淆。

#### Scenario: 搜索按钮使用Element Plus primary样式
**Given** 搜索按钮渲染  
**When** 应用 `type="primary"` 样式  
**Then** 背景应为主题蓝渐变(`linear-gradient(135deg, #409EFF, #3a8ee6)`)
**And** 不应使用AI的紫-粉渐变
**And** 保持现有悬停/点击交互效果

---

## Design Tokens

### AI渐变色定义
```scss
// 主渐变(浅色模式)
$ai-gradient-light: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);

// 悬停渐变(反转)
$ai-gradient-hover: linear-gradient(135deg, #764ba2 0%, #667eea 50%, #f093fb 100%);

// 暗色模式渐变
$ai-gradient-dark: linear-gradient(135deg, #5568d3 0%, #653a8b 50%, #d97ae3 100%);

// 阴影色
$ai-shadow-light: rgba(102, 126, 234, 0.4);
$ai-shadow-hover: rgba(102, 126, 234, 0.6);
```

### 边框渐变定义
```scss
$ai-border-gradient: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
```

---

## Cross-References
- **Related to**: [search-box-ui/spec.md](../search-box-ui/spec.md) - AI按钮在SearchBox中的布局位置
- **Related to**: [inline-qa-panel/spec.md](../inline-qa-panel/spec.md) - QA面板应用相同渐变色系
