# 设计文档：嵌套对象字段编辑方案

## 架构决策

### 决策 1：对话框 vs 内联编辑

**问题**：子字段编辑应该在表格内展开（内联）还是弹出对话框？

**方案对比**：

| 维度 | 方案 A：对话框 | 方案 B：表格内展开 |
|------|--------------|-----------------|
| **视觉清晰度** | ✅ 高（独立空间，层次明确） | ⚠️ 中（嵌套表格易混乱） |
| **操作复杂度** | ⚠️ 需额外点击 | ✅ 一步到位 |
| **代码复用** | ✅ 可复用现有表格组件 | ⚠️ 需自定义嵌套表格逻辑 |
| **扩展性** | ✅ 易于添加高级功能 | ⚠️ 受限于表格行高和布局 |
| **移动端适配** | ✅ 对话框天然全屏 | ❌ 嵌套表格难以适配 |

**决策**：选择方案 A（对话框）
- **理由**：保持 UI 简洁，代码复用性高，移动端友好
- **权衡**：牺牲一步直达体验，换取清晰的层次和更好的扩展性

---

### 决策 2：实时保存 vs 确认保存

**问题**：对话框关闭时，子字段变更应该实时生效还是需要用户点击"确认"？

**方案对比**：

| 维度 | 实时保存 | 确认保存 |
|------|---------|---------|
| **用户心智** | ⚠️ 需适应"所见即所得" | ✅ 符合传统表单习惯 |
| **错误恢复** | ❌ 误操作难回退 | ✅ 可取消放弃更改 |
| **代码复杂度** | ✅ 简单（直接修改 reactive 对象） | ⚠️ 需深拷贝和 diff 逻辑 |
| **与顶层一致性** | ✅ 顶层字段也是实时生效 | ⚠️ 仅子字段需确认，不一致 |

**决策**：选择实时保存
- **理由**：与顶层字段编辑行为保持一致，代码简单
- **权衡**：增加"撤销"按钮（可选）或提示用户"更改将实时生效"
- **实现**：`subFieldDialog.subFields` 直接引用 `parentField.fields`（响应式绑定）

---

### 决策 3：类型限制实现方式

**问题**：如何阻止用户在子字段中选择 `object` 或 `array` 类型？

**方案对比**：

1. **前端过滤**：在类型选择器中根据 `isNested` prop 动态过滤选项
   - ✅ 简单直观，用户看不到不可选项
   - ⚠️ 依赖前端逻辑，需在多处保持一致
   
2. **后端验证**：前端允许选择，后端拒绝保存
   - ✅ 数据安全性高
   - ❌ 用户体验差（保存时才发现错误）
   
3. **双重保护**：前端过滤 + 后端验证
   - ✅ 最安全
   - ⚠️ 代码冗余

**决策**：选择方案 3（双重保护）
- **前端**：在对话框中使用 computed 过滤类型列表
  ```javascript
  const allowedSubFieldTypes = computed(() => 
    fieldTypes.filter(t => !['object', 'array'].includes(t.value))
  );
  ```
- **后端（Store 验证）**：在 `validateFormStructure` 中添加检查
  ```javascript
  field.fields?.forEach(subField => {
    if (['object', 'array'].includes(subField.type)) {
      errors.push(`对象字段 "${field.name}" 的子字段 "${subField.name}" 不支持嵌套类型`);
    }
  });
  ```

---

## UI/UX 设计

### 对话框布局

```
┌─────────────────────────────────────────────────────────────┐
│  管理子字段：合同信息                                  [×]   │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [+添加子字段]                              共 3 个   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 序 │ 字段名称    │ 类型   │ 必填 │ 示例值   │ 操作  │  │
│  ├───┼────────────┼────────┼──────┼─────────┼────────┤  │
│  │ 1 │ partyA     │ 文本   │ ✓    │ 甲方公司 │ ↑↓🗑️ │  │
│  │ 2 │ partyB     │ 文本   │ ✓    │ 乙方公司 │ ↑↓🗑️ │  │
│  │ 3 │ amount     │ 数字   │ ✓    │ 100000  │ ↑↓🗑️ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ℹ️ 提示：对象的子字段仅支持简单类型（文本、数字、日期、布尔）│
├─────────────────────────────────────────────────────────────┤
│                                             [关闭] ──────────┤
└─────────────────────────────────────────────────────────────┘
```

