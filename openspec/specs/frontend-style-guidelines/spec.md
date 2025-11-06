# frontend-style-guidelines Specification

## Purpose
TBD - created by archiving change standardize-style-tokens. Update Purpose after archive.
## Requirements
### Requirement: 使用设计令牌编写组件样式
所有前端组件在设置颜色、排版、间距与边框时，必须（MUST）引用定义在 `src/styles/variables.css` 的 CSS 自定义属性。

#### Scenario: Vue SFC 样式块
- **WHEN** 开发者在 Vue 单文件组件中新增或修改 `<style>` 区块
- **THEN** `color`、`background`、`font-size`、`border`、`box-shadow` 等声明必须改为引用 CSS 变量（如 `var(--primary-color)`），而非硬编码字面量。

#### Scenario: 模板内联样式
- **WHEN** 模板确实需要使用 `style` 内联样式
- **THEN** 该属性必须引用已有 CSS 变量或封装好的工具类，禁止直接引入新的字面量颜色或尺寸。

### Requirement: 维护令牌唯一来源
项目必须（MUST）以 `src/styles/variables.css` 作为设计令牌的唯一可信来源，并记录任何新增或调整。

#### Scenario: 新增语义颜色
- **WHEN** 需要支持新的语义颜色（如信息、成功、警告、危险）
- **THEN** 必须先在 `variables.css` 中新增对应 CSS 变量并说明用途，随后所有组件引用该变量而不是继续写死字面量。

### Requirement: 通过自动化强制令牌化
必须（MUST）提供检测或修复硬编码样式字面量的工具，确保设计令牌体系长期生效。

#### Scenario: 执行样式令牌工具
- **WHEN** 开发者运行提供的脚本或 lint 规则
- **THEN** 工具需要标记或替换硬编码的颜色、字号、边框等属性，并给出需要人工处理的后续提示。

