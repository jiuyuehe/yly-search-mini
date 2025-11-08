# 变更提案总结：增强表单设计器嵌套对象字段支持

## 📋 提案概览

**变更 ID**: `enhance-nested-object-fields`  
**状态**: 📝 待实施  
**优先级**: P0（核心功能）  
**预估工时**: 8 小时（1 个工作日）

---

## 🎯 目标

为 FormDesigner 表单设计器增加对 `object` 类型字段的子字段管理能力，支持两层嵌套结构（顶层字段 + 对象子字段），以满足复杂结构化数据建模需求（如合同、发票、报价单）。

---

## 📂 文档结构

本变更提案包含以下文档：

1. **proposal.md** - 变更提案主文档
   - Why: 问题背景、业务价值、约束条件
   - What: 具体变更内容、数据结构规范
   - Impact: 影响范围分析
   - Approach: 实现策略与技术选型

2. **tasks.md** - 详细任务清单
   - 6 个任务模块（数据层、UI 层、验证层、样式、错误处理、文档）
   - 每个任务包含优先级、预估时间、依赖关系
   - 功能测试、边界测试、兼容性测试检查清单
   - 明确的完成标准（Definition of Done）

3. **design.md** - 架构设计文档
   - 3 个关键架构决策（对话框 vs 内联、实时保存 vs 确认、类型限制方式）
   - UI/UX 设计（对话框布局、交互流程图）
   - 数据流设计（状态管理、数据同步）
   - 风险评估与缓解措施
   - 可选扩展方向（复用 FieldDesigner、拖拽排序、子字段模板）

---

## 🔑 关键设计决策

### 决策 1：对话框方式管理子字段
- **方案**: 在表格中添加"管理子字段"按钮，点击后弹出独立对话框
- **理由**: 保持 UI 简洁、代码复用性高、移动端友好
- **权衡**: 需额外点击操作，但换取更清晰的层次和扩展性

### 决策 2：实时保存（无确认按钮）
- **方案**: 对话框内编辑操作直接同步到 `formData`，关闭时自动保存
- **理由**: 与顶层字段编辑行为保持一致，代码简单
- **权衡**: 误操作难回退，通过删除确认和明确提示缓解

### 决策 3：双重类型限制保护
- **前端**: 对话框中动态过滤类型选择器，不显示 `object` 和 `array` 选项
- **后端**: Store 验证逻辑检查子字段类型，拒绝非法嵌套
- **理由**: 前端体验 + 后端安全，双重保障

---

## 🛠️ 核心实现要点

### 1. UI 层（FormDesigner.vue）
```vue
<!-- 表格中的操作列新增按钮 -->
<el-button 
  v-if="row.type === 'object'" 
  size="small" 
  icon="Setting"
  @click="openSubFieldDialog(index, row)"
>
  管理子字段
</el-button>

<!-- 子字段编辑对话框 -->
<el-dialog v-model="subFieldDialog.visible" title="管理子字段：{parentField.name}" width="70%">
  <el-table :data="subFieldDialog.subFields">
    <!-- 复用顶层表格结构，类型选择器过滤 object/array -->
  </el-table>
</el-dialog>
```

### 2. 验证层（stores/forms.js）
```javascript
validateFormStructure(structure) {
  // 检查对象字段
  if (field.type === 'object') {
    field.fields?.forEach(subField => {
      // 禁止二层嵌套
      if (['object', 'array'].includes(subField.type)) {
        errors.push(`子字段 "${subField.name}" 不支持 ${subField.type} 类型`);
      }
    });
  }
}
```

### 3. 预览层（PreviewField.vue）
- **已实现**: 递归渲染对象字段及其子字段
- **验证点**: 确保设计器创建的嵌套结构能正确显示

---

## ✅ 任务优先级分解

