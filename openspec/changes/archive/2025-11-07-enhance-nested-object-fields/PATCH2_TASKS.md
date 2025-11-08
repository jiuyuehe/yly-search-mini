# Patch 2 任务：Handsontable 嵌套表头增强

**变更ID**: enhance-nested-object-fields (Patch 2)  
**创建日期**: 2025-11-07  
**状态**: Proposed

---

## 前置条件
- [x] Patch 1 已完成（Sample A/B/C、可见性、JSON弹窗、过滤修正、ResultsGrid 基础实现）
- [ ] Handsontable 库已评估（许可证、性能、兼容性）

---

## 实现任务

### 13. 依赖与环境准备
**优先级：P0** | **预估：0.5h** | **依赖：无**

- [x] **13.1** 安装 Handsontable 依赖 使用官方的vue3 组件
    - [vue3 Handsontable 集成指南](https://handsontable.com/docs/javascript-data-grid/vue3-installation/)
    - 已安装：handsontable 16.1.1, @handsontable/vue3 16.1.1
  
- [x] **13.2** 在 ResultsGrid 组件中导入样式
  - 已添加：`import 'handsontable/dist/handsontable.min.css';`
  - 注意：样式通过 node_modules 加载，Vite 会自动打包
  - 可选 CDN 回退：`<link href="https://cdn.jsdelivr.net/npm/handsontable/styles/handsontable.min.css" rel="stylesheet" />`
  
- [x] **13.3** 注册 Handsontable 模块
  - 已添加：`import { registerAllModules } from 'handsontable/registry'; registerAllModules();`
  - 确保 numeric/date/checkbox 等内置类型可用

**验证标准**：
- ✅ Handsontable 模块可正常导入，无 TypeScript 类型错误
- ✅ 空白 Handsontable 实例可渲染
- ✅ 构建通过（npm run build）

---

### 14. 表单结构解析与表头生成
**优先级：P0** | **预估：2h** | **依赖：13**

- [x] **14.1** 从 ExtractionsManager 传递表单结构到 ResultsGrid
  - ✅ 在 props 中新增 `formStructure: { type: Object, default: null }`
  - ✅ 通过 `formsStore.formById(form_id)` 获取当前表单定义
  - ✅ 在 ExtractionsManager 中添加 computed `currentFormStructure` 并传入
  
- [x] **14.2** 实现 `nestedHeaders` 计算属性
  - ✅ 检测字段是否包含 `type: 'object'` 且 `fields` 非空
  - ✅ 有对象字段时生成 2 层表头（顶层合并、底层展开）
  - ✅ 无对象字段时生成单层表头（字段名数组）
  - ✅ 无表单结构时使用动态列生成单层表头
  
- [x] **14.3** 实现 `columns` 计算属性
  - 为对象字段的每个子字段创建独立列定义（使用点式路径 `data: "合同信息.甲方名称"`）
  - 映射字段类型到 Handsontable 列类型（text/numeric/date/checkbox）
  - 设置 `readOnly: false` 允许编辑
  - 为 number 类型添加格式化配置（如 `format: '0,0'`）

**验证标准**：
- Sample B（包含对象字段）的表头显示为 2 层，顶层合并，底层展开
- Sample A（无对象字段）的表头显示为 1 层，无冗余空行
- 列数与表单字段总数（含展开的子字段）一致
- 控制台无警告或错误

---

### 15. 数据扁平化与行映射
**优先级：P0** | **预估：1.5h** | **依赖：14**

- [x] **15.1** 实现 `flattenExtractedData(data)` 函数
  - ✅ 将 `{ "合同信息": { "甲方": "ABC" } }` 扁平化为 `{ "合同信息.甲方": "ABC" }`
  - ✅ 保留非对象字段原样（`{ "文档ID": "DOC123" }` → `{ "文档ID": "DOC123" }`）
  - ✅ 处理数组字段：序列化为 JSON 字符串
  
- [x] **15.2** 实现 `tableData` 计算属性
  - ✅ 将 `items` 中的每个 `extracted_data` 扁平化
  - ✅ 转换为数组行格式（与 `columns` 定义顺序一一对应）
  - ✅ 处理缺失值（返回空字符串）
  
- [x] **15.3** 边界测试与数据归一化增强
  - ✅ 对象字段缺失某些子字段时，对应列显示空值
  - ✅ 数组字段序列化为 JSON 字符串显示
  - ✅ extracted_data 为空对象时，行全部显示空值
  - ✅ **已修复**：增强 `toObject()` 函数支持后端 fields 的多种格式：
    - 格式 1: `fields` 是对象 `{ "姓名": "XXX" }`
    - 格式 2a: `fields` 是数组，元素为 JSON 字符串 `["{\"姓名\":\"\"}"]`
    - 格式 2b: `fields` 是数组，元素为对象 `[{ name: "姓名", value: "Xi", confidence: 1 }]`
    - 格式 2c: `fields` 是数组，元素为普通对象

**验证标准**：
- ✅ 表格行数与 `items.length` 一致
- ✅ 对象字段的子字段值正确填充到对应列（无错位）
- ✅ 空值单元格不报错，显示为空
- ✅ 数组字段显示为可读的 JSON 字符串
- ✅ 后端返回的多种 fields 格式均可正确解析和显示

---

### 16. Handsontable 实例初始化与更新
**优先级：P0** | **预估：1h** | **依赖：15**

- [x] **16.1** 在模板中渲染 HotTable 组件
  - ✅ 传入 `data: tableData.value`, `columns: columns.value`, `nestedHeaders: nestedHeaders.value`
  - ✅ 配置 `licenseKey: 'non-commercial-and-evaluation'`
  - ✅ 启用 `manualColumnResize: true`, `contextMenu: ['copy', 'cut', 'paste']`
  - ✅ 设置 `stretchH: 'all'`, `height: 500`, `rowHeaders: true`, `colHeaders: false`
  
- [x] **16.2** 使用计算属性实现响应式更新
  - ✅ HotTable 组件自动监听 `tableData`, `columns`, `nestedHeaders` 变化
  - ✅ 无需手动调用 `updateSettings()`（Vue3 组件自动处理）
  
- [x] **16.3** 移除 Element Plus 表格回退
  - ✅ 统一使用 Handsontable 渲染（无论是否有对象字段）
  - ✅ 清理旧的双击编辑、状态显示等 Element 表格相关代码

**验证标准**：
- ✅ 表格渲染正常，表头和数据行对齐
- ✅ 切换表单筛选时，表头动态更新（对象字段变化时 2 层 ↔ 1 层）
- ✅ 列宽调整功能正常工作
- ✅ 构建通过且 CSS 正确打包到 dist/assets/
- 无内存泄漏（销毁实例后无控制台报错）
- 列宽调整功能正常工作

---

### 17. 编辑与保存集成
**优先级：P1** | **预估：1.5h** | **依赖：16**

- [x] **17.1** 实现 `unflattenRowData(rowArray)` 函数
  - ✅ 将数组行数据还原为嵌套对象结构
  - ✅ 处理点式路径（如 `"合同信息.甲方"` → 创建嵌套对象）
  - ✅ 使用 `hotColumns` 映射索引到字段路径
  
- [x] **17.2** 在 Handsontable 配置中添加 `afterChange` 钩子
  - ✅ 添加 `@afterChange` 事件处理（当前仅占位，可扩展标记修改行）
  
- [x] **17.3** 添加"保存选中行"按钮（方案 B）
  - ✅ 工具栏提供"保存选中行"按钮
  - ✅ 点击时调用 `saveSelectedRows()`
  - ✅ 获取 `hotInstance.getDataAtRow(rowIndex)` 并调用 `unflattenRowData` 还原
  - ✅ emit `save-row` 事件，传递 `{ id, data, row }`

**验证标准**：
- ✅ 单元格可编辑（单击或双击进入编辑）
- ✅ 编辑后按 Enter 提交，数据更新
- ✅ 选中行后点击"保存选中行"，emit 事件携带正确的嵌套对象数据
- ✅ ExtractionsManager 接收到 `save-row` 事件并成功调用 API
- ✅ 保存成功后显示成功提示（ElMessage）

---

### 18. 样式与交互优化
**优先级：P2** | **预估：1h** | **依赖：17**

- [ ] **18.1** 调整 Handsontable 样式与项目主题一致
  - 覆盖默认 CSS 变量：
    - `--ht-header-background: var(--background-color-light);`
    - `--ht-border-color: var(--border-color);`
  - 保持边框、斑马纹样式与 Element Plus 表格相似
  - 调整表头字体大小和加粗（与 Element Table 一致）
  
- [ ] **18.2** 添加行选择支持
  - 配置 `rowHeaders: true` 显示行号
  - 或在第一列添加 checkbox 列（类型 `'checkbox'`）
  - 使用 `afterSelection` 钩子 emit `selection-change` 事件
  - 同步选中行 ID 到父组件（用于批量删除/导出）
  
- [ ] **18.3** 响应式布局适配
  - 小屏幕（<768px）时减少表格高度（`height: 400`）
  - 列宽自适应（使用 `stretchH: 'all'`）
  - 确保移动端横向滚动正常

**验证标准**：
- 表格视觉风格与页面整体一致（色调、边框、字体）
- 行选择功能正常，与批量删除/导出联动
- 移动端（模拟器）布局不破损，横向滚动流畅

---

### 19. 回退机制与兼容性
**优先级：P2** | **预估：0.5h** | **依赖：18**

- [ ] **19.1** 添加配置开关（可选）
  - 在 ExtractionsManager 中添加 `useHandsontable` 响应式变量（默认 false）
  - 根据开关渲染 Element Plus 表格或 Handsontable
  - 添加切换按钮（位于表格上方操作栏）
  
- [ ] **19.2** 无表单结构时的兼容处理
  - 如果 `formStructure` 为空或未传递，回退到当前扁平化列实现
  - 在表格上方显示警告提示"表单结构缺失，使用默认列"
  - 不阻止表格加载，仅记录警告

**验证标准**：
- 开关关闭时，旧版 Element Plus 表格正常工作
- 开关打开时，Handsontable 正常渲染
- 无表单定义时不崩溃，给出合理提示
- 切换开关后状态（选中行、筛选条件）保持不变

---

### 20. 测试与文档
**优先级：P3** | **预估：1h** | **依赖：19**

- [ ] **20.1** 手动测试完整流程
  - 从 `/forms` 点击"关联数据结果"，加载 Sample B（包含对象字段）
  - 验证表头显示为 2 层（顶层"合同信息"合并，底层"甲方名称"等独立）
  - 双击单元格编辑，修改"合同金额"为新值
  - 点击保存，验证成功提示并刷新行数据
  - 加载 Sample A（无对象字段），验证表头回退到 1 层
  
- [ ] **20.2** 边界测试
  - 对象字段子字段数量为 0 时的处理（应显示对象名称但无子列）
  - 数组字段序列化后编辑，验证不报错（虽然不推荐编辑 JSON 字符串）
  - 大数据量（100+ 行）时的滚动性能测试
  
- [ ] **20.3** 更新代码注释
  - 在 `nestedHeaders` 计算属性上方添加 JSDoc
  - 在 `unflattenRowData` 函数上方添加输入/输出示例
  - 说明嵌套表头生成逻辑和数据映射原理

**验证标准**：
- 所有测试用例通过
- 代码注释清晰，便于后续维护
- 大数据量场景下表格滚动流畅（无明显卡顿）

---

## 测试检查清单

### 功能测试
- [ ] 表单包含对象字段时，表头显示 2 层嵌套结构
- [ ] 表单无对象字段时，表头显示 1 层标准结构
- [ ] 对象字段的子字段值正确映射到对应列
- [ ] 双击单元格可编辑，编辑值正确保存
- [ ] 保存按钮点击后，API 调用成功并显示成功提示
- [ ] 行选择功能正常，批量删除/导出与 Handsontable 联动

### 边界测试
- [ ] 对象字段无子字段时不崩溃（显示空列或提示）
- [ ] 表单结构缺失时回退到默认列实现
- [ ] 数组字段序列化后显示可读的 JSON 字符串
- [ ] 空值单元格显示为空，不报错

### UI/UX 测试
- [ ] 表格样式与项目主题一致
- [ ] 列宽调整功能正常
- [ ] 响应式布局在不同屏幕尺寸下正常显示
- [ ] 移动端横向滚动流畅

### 兼容性测试
- [ ] 开关切换后，Element Plus 表格和 Handsontable 均正常工作
- [ ] 现有功能（筛选、分页、导出）不受影响
- [ ] 与 Patch 1 功能（可见性、JSON弹窗、Sample选择）兼容

---

## 完成标准（Definition of Done）
- [ ] 所有 P0/P1 任务完成
- [ ] 功能测试和边界测试通过
- [ ] 代码通过 ESLint 检查（`pnpm run lint`）
- [ ] 构建无错误（`pnpm run build`）
- [ ] 至少在 Chrome 和 Firefox 中验证功能正常
- [ ] Sample A/B/C 均可正常加载并显示正确的表头结构
- [ ] 编辑保存流程端到端验证通过
- [ ] （可选）更新 PROJECT_SUMMARY.md 记录本次增强

---

## 预估总时间
- P0 任务：~4h（依赖安装、表头生成、数据映射、实例初始化）
- P1 任务：~1.5h（编辑保存集成）
- P2 任务：~1.5h（样式优化、回退机制）
- P3 任务：~1h（测试与文档）
- **总计**：约 8 小时（1 个工作日）

---

## 依赖关系图
```
13 (依赖安装)
 ↓
14 (表头生成) ← 需要表单结构
 ↓
15 (数据映射) ← 需要列定义
 ↓
16 (实例初始化) ← 需要数据和表头
 ↓
17 (编辑保存) ← 需要实例和数据还原逻辑
 ↓
18 (样式优化) ← 需要基本功能完成
 ↓
19 (回退机制) ← 需要两种实现均可用
 ↓
20 (测试文档) ← 需要所有功能完成
```

---

## 风险与缓解

### 风险 1：Handsontable 性能问题（大数据量）
- **影响**：100+ 行数据时可能出现滚动卡顿
- **缓解**：
  - 启用虚拟滚动（Handsontable 默认支持）
  - 限制初始加载行数（分页大小不超过 50）
  - 提供"加载更多"按钮而非无限滚动

### 风险 2：样式冲突（Handsontable vs Element Plus）
- **影响**：全局 CSS 可能互相覆盖
- **缓解**：
  - 在 ResultsGrid 组件内使用 scoped style
  - 使用 CSS 变量而非硬编码颜色
  - 必要时使用 `!important` 覆盖 Handsontable 默认样式

### 风险 3：数据还原逻辑复杂（嵌套对象）
- **影响**：编辑保存时数据结构错误
- **缓解**：
  - 编写单元测试覆盖 `flattenExtractedData` 和 `unflattenRowData`
  - 在保存前添加数据验证（检查必填字段、类型校验）
  - 提供详细的错误提示（如"子字段 XX 类型不匹配"）

### 风险 4：许可证合规性
- **影响**：Handsontable 商业版需付费
- **缓解**：
  - 明确使用社区版（`non-commercial-and-evaluation`）
  - 在代码注释中标注许可证类型
  - 如需商用，提前联系 Handsontable 团队购买许可

---

## 参考资源
- [vue3 Handsontable 集成指南](https://handsontable.com/docs/javascript-data-grid/vue3-installation/)
- [Handsontable Nested Headers 官方文档](https://handsontable.com/docs/nested-headers/)
- [Vue 3 + Handsontable 集成指南](https://handsontable.com/docs/vue3/)
- [API 参考：updateSettings](https://handsontable.com/docs/api/core/#updatesettings)
- 用户提供的 HTML Demo（已存档于 `code-snippets.md`）
