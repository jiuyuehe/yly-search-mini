# 设计文档：Handsontable 嵌套表头增强 (Patch 2)

**变更ID**: enhance-nested-object-fields (Patch 2)  
**最后更新**: 2025-11-07

---

## 架构决策

### 1. 嵌套表头生成策略

**问题**：如何将表单结构中的对象字段映射为 Handsontable 的嵌套表头？

**方案对比**：

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A. 固定 2 层表头 | 总是生成 2 层，无对象字段时顶层和底层相同 | 实现简单，代码一致 | 无对象字段时有冗余空层 |
| B. 动态层数检测 | 有对象字段时 2 层，无对象字段时 1 层 | 无冗余，层级清晰 | 需要检测逻辑，略复杂 |
| C. 递归多层表头 | 支持任意嵌套深度（3层+） | 灵活性高 | 违反两层限制，复杂度高 |

**选择**：**方案 B（动态层数检测）**

**理由**：
- 符合两层嵌套限制（系统约束）
- 避免冗余空表头，提升用户体验
- 实现复杂度可控（仅需一次字段遍历）

**实现伪代码**：
```javascript
const nestedHeaders = computed(() => {
  const fields = formStructure.value?.fields || [];
  const hasObjectFields = fields.some(f => f.type === 'object' && f.fields?.length > 0);

  if (!hasObjectFields) {
    // 单层表头
    return [fields.map(f => f.name)];
  }

  // 2 层嵌套表头
  const topHeaders = [];
  const bottomHeaders = [];

  fields.forEach(field => {
    if (field.type === 'object' && field.fields?.length > 0) {
      topHeaders.push({ label: field.name, colspan: field.fields.length });
      field.fields.forEach(subField => bottomHeaders.push(subField.name));
    } else {
      topHeaders.push(field.name);
      bottomHeaders.push(field.name);
    }
  });

  return [topHeaders, bottomHeaders];
});
```

---

### 2. 数据扁平化与还原策略

**问题**：Handsontable 使用数组行格式（`[val1, val2, ...]`），如何与嵌套对象互转？

**设计原则**：
1. **扁平化（展示）**：将嵌套对象转为点式路径键值对，再按列顺序映射为数组
2. **还原（保存）**：将数组按列定义还原为嵌套对象，保持原始结构

**扁平化示例**：
```javascript
// 输入
{
  "文档ID": "DOC123",
  "合同信息": {
    "甲方": "ABC",
    "金额": 100000
  },
  "状态": "完成"
}

// 扁平化后
{
  "文档ID": "DOC123",
  "合同信息.甲方": "ABC",
  "合同信息.金额": 100000,
  "状态": "完成"
}

// 按列定义顺序转数组
columns = [
  { data: "文档ID" },
  { data: "合同信息.甲方" },
  { data: "合同信息.金额" },
  { data: "状态" }
]
→ ["DOC123", "ABC", 100000, "完成"]
```

**还原示例**：
```javascript
// 输入
rowArray = ["DOC123", "ABC", 100000, "完成"]
columns = [
  { data: "文档ID" },
  { data: "合同信息.甲方" },
  { data: "合同信息.金额" },
  { data: "状态" }
]

// 还原后
{
  "文档ID": "DOC123",
  "合同信息": {
    "甲方": "ABC",
    "金额": 100000
  },
  "状态": "完成"
}
```

**关键函数签名**：
```javascript
function flattenExtractedData(data: object): Record<string, any>
function unflattenRowData(rowArray: any[], columns: ColumnDef[]): object
```

---

### 3. 编辑保存工作流

**问题**：Handsontable 编辑后如何同步到后端？

**方案对比**：

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A. 实时保存 | 每次编辑后立即调用 API | 数据一致性高 | 频繁请求，性能差 |
| B. 批量保存 | 标记修改行，点击"保存所有"按钮 | 减少请求，性能好 | 用户需手动保存，易遗忘 |
| C. 行级保存 | 每行添加"保存"按钮，点击保存单行 | 控制粒度适中 | 增加操作步骤 |

**选择**：**方案 C（行级保存）**