| 优先级 | 任务模块 | 预估时间 | 关键产出 |
|-------|---------|---------|---------|
| **P0** | 数据验证 + UI 框架 + CRUD 逻辑 | 4h | 对话框、表格、增删改查功能 |
| **P1** | 预览验证 + 错误处理 | 2h | FormPreview 测试、边界处理 |
| **P2** | 样式优化 | 1.5h | 视觉区分、响应式布局 |
| **P3** | 文档与示例 | 0.5h | 示例表单、代码注释 |

---

## 🧪 测试策略

### 功能测试（核心路径）
1. ✅ 为 object 字段添加 3 个不同类型的子字段
2. ✅ 编辑子字段属性（名称、类型、必填、示例值）
3. ✅ 删除子字段（验证确认提示）
4. ✅ 调整子字段顺序（上下移动）
5. ✅ 保存表单后重新加载，验证数据完整性
6. ✅ 在实时预览和全屏预览中查看渲染效果

### 边界测试
- ⚠️ object 字段无子字段时保存（根据验证规则）
- ⚠️ 子字段名称重复时保存（应拒绝）
- ⚠️ 尝试在子字段中选择 object 类型（选项应不存在）
- ⚠️ 加载包含三层嵌套的历史数据（警告但不崩溃）

---

## 🚀 实施路线图

```
Day 1 (8h)
├─ 09:00-10:00 │ Phase 1: 数据验证层（validateFormStructure 增强）
├─ 10:00-11:30 │ Phase 2: UI 框架（对话框、表格、按钮）
├─ 11:30-13:00 │ Phase 3: CRUD 逻辑（添加、编辑、删除、排序）
├─ 14:00-15:00 │ Phase 4: 预览验证（FormPreview 渲染测试）
├─ 15:00-16:00 │ Phase 5: 样式优化（视觉区分、响应式）
├─ 16:00-16:30 │ Phase 6: 错误处理（边界情况、提示）
└─ 16:30-18:00 │ Phase 7: 测试与文档（功能测试、示例更新）
```

---

## 📊 影响范围总结

### ✅ 需要修改的文件
- `src/components/forms/FormDesigner.vue` - 主设计器（核心修改）
- `src/stores/forms.js` - 验证逻辑增强

### ✓ 需要验证的文件（已有逻辑）
- `src/components/forms/FormPreview.vue` - 预览组件
- `src/components/forms/PreviewField.vue` - 字段渲染组件

### ⊘ 不受影响的文件
- `src/components/forms/FieldDesigner.vue` - 未集成到 FormDesigner
- `src/views/ExtractionsView.vue` - 数据抽取视图（仅消费表单定义）
- 后端 API - 已支持嵌套结构存储

---

## 🎓 开发者指南

### 快速启动
1. 阅读 `proposal.md` 了解背景和目标
2. 查看 `design.md` 中的架构决策和数据流设计
3. 按照 `tasks.md` 中的任务清单逐步实施（P0 → P1 → P2 → P3）
4. 运行功能测试和边界测试检查清单
5. 验证 ESLint 通过：`npm run lint`

### 关键代码位置
- 对话框状态：`FormDesigner.vue` 中的 `subFieldDialog` reactive 对象
- 类型过滤：`allowedSubFieldTypes` computed 属性
- 验证逻辑：`stores/forms.js` 的 `validateFormStructure` 方法
- 预览渲染：`PreviewField.vue` 的 `field.type === 'object'` 分支

---

## 📞 联系与反馈

如有疑问或建议，请：
1. 查阅 `design.md` 中的"架构决策"章节
2. 参考 `tasks.md` 中的详细任务说明
3. 在实施过程中发现问题时更新 `design.md` 的"风险评估"章节

---

## 📝 变更日志

| 日期 | 版本 | 作者 | 说明 |
|------|------|------|------|
| 2025-11-06 | v1.0 | AI Assistant | 初始提案创建 |

---

**下一步行动**: 按照 `tasks.md` 中的 P0 任务开始实施，首先完成数据验证层和 UI 框架搭建。