### 交互流程

```
用户操作流程：
1. 在 FormDesigner 表格中创建一个 object 类型字段（如"合同信息"）
   └─> 表格中该行显示"对象类型"标签 + [⚙️ 管理子字段] 按钮
   
2. 点击 [管理子字段] 按钮
   └─> 弹出对话框，标题"管理子字段：合同信息"
   └─> 如果该对象尚无子字段，显示空表格 + 提示
   
3. 在对话框中点击 [添加子字段]
   └─> 表格中新增一行，默认值：name="字段1", type="text", required=false
   └─> 用户编辑字段名称、选择类型（仅 text/number/date/boolean）、设置必填、填写示例值
   
4. 继续添加更多子字段（重复步骤 3）
   └─> 使用 ↑↓ 按钮调整顺序
   └─> 使用 🗑️ 按钮删除（弹出确认）
   
5. 点击 [关闭] 按钮
   └─> 对话框关闭，子字段数据自动保存到 formData.structure.fields[index].fields
   └─> 右侧预览面板实时更新，显示对象字段及其子字段
   
6. 点击顶部 [预览] 按钮（全屏预览）
   └─> 查看完整表单，对象字段展开显示所有子字段
```

---

## 数据流设计

### 状态管理

```javascript
// FormDesigner 组件状态
const formData = reactive({
  name: '合同表单',
  extractionMode: 'single',
  structure: {
    formName: '合同表单',
    fields: [
      {
        id: 'field_1',
        name: 'contract',
        type: 'object',
        required: true,
        // 关键：对象字段的 fields 数组
        fields: [
          { id: 'sub_1', name: 'partyA', type: 'text', example: '甲方公司', required: true },
          { id: 'sub_2', name: 'partyB', type: 'text', example: '乙方公司', required: true },
          { id: 'sub_3', name: 'amount', type: 'number', example: 100000, required: true }
        ]
      },
      {
        id: 'field_2',
        name: 'signDate',
        type: 'date',
        example: '2025-11-06',
        required: false
      }
    ]
  }
});

// 子字段对话框状态（临时，指向 formData 中的子数组）
const subFieldDialog = reactive({
  visible: false,
  parentIndex: -1,
  // 直接引用，保持响应式
  get parentField() {
    return formData.structure.fields[this.parentIndex] || null;
  },
  // 便捷访问器
  get subFields() {
    return this.parentField?.fields || [];
  }
});
```

### 数据同步

```javascript
// 打开对话框
function openSubFieldDialog(index, field) {
  subFieldDialog.parentIndex = index;
  subFieldDialog.visible = true;
  // 确保 fields 数组存在
  if (!field.fields) {
    field.fields = [];
  }
}

// 添加子字段（直接操作 parentField.fields）
function addSubField() {
  const newField = {
    id: generateSubFieldId(),
    name: `子字段${subFieldDialog.subFields.length + 1}`,
    type: 'text',
    example: '',
    required: false
  };
  subFieldDialog.parentField.fields.push(newField);
}

// 删除子字段（带确认）
async function deleteSubField(index) {
  await ElMessageBox.confirm('确定删除该子字段吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  });
  subFieldDialog.parentField.fields.splice(index, 1);
}

// 关闭对话框（无需额外保存，数据已实时同步）
function closeSubFieldDialog() {
  subFieldDialog.visible = false;
  subFieldDialog.parentIndex = -1;
}
```

---

## 验证逻辑增强

### Store 验证（`stores/forms.js`）

