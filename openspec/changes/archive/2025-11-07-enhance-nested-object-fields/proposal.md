# 变更：增强表单设计器的嵌套对象字段支持

## Why

### 当前问题
FormDesigner 表单设计器当前虽然支持 `object` 类型字段，但缺少为 `object` 类型字段添加子字段的能力：

1. **设计缺失**：当用户将字段类型设置为 `object` 时，无法在 UI 中为该对象添加子字段定义
2. **预览不完整**：FormPreview 和 PreviewField 组件已经支持渲染对象子字段，但由于设计器无法创建子字段，这些预览逻辑无法被充分测试和使用
3. **数据抽取受限**：AI 自定义信息抽取功能需要结构化的对象定义（如"合同"包含"甲方"、"乙方"、"金额"等子字段），当前无法在表单设计器中定义这种结构

### 业务价值
- **结构化数据建模**：允许用户定义复杂的嵌套数据结构（如合同、发票、报价单），满足真实业务场景
- **AI 抽取精度提升**：通过明确的子字段定义，AI 可以更准确地理解和提取结构化信息
- **一致性保证**：确保设计器、预览器和实际数据抽取使用相同的数据结构定义

### 约束条件
- **嵌套层级限制**：仅支持两层嵌套（顶层字段 + 对象子字段），对象的子字段不能再设置为 `object` 类型
- **简化原则**：避免过度复杂的递归嵌套，保持 UI 可用性和用户理解成本

## What Changes

### 1. FormDesigner 表格视图增强
- **现状**：表格中 `object` 类型字段只显示静态标签"对象类型"，无法展开编辑子字段
- **目标**：在表格行中为 `object` 类型字段添加"管理子字段"操作按钮，点击后弹出子字段编辑对话框

### 2. 对象子字段编辑对话框（新增）
- **功能**：模态对话框显示当前 `object` 字段的子字段列表（表格形式）
- **操作**：添加、编辑、删除、上下移动子字段
- **类型限制**：子字段类型选择器中移除 `object` 和 `array` 选项（仅允许简单类型：text, number, date, boolean）

### 3. FormPreview 渲染验证
- **现状**：已支持对象字段递归渲染（PreviewField 组件）
- **验证**：确保设计器创建的嵌套结构能在预览中正确显示

### 4. 数据结构规范
```javascript
// 顶层字段示例
{
  id: "field_1",
  name: "contract",
  type: "object",
  required: true,
  fields: [
    { id: "sub_1", name: "partyA", type: "text", example: "甲方公司", required: true },
    { id: "sub_2", name: "amount", type: "number", example: 100000, required: true },
    { id: "sub_3", name: "signDate", type: "date", example: "2025-11-06", required: false }
  ]
}
```

## Impact

### 影响的组件
- `src/components/forms/FormDesigner.vue` - 主设计器，添加子字段管理入口
- `src/components/forms/FormPreview.vue` - 预览组件（已支持，需验证）
- `src/components/forms/PreviewField.vue` - 字段渲染组件（已支持，需验证）
- `src/stores/forms.js` - 表单状态管理（可能需要验证逻辑增强）

### 不影响的内容
- **FieldDesigner.vue**：该组件已支持嵌套字段编辑，但当前未在 FormDesigner 中使用（可选：后续可重构复用）
- **API 接口**：后端 API 已支持嵌套结构的保存和读取（基于现有 structure 字段）
- **数据抽取流程**：ExtractionsView 和相关组件无需修改，仅消费表单定义

## Approach

### 实现策略
**方案 A（推荐）**：在 FormDesigner 表格中添加"管理子字段"按钮 + 独立对话框
- **优点**：保持表格简洁，适合大量字段管理；对话框可复用现有表格布局逻辑
- **缺点**：需要额外点击操作

**方案 B**：表格行内展开式编辑
- **优点**：减少点击次数，内联编辑体验流畅
- **缺点**：表格嵌套复杂，视觉层次难以保持清晰

**选择**：方案 A，理由是保持 UI 简洁且易于扩展。

### 技术细节
1. **对话框组件**：使用 Element Plus `<el-dialog>` + `<el-table>` 重现顶层字段表格的编辑体验
2. **类型过滤**：在对话框中的类型选择器中动态过滤掉 `object` 和 `array`
3. **验证增强**：在 `stores/forms.js` 的 `validateFormStructure` 中添加嵌套层级检查（禁止三层及以上）
4. **ID 生成**：为子字段生成唯一 ID（如 `sub_${counter}`），确保 Vue 列表渲染的 key 唯一性

### 风险与缓解
- **风险**：现有表单数据中可能存在不符合两层限制的结构
  - **缓解**：在验证逻辑中添加兼容处理，对历史数据给出警告但不阻止加载
- **风险**：对话框关闭时子字段未保存
  - **缓解**：实时更新（无"确认"/"取消"按钮），或添加明确的保存提示

## Non-Goals
以下内容不在本次变更范围内：
- **三层及以上嵌套**：明确限制为两层，不支持对象的对象
- **数组嵌套数组**：不支持 `array<array>` 结构
- **FieldDesigner 重构**：虽然该组件已实现嵌套编辑，但本次不将其集成到 FormDesigner（可作为未来优化）
- **拖拽排序**：子字段排序使用上下箭头按钮，不实现拖拽功能

---

# Patch 1 补充变更（与本变更同一 change-id 下的追加规范）

为满足新增的产品需求，在该变更下追加如下能力规格，详见 `specs/` 目录：

- 样例表单（3 个） — `specs/sample-examples/spec.md`
  - Sample A：纯平铺字段
  - Sample B：包含一个对象及子字段
  - Sample C：稍复杂（对象 + 数组元素为对象的若干子字段）

- 可见性选择（公开/个人） — `specs/form-visibility/spec.md`
  - 设计器新增单选：公开/个人（与提取数量同组）
  - 公开：payload 不含 `userId`；个人：payload 含当前用户 `userId`

- 表单管理可见性列 — `specs/forms-manager-visibility-flag/spec.md`
  - `/forms` 列表新增“可见性”列：无 `userId` 显示“公开”，有 `userId` 显示“个人”

- JSON 预览改为弹窗 — `specs/preview-json-dialog/spec.md`
  - 移除页面内 JSON 卡片；新增“查看JSON”按钮，打开只读 JSON 弹窗

- 提取结果过滤修正 — `specs/forms-extractions-filtering/spec.md`
  - 从 `/forms` 跳转 `/extractions?form_id=<id>` 时，结果只显示对应表单数据

- Handsontable 结果视图（新增，不替换旧版） — `specs/handsontable-results-view/spec.md`
  - 新组件以 Handsontable 展示复杂结构，支持对象子字段展开为多列、单元格双击编辑

说明：本 Patch 仅追加能力规范与任务，不改变已有“嵌套对象字段编辑”的核心设计与约束。
