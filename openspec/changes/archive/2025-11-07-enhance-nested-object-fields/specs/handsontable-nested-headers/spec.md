# Handsontable 嵌套表头结果视图

## Status
**Phase**: Proposed  
**Version**: 1.0  
**Last Updated**: 2025-11-07

## Overview
为 ResultsGrid 组件引入 Handsontable 的嵌套表头（nestedHeaders）功能，优雅地展示表单中包含对象子字段的复杂数据结构。当表单字段类型为 `object` 且包含子字段时，在结果表格中将对象字段作为一级表头，其子字段作为二级表头展开为多列，实现层次清晰的数据呈现。

## Context
当前 ResultsGrid 使用扁平化点式路径（如"合同信息.甲方名称"）作为单层表头，虽然功能可用但在对象子字段较多时表头冗长、层次不清晰。Handsontable 的 nestedHeaders 特性可将对象及其子字段映射为多层表头，提供更接近原始表单结构的展示方式，提升可读性和用户体验。

## ADDED Requirements

### Requirement: 多层表头结构映射

- The system MUST map any top-level field with `type === 'object'` to a first-level header cell merged across its subfields (using `colspan`).
- Each subfield of an object-type field MUST be rendered as a second-level header under its parent.
- Non-object fields MUST be rendered as both first- and second-level headers aligned to a single column.

#### Scenario: 表单包含对象字段时生成嵌套表头
**GIVEN** 表单结构定义中包含类型为 `object` 的字段，且该字段包含 2-3 个子字段  
**AND** 用户在 ExtractionsManager 中查看该表单的抽取结果列表  
**WHEN** ResultsGrid 加载数据并构建表头  
**THEN** 系统 MUST 将对象字段映射为一级表头（合并单元格跨越所有子字段列）  
**AND** 每个子字段映射为二级表头（独立列）  
**AND** 二级表头下方显示子字段的实际值

**示例**：
```javascript
// 表单结构
fields: [
  { name: '文档ID', type: 'text' },
  {
    name: '合同信息',
    type: 'object',
    fields: [
      { name: '甲方名称', type: 'text' },
      { name: '合同金额', type: 'number' },
      { name: '签订日期', type: 'date' }
    ]
  },
  { name: '状态', type: 'text' }
]

// 生成的 nestedHeaders（2层）
[
  [
    '文档ID',                        // 非对象字段直接映射
    { label: '合同信息', colspan: 3 }, // 对象字段作为一级表头，跨3列
    '状态'
  ],
  [
    '文档ID',                        // 底层表头与一级对齐
    '甲方名称',                      // 子字段1
    '合同金额',                      // 子字段2
    '签订日期',                      // 子字段3
    '状态'
  ]
]
```

---

### Requirement: 数据行映射与编辑支持

- The system MUST populate each second-level column with the corresponding subfield value from the object field.
- Simple (non-object) fields MUST populate their values into the aligned column.
- Edited values in the grid MUST be preserved in the in-memory row model until a save action is triggered.

#### Scenario: 嵌套表头下的数据行与对象字段值对应
**GIVEN** 表头已按嵌套结构生成  
**AND** 用户查看某一行抽取记录  
**WHEN** 数据行渲染  
**THEN** 系统 MUST 将对象字段的子字段值分别填充到对应的独立列中  
**AND** 非对象字段直接映射到对应列  
**AND** 保持与当前 ResultsGrid 相同的编辑行为（双击单元格编辑、行级保存）

**示例**：
```javascript
// 原始抽取数据
extracted_data: {
  '文档ID': 'DOC123',
  '合同信息': {
    '甲方名称': '某科技公司',
    '合同金额': 100000,
    '签订日期': '2025-01-15'
  },
  '状态': '已完成'
}

// 映射到列（与底层表头一一对应）
[
  'DOC123',        // 文档ID
  '某科技公司',    // 合同信息.甲方名称
  100000,          // 合同信息.合同金额
  '2025-01-15',    // 合同信息.签订日期
  '已完成'         // 状态
]
```

---