```javascript
validateFormStructure(structure) {
  const errors = [];
  
  if (!structure || !structure.fields || !Array.isArray(structure.fields)) {
    errors.push('表单结构无效：缺少 fields 数组');
    return errors;
  }
  
  structure.fields.forEach((field, index) => {
    // 现有验证（字段名、类型等）
    if (!field.name) errors.push(`字段 ${index + 1}: 缺少字段名称`);
    if (!field.type) errors.push(`字段 "${field.name}": 缺少字段类型`);
    
    // 新增：对象字段嵌套验证
    if (field.type === 'object') {
      if (!field.fields || !Array.isArray(field.fields)) {
        // 自动修复：初始化为空数组
        field.fields = [];
      }
      
      // 检查子字段
      field.fields.forEach((subField, subIndex) => {
        if (!subField.name) {
          errors.push(`对象字段 "${field.name}" 的子字段 ${subIndex + 1}: 缺少字段名称`);
        }
        
        // 禁止二层嵌套
        if (['object', 'array'].includes(subField.type)) {
          errors.push(
            `对象字段 "${field.name}" 的子字段 "${subField.name}": 不支持 ${subField.type} 类型（仅支持简单类型）`
          );
        }
      });
      
      // 检查子字段名称重复
      const subFieldNames = field.fields.map(f => f.name);
      const duplicates = subFieldNames.filter((name, idx) => subFieldNames.indexOf(name) !== idx);
      if (duplicates.length > 0) {
        errors.push(`对象字段 "${field.name}" 存在重复的子字段名称: ${[...new Set(duplicates)].join(', ')}`);
      }
    }
  });
  
  return errors;
}
```

---

## 风险评估与缓解

### 风险 1：性能问题（大量子字段）
- **场景**：对象字段包含 50+ 子字段时，对话框表格渲染卡顿
- **概率**：低（业务场景下单个对象通常 <20 字段）
- **缓解**：
  1. 使用 Element Plus Table 的虚拟滚动（需升级 EP 版本）
  2. 添加子字段数量限制（如最多 30 个）

### 风险 2：历史数据兼容性
- **场景**：现有数据库中可能存在不符合两层限制的表单（如测试数据）
- **概率**：中（如果历史版本支持过三层嵌套）
- **缓解**：
  1. 加载时检测并给出警告："表单包含不支持的嵌套结构，部分功能可能受限"
  2. 提供数据迁移脚本（可选）：扁平化三层嵌套为两层

### 风险 3：用户误删子字段
- **场景**：用户在对话框中误点删除按钮，失去子字段定义
- **概率**：中（常见用户误操作）
- **缓解**：
  1. 删除前弹出确认对话框（已实现）
  2. 添加"撤销"功能（可选，增加复杂度）
  3. 在关闭对话框时提示"共 N 个子字段已保存"

---

## 可选扩展（未来优化）

### 扩展 1：复用 FieldDesigner 组件
- **当前状态**：FieldDesigner 已实现嵌套字段编辑，但采用卡片式布局（非表格）
- **优化方向**：
  1. 重构 FieldDesigner 为纯表单编辑组件（无卡片外壳）
  2. 在对话框中使用 FieldDesigner 替代自定义表格
  3. 好处：代码复用，减少维护成本；支持更复杂的字段配置（如验证规则）

### 扩展 2：拖拽排序
- **当前状态**：使用 ↑↓ 按钮调整子字段顺序
- **优化方向**：
  1. 集成 Sortable.js 或 Vue Draggable 库
  2. 在表格行上添加拖拽手柄（☰ 图标）
  3. 好处：更直观的操作体验，尤其在子字段较多时

### 扩展 3：子字段模板
- **当前状态**：每次添加子字段需逐个配置
- **优化方向**：
  1. 预定义常用对象模板（如"地址"包含"省市区街道"，"联系人"包含"姓名电话邮箱"）
  2. 在对话框顶部添加"从模板导入"按钮
  3. 好处：快速创建标准化结构

---

## 实现时间线（参考）

| 阶段 | 任务 | 预估时间 | 关键产出 |
|------|------|---------|---------|
| **Phase 1** | 数据验证层 | 1h | `validateFormStructure` 增强 |
| **Phase 2** | UI 框架搭建 | 1.5h | 对话框、表格、按钮 |
| **Phase 3** | CRUD 逻辑实现 | 1.5h | 添加、编辑、删除、排序子字段 |
| **Phase 4** | 预览验证 | 1h | FormPreview 渲染测试 |
| **Phase 5** | 样式优化 | 1h | 视觉区分、响应式布局 |
| **Phase 6** | 错误处理 | 0.5h | 边界情况、用户提示 |
| **Phase 7** | 测试与文档 | 1.5h | 功能测试、示例更新 |
| **总计** | | **8h** | 完整功能上线 |