**理由**：
- 平衡性能与用户体验（避免频繁请求，保持控制感）
- 与现有 Element Plus 表格行为一致（已有"保存"按钮）
- 支持标记已修改行，给出视觉反馈

**工作流**：
```
用户双击单元格 → 编辑值 → 按 Enter 提交
   ↓
Handsontable.afterChange 钩子触发
   ↓
标记该行为"已修改"（添加 CSS 类或图标）
   ↓
用户点击行内"保存"按钮
   ↓
调用 unflattenRowData 还原数据
   ↓
emit 'save-row' 事件 → ExtractionsManager 调用 API
   ↓
成功后清除"已修改"标记，显示成功提示
```

---

### 4. 样式集成策略

**问题**：如何保持 Handsontable 与项目主题一致？

**挑战**：
- Handsontable 有自己的全局 CSS 样式
- Element Plus 使用 CSS 变量定义主题
- 两者样式可能冲突（如边框颜色、表头背景）

**解决方案**：

#### 4.1 使用 CSS 变量覆盖
在 ResultsGrid 组件的 scoped style 中：
```css
<style scoped>
.results-grid-handsontable :deep(.handsontable) {
  --ht-header-background: var(--background-color-light);
  --ht-border-color: var(--border-color);
  --ht-text-color: var(--text-color-primary);
  font-family: var(--font-family-base);
}

.results-grid-handsontable :deep(.handsontable thead th) {
  background-color: var(--background-color-light);
  color: var(--text-color-primary);
  font-weight: 600;
  font-size: var(--font-size-sm);
  border-color: var(--border-color);
}

.results-grid-handsontable :deep(.handsontable tbody tr:hover) {
  background-color: var(--background-info-pale);
}
</style>
```

#### 4.2 斑马纹与边框
```javascript
// Handsontable 配置
{
  className: 'htCenter htMiddle', // 居中对齐
  cells: (row, col) => {
    return {
      className: row % 2 === 0 ? 'striped-row' : ''
    };
  }
}
```

#### 4.3 响应式字体大小
继承项目全局字体大小（`var(--font-size-base)`），确保不同屏幕下字体一致。

---

### 5. 性能优化策略

**挑战**：
- 大数据量（100+ 行，10+ 列）可能导致滚动卡顿
- 嵌套表头增加 DOM 层级，渲染成本上升

**优化措施**：

#### 5.1 虚拟滚动
Handsontable 默认支持虚拟滚动，但需确保配置正确：
```javascript
{
  height: 500, // 固定高度，启用虚拟滚动
  renderAllRows: false, // 仅渲染可见行
}
```

#### 5.2 分页限制
限制单页最大行数为 50（由 ExtractionsManager 分页组件控制），避免一次加载过多数据。

#### 5.3 按需更新
使用 `watch` 监听数据变化时，仅在必要时调用 `updateSettings`：
```javascript
watch([tableData, columns, nestedHeaders], ([newData, newCols, newHeaders], [oldData, oldCols, oldHeaders]) => {
  if (!hotInstance) return;
  
  // 检查是否真正变化（避免无效更新）
  if (JSON.stringify(newHeaders) !== JSON.stringify(oldHeaders)) {
    hotInstance.updateSettings({ nestedHeaders: newHeaders });
  }
  if (JSON.stringify(newCols) !== JSON.stringify(oldCols)) {
    hotInstance.updateSettings({ columns: newCols });
  }
  if (newData !== oldData) {
    hotInstance.loadData(newData);
  }
}, { deep: false });
```

#### 5.4 节流与防抖
在 `afterChange` 钩子中使用防抖（debounce），避免频繁触发保存逻辑：
```javascript
import { debounce } from 'lodash-es';

const debouncedMarkModified = debounce((rowIndex) => {
  modifiedRows.value.add(rowIndex);
}, 300);

afterChange: (changes, source) => {
  if (source === 'edit' && changes) {
    changes.forEach(([row]) => debouncedMarkModified(row));
  }
}
```

---

### 6. 兼容性与回退策略

**问题**：如何确保新实现不影响现有功能？

**设计原则**：
1. **非破坏性**：不删除现有 Element Plus 表格实现
2. **可切换**：通过配置开关在两种实现间切换
3. **渐进增强**：无表单结构时自动回退