### Requirement: 表头层级自动检测

- The system MUST automatically detect whether object-type fields exist in the form structure.
- If object-type fields exist, the system MUST produce two header rows; otherwise it MUST produce a single header row.
- The system MUST NOT produce three or more header rows.

#### Scenario: 根据表单结构决定表头层数
**GIVEN** 表单结构可能包含 0 至多个对象字段  
**WHEN** ResultsGrid 解析表单结构并构建表头  
**THEN** 系统 MUST 自动检测是否存在对象字段  
**AND** 如果存在对象字段，则生成 2 层 nestedHeaders  
**AND** 如果不存在对象字段（仅平铺字段），则生成 1 层标准表头（等价于当前实现）  
**AND** 不得生成 3 层及以上表头（符合两层嵌套限制）

---

### Requirement: 与现有功能兼容

- The system MUST preserve selection behavior and emit `selection-change` with selected ids.
- The system MUST preserve the ability to open a document by emitting `open-doc` with the document id.
- The system MUST preserve row save behavior by emitting `save-row` with the reconstructed nested object payload.

#### Scenario: 保留选择、打开文档、保存等核心交互
**GIVEN** ResultsGrid 已切换到 Handsontable 嵌套表头实现  
**WHEN** 用户执行以下操作  
**THEN** 系统 MUST 保持功能行为一致：
- 行选择（checkbox）并触发 `selection-change` 事件
- 点击文档ID链接触发 `open-doc` 事件跳转预览
- 点击"保存"按钮触发 `save-row` 事件提交更新
- 状态标签正确显示（已完成/处理中/失败）
- 创建时间格式化为本地化日期时间

---

## Technical Constraints
1. **依赖库**：使用 Handsontable 社区版（`non-commercial-and-evaluation` 许可），通过 CDN 或 npm 安装
2. **兼容性**：保持与当前 Element Plus 表格相同的响应式布局、边框、斑马纹样式
3. **性能**：嵌套表头计算在组件 `computed` 中完成，避免运行时重复解析
4. **数据扁平化**：保持现有 `flatten()` / `toObject()` 逻辑，但在列映射时按嵌套结构组织

## Non-Requirements
- **三层及以上嵌套**：不支持对象的对象，符合已有两层限制
- **数组展开为多行**：数组字段仍序列化为 JSON 字符串显示，不展开为多行记录
- **拖拽调整列宽**：使用 Handsontable 默认的 `manualColumnResize`，无需额外定制
- **高级过滤**：本次仅实现嵌套表头展示，过滤器功能沿用顶层过滤下拉（不在表格内过滤）

## Migration Path
- **向后兼容**：现有不含对象字段的表单自动降级为单层表头，无感知变化
- **渐进增强**：可选择保留 Element Plus 表格作为回退方案，通过配置开关切换实现
- **数据层无变化**：后端 API 和 Store 保持不变，仅前端展示层优化

## Success Criteria
1. 包含对象字段的表单结果表格显示 2 层嵌套表头，子字段独立成列
2. 数据行正确映射到对应列（对象子字段与非对象字段均准确显示）
3. 双击单元格编辑、保存按钮功能正常，与旧版行为一致
4. 无对象字段的表单回退到单层表头，无报错或性能退化
5. 通过构建验证，无 TypeScript/ESLint 错误

## Related Capabilities
- `specs/form-nested-subfields/spec.md`（核心依赖，表单设计器对象子字段编辑）
- `specs/sample-examples/spec.md`（测试数据来源，Sample B/C 包含对象字段）
- `specs/handsontable-results-view/spec.md`（Patch 1 版本，本规范为 Patch 2 增强）

## References
- Handsontable 官方文档：https://handsontable.com/docs/nested-headers/
- 用户提供的 HTML Demo（存档于 `code-snippets.md`）
- Vue 3 + Handsontable 集成指南：https://handsontable.com/docs/vue3/

---

**Note**: 本规范为 `enhance-nested-object-fields` 变更的 Patch 2，专注于嵌套表头视觉增强，不改变核心数据结构与验证逻辑。