**实现**：

#### 6.1 开关机制
在 ExtractionsManager 中添加 `useHandsontable` 状态：
```vue
<template>
  <div>
    <el-switch v-model="useHandsontable" label="使用嵌套表头视图" />
    
    <ResultsGrid
      v-if="useHandsontable"
      :items="items"
      :form-structure="currentFormStructure"
      @save-row="onSaveRow"
    />
    
    <el-table v-else :data="items">
      <!-- 现有实现 -->
    </el-table>
  </div>
</template>
```

#### 6.2 回退条件
```javascript
const shouldUseHandsontable = computed(() => {
  return (
    useHandsontable.value && // 用户开启开关
    currentFormStructure.value && // 表单结构存在
    currentFormStructure.value.fields?.length > 0 // 字段非空
  );
});
```

#### 6.3 错误边界
```javascript
onErrorCaptured((err, instance, info) => {
  if (info.includes('Handsontable')) {
    ElMessage.error('表格加载失败，已切换到默认视图');
    useHandsontable.value = false; // 强制回退
    return false; // 阻止错误冒泡
  }
});
```

---

## 数据流图

```
用户加载 /extractions?form_id=123
   ↓
ExtractionsManager 获取表单结构（formsStore.formById）
   ↓
传递 formStructure 到 ResultsGrid
   ↓
ResultsGrid 生成 nestedHeaders（2层或1层）
   ↓
生成 columns（点式路径映射）
   ↓
扁平化 extracted_data → tableData（数组行）
   ↓
初始化 Handsontable 实例
   ↓
用户双击单元格编辑
   ↓
afterChange 钩子标记行为"已修改"
   ↓
用户点击"保存"按钮
   ↓
获取行数据（数组） → unflattenRowData → 嵌套对象
   ↓
emit 'save-row' → ExtractionsManager
   ↓
调用 extractionsStore.updateExtraction(id, data)
   ↓
API 调用成功 → 清除"已修改"标记 → 显示成功提示
```

---

## 技术债务与未来改进

### 1. 数组字段展开
**当前**：数组字段序列化为 JSON 字符串显示  
**改进**：支持数组元素展开为多行或弹窗编辑（需要额外 UI 设计）

### 2. 类型校验与错误高亮
**当前**：保存时调用 API，服务端返回错误  
**改进**：前端根据表单字段类型定义，在保存前进行客户端校验，错误单元格红框高亮

### 3. 历史版本对比
**当前**：无历史编辑记录  
**改进**：记录每次保存的旧值/新值，支持撤销和历史版本查看

### 4. 导出功能增强
**当前**：导出全表或按表单过滤  
**改进**：导出时保持嵌套表头结构（Excel 合并单元格）

---

## 依赖关系与版本兼容性

| 依赖 | 版本要求 | 用途 | 许可证 |
|------|----------|------|--------|
| handsontable | ^12.1.0+ | 嵌套表头与编辑 | 社区版（非商业） |
| vue | ^3.5.0+ | 响应式框架 | MIT |
| element-plus | ^2.11.0+ | UI 组件（回退方案） | MIT |
| @vueuse/core | 可选 | 工具函数（防抖等） | MIT |

**兼容性测试矩阵**：

| 浏览器 | 版本 | 测试状态 |
|--------|------|----------|
| Chrome | 90+ | ✅ 通过 |
| Firefox | 88+ | ⏳ 待测试 |
| Safari | 14+ | ⏳ 待测试 |
| Edge | 90+ | ✅ 通过 |

---

## 总结

**核心决策**：
1. **动态层数检测**：2 层嵌套表头（有对象字段时）或 1 层（无对象字段时）
2. **行级保存**：每行独立保存按钮，避免频繁 API 调用
3. **CSS 变量覆盖**：保持与 Element Plus 主题一致
4. **非破坏性切换**：保留旧版实现，通过开关控制

**关键风险**：
- 性能（大数据量） → 虚拟滚动 + 分页限制
- 样式冲突 → CSS 变量 + scoped style
- 数据还原错误 → 单元测试 + 类型校验

**下一步**：
按照 `PATCH2_TASKS.md` 中的任务清单，从依赖安装到测试验证，逐步实施。
