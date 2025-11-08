# 代码实现参考

本文档提供关键代码片段参考，帮助快速实施嵌套对象字段功能。

---

## Patch 2: Handsontable 嵌套表头实现

### HTML Demo（用户提供）
参见本文档末尾附录 A。

### Vue 3 集成关键代码

#### 1. 生成嵌套表头
```javascript
// 从表单结构生成嵌套表头（2层或1层）
const nestedHeaders = computed(() => {
  if (!formStructure.value || !formStructure.value.fields) return [[]];

  const fields = formStructure.value.fields;
  const hasObjectFields = fields.some(f => f.type === 'object' && f.fields?.length > 0);

  if (!hasObjectFields) {
    // 无对象字段：单层表头
    return [fields.map(f => f.name)];
  }

  // 有对象字段：2层嵌套表头
  const topHeaders = [];
  const bottomHeaders = [];

  fields.forEach(field => {
    if (field.type === 'object' && field.fields?.length > 0) {
      // 对象字段：顶层合并，底层展开子字段
      topHeaders.push({ label: field.name, colspan: field.fields.length });
      field.fields.forEach(subField => bottomHeaders.push(subField.name));
    } else {
      // 普通字段：顶层和底层名称相同
      topHeaders.push(field.name);
      bottomHeaders.push(field.name);
    }
  });

  return [topHeaders, bottomHeaders];
});
```

#### 2. 数据扁平化为数组行
```javascript
// Handsontable 需要数组格式行数据（与列定义一一对应）
const tableData = computed(() => {
  return items.value.map(item => {
    const flatObj = flattenExtractedData(item.extracted_data || {});
    return columns.value.map(col => flatObj[col.data] || '');
  });
});

function flattenExtractedData(data) {
  const result = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // 嵌套对象：展开为点式路径
      Object.keys(value).forEach(subKey => {
        result[`${key}.${subKey}`] = value[subKey];
      });
    } else {
      result[key] = value;
    }
  });
  return result;
}
```

#### 3. 列定义生成
```javascript
const columns = computed(() => {
  const cols = [];
  formStructure.value.fields.forEach(field => {
    if (field.type === 'object' && field.fields?.length > 0) {
      // 对象字段：为每个子字段创建独立列
      field.fields.forEach(subField => {
        cols.push({
          data: `${field.name}.${subField.name}`,
          type: mapFieldType(subField.type),
          readOnly: false
        });
      });
    } else {
      // 普通字段：直接映射
      cols.push({
        data: field.name,
        type: mapFieldType(field.type),
        readOnly: false
      });
    }
  });
  return cols;
});

function mapFieldType(type) {
  return { text: 'text', number: 'numeric', date: 'date', boolean: 'checkbox' }[type] || 'text';
}
```

#### 4. Handsontable 初始化（onMounted）
```javascript
onMounted(() => {
  if (!hotContainer.value) return;

  hotInstance = new Handsontable(hotContainer.value, {
    data: tableData.value,
    colHeaders: false, // 使用 nestedHeaders
    rowHeaders: true,
    columns: columns.value,
    nestedHeaders: nestedHeaders.value,
    width: '100%',
    height: 500,
    stretchH: 'all',
    licenseKey: 'non-commercial-and-evaluation',
    manualColumnResize: true,
    afterChange: (changes, source) => {
      if (source === 'edit' && changes) {
        console.log('Cell edited:', changes);
      }
    }
  });
});
```

#### 5. 数据回写（保存行）
```javascript
function saveRow(rowIndex) {
  const flatRow = hotInstance.getDataAtRow(rowIndex);
  const reconstructed = unflattenRowData(flatRow, columns.value);
  emit('save-row', { id: items.value[rowIndex].id, data: reconstructed });
}

function unflattenRowData(rowArray, colDefs) {
  const result = {};
  colDefs.forEach((col, idx) => {
    const path = col.data;
    const value = rowArray[idx];
    const keys = path.split('.');
    if (keys.length === 1) {
      result[keys[0]] = value;
    } else {
      // 嵌套对象还原
      if (!result[keys[0]]) result[keys[0]] = {};
      result[keys[0]][keys[1]] = value;
    }
  });
  return result;
}
```

---

## 附录 A: Handsontable 多层表头 HTML Demo

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Handsontable Nested Headers Demo</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/handsontable@12.1.0/dist/handsontable.min.css" />
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 20px; }
    #hot { width: 100%; max-width: 1100px; margin: 0 auto; }
  </style>
</head>
<body>
  <h2>Handsontable — 多层表头示例（nestedHeaders）</h2>
  <div id="hot"></div>
  <script src="https://cdn.jsdelivr.net/npm/handsontable@12.1.0/dist/handsontable.min.js"></script>
  <script>
    const data = [
      ['John', 'Smith', 32, 'Male', 'Engineering', 7000, '2023-03-12'],
      ['Alice', 'Wang', 28, 'Female', 'Product', 6800, '2023-01-30'],
    ];

    const columns = [
      { data: 0, type: 'text' },
      { data: 1, type: 'text' },
      { data: 2, type: 'numeric' },
      { data: 3, type: 'text' },
      { data: 4, type: 'text' },
      { data: 5, type: 'numeric', format: '0,0' },
      { data: 6, type: 'date', dateFormat: 'YYYY-MM-DD' },
    ];

    const nestedHeaders = [
      [
        { label: 'Person Info', colspan: 4 },
        { label: 'Job Info', colspan: 3 }
      ],
      [
        { label: 'Name', colspan: 2 },
        { label: 'Meta', colspan: 2 },
        { label: 'Department', colspan: 1 },
        { label: 'Compensation', colspan: 2 }
      ],
      [
        'First Name', 'Last Name', 'Age', 'Gender',
        'Department', 'Salary', 'Start Date'
      ]
    ];

    const container = document.getElementById('hot');
    const hot = new Handsontable(container, {
      data: data,
      colHeaders: false,
      rowHeaders: true,
      columns: columns,
      nestedHeaders: nestedHeaders,
      width: '100%',
      height: 320,
      stretchH: 'all',
      licenseKey: 'non-commercial-and-evaluation',
      manualColumnResize: true,
      contextMenu: true
    });
  </script>
</body>
</html>
```

---

## Patch 1: 原有核心功能实现

---

## 1. FormDesigner.vue - 对话框状态管理

### 添加响应式状态
```javascript
// 在 <script setup> 中添加
const subFieldDialog = reactive({
  visible: false,
  parentIndex: -1,
  parentField: null
});

// ID 生成器
let subFieldIdCounter = 1;
const generateSubFieldId = () => `sub_${Date.now()}_${subFieldIdCounter++}`;

// 过滤后的类型列表（用于子字段）
const allowedSubFieldTypes = computed(() => 
  fieldTypes.filter(t => !['object', 'array'].includes(t.value))
);
```

### 打开/关闭对话框
```javascript
function openSubFieldDialog(index, field) {
  subFieldDialog.parentIndex = index;
  subFieldDialog.parentField = field;
  
  // 确保 fields 数组存在
  if (!field.fields) {
    field.fields = [];
  }
  
  subFieldDialog.visible = true;
}

function closeSubFieldDialog() {
  subFieldDialog.visible = false;
  subFieldDialog.parentIndex = -1;
  subFieldDialog.parentField = null;
  
  // 可选：显示保存提示
  if (subFieldDialog.parentField?.fields?.length > 0) {
    ElMessage.success(
      `已保存 ${subFieldDialog.parentField.fields.length} 个子字段`
    );
  }
}
```

---

## 2. FormDesigner.vue - 子字段 CRUD 操作

### 添加子字段
```javascript
function addSubField() {
  if (!subFieldDialog.parentField) return;
  
  const newField = {
    id: generateSubFieldId(),
    name: `子字段${(subFieldDialog.parentField.fields?.length || 0) + 1}`,
    type: 'text',
    example: '',
    required: false
  };
  
  if (!subFieldDialog.parentField.fields) {
    subFieldDialog.parentField.fields = [];
  }
  
  subFieldDialog.parentField.fields.push(newField);
}
```

### 更新子字段
```javascript
function updateSubField(index, updatedField) {
  if (!subFieldDialog.parentField?.fields) return;
  if (index < 0 || index >= subFieldDialog.parentField.fields.length) return;
  
  // Vue 3 响应式更新
  subFieldDialog.parentField.fields[index] = { ...updatedField };
}
```

### 删除子字段
```javascript
async function deleteSubField(index) {
  if (!subFieldDialog.parentField?.fields) return;
  
  try {
    await ElMessageBox.confirm(
      '确定删除该子字段吗？此操作无法撤销。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    subFieldDialog.parentField.fields.splice(index, 1);
    ElMessage.success('子字段已删除');
  } catch {
    // 用户取消
  }
}
```

### 移动子字段
```javascript
function moveSubFieldUp(index) {
  if (!subFieldDialog.parentField?.fields) return;
  if (index <= 0) return;
  
  const fields = subFieldDialog.parentField.fields;
  const temp = fields[index];
  fields[index] = fields[index - 1];
  fields[index - 1] = temp;
}

function moveSubFieldDown(index) {
  if (!subFieldDialog.parentField?.fields) return;
  const fields = subFieldDialog.parentField.fields;
  if (index >= fields.length - 1) return;
  
  const temp = fields[index];
  fields[index] = fields[index + 1];
  fields[index + 1] = temp;
}
```

---

## 3. FormDesigner.vue - 对话框模板

### 在 `<template>` 中添加对话框
```vue
<!-- 子字段编辑对话框 -->
<el-dialog
  v-model="subFieldDialog.visible"
  :title="`管理子字段：${subFieldDialog.parentField?.name || ''}`"
  width="70%"
  :close-on-click-modal="false"
  @close="closeSubFieldDialog"
>
  <div class="sub-field-dialog-content">
    <!-- 工具栏 -->
    <div class="sub-field-toolbar">
      <el-button type="primary" icon="Plus" @click="addSubField">
        添加子字段
      </el-button>
      <div class="field-count">
        共 {{ subFieldDialog.parentField?.fields?.length || 0 }} 个子字段
      </div>
    </div>
    
    <!-- 子字段表格 -->
    <el-table
      :data="subFieldDialog.parentField?.fields || []"
      border
      stripe
      class="sub-field-table"
      empty-text="暂无子字段，点击上方按钮添加"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      
      <el-table-column label="字段名称" min-width="150">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.name"
            placeholder="字段名称"
            size="small"
            @input="updateSubField($index, row)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="字段类型" width="140">
        <template #default="{ row, $index }">
          <el-select
            v-model="row.type"
            placeholder="类型"
            size="small"
            @change="updateSubField($index, row)"
          >
            <el-option
              v-for="type in allowedSubFieldTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </template>
      </el-table-column>
      
      <el-table-column label="必填" width="80" align="center">
        <template #default="{ row, $index }">
          <el-switch
            v-model="row.required"
            size="small"
            @change="updateSubField($index, row)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="示例值" min-width="180">
        <template #default="{ row, $index }">
          <el-input
            v-if="row.type === 'text'"
            v-model="row.example"
            placeholder="示例文本"
            size="small"
            @input="updateSubField($index, row)"
          />
          <el-input-number
            v-else-if="row.type === 'number'"
            v-model="row.example"
            placeholder="示例数字"
            size="small"
            @change="updateSubField($index, row)"
            style="width: 100%"
          />
          <el-date-picker
            v-else-if="row.type === 'date'"
            v-model="row.example"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="small"
            @change="updateSubField($index, row)"
            style="width: 100%"
          />
          <el-switch
            v-else-if="row.type === 'boolean'"
            v-model="row.example"
            size="small"
            @change="updateSubField($index, row)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="140" align="center" fixed="right">
        <template #default="{ $index }">
          <el-button
            size="small"
            :icon="ArrowUp"
            @click="moveSubFieldUp($index)"
            :disabled="$index === 0"
            circle
          />
          <el-button
            size="small"
            :icon="ArrowDown"
            @click="moveSubFieldDown($index)"
            :disabled="$index >= (subFieldDialog.parentField?.fields?.length || 0) - 1"
            circle
          />
          <el-button
            size="small"
            type="danger"
            :icon="Delete"
            @click="deleteSubField($index)"
            circle
          />
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 提示信息 -->
    <el-alert
      class="sub-field-tip"
      type="info"
      :closable="false"
      show-icon
    >
      <template #title>
        提示：对象的子字段仅支持简单类型（文本、数字、日期、布尔值），不支持嵌套对象或数组。
      </template>
    </el-alert>
  </div>
  
  <template #footer>
    <el-button @click="closeSubFieldDialog">关闭</el-button>
  </template>
</el-dialog>
```

### 在顶层表格操作列中添加按钮
```vue
<el-table-column label="操作" width="180" align="center" fixed="right">
  <template #default="{ row, $index }">
    <!-- 现有按钮：上移、下移、删除 -->
    <el-button ... />
    <el-button ... />
    <el-button ... />
    
    <!-- 新增：管理子字段按钮（仅对 object 类型显示） -->
    <el-button
      v-if="row.type === 'object'"
      size="small"
      type="primary"
      icon="Setting"
      @click.stop="openSubFieldDialog($index, row)"
      title="管理子字段"
      circle
    />
  </template>
</el-table-column>
```

---

## 4. stores/forms.js - 验证逻辑增强

### 更新 `validateFormStructure` 方法
```javascript
validateFormStructure(structure) {
  const errors = [];
  
  if (!structure || !structure.fields || !Array.isArray(structure.fields)) {
    errors.push('表单结构无效：缺少 fields 数组');
    return errors;
  }
  
  // 检查字段名重复（顶层）
  const topLevelNames = structure.fields.map(f => f.name);
  const topDuplicates = topLevelNames.filter(
    (name, idx) => topLevelNames.indexOf(name) !== idx
  );
  if (topDuplicates.length > 0) {
    errors.push(
      `存在重复的字段名称: ${[...new Set(topDuplicates)].join(', ')}`
    );
  }
  
  structure.fields.forEach((field, index) => {
    // 基础验证
    if (!field.name || !field.name.trim()) {
      errors.push(`字段 ${index + 1}: 缺少字段名称`);
    }
    if (!field.type) {
      errors.push(`字段 "${field.name || index + 1}": 缺少字段类型`);
    }
    
    // 对象字段嵌套验证
    if (field.type === 'object') {
      // 自动修复：初始化 fields 数组
      if (!field.fields || !Array.isArray(field.fields)) {
        field.fields = [];
      }
      
      // 检查子字段
      field.fields.forEach((subField, subIndex) => {
        // 子字段名称验证
        if (!subField.name || !subField.name.trim()) {
          errors.push(
            `对象字段 "${field.name}" 的子字段 ${subIndex + 1}: 缺少字段名称`
          );
        }
        
        // 子字段类型验证
        if (!subField.type) {
          errors.push(
            `对象字段 "${field.name}" 的子字段 "${subField.name || subIndex + 1}": 缺少字段类型`
          );
        }
        
        // 禁止二层嵌套（关键验证）
        if (['object', 'array'].includes(subField.type)) {
          errors.push(
            `对象字段 "${field.name}" 的子字段 "${subField.name}": 不支持 ${subField.type} 类型（仅支持简单类型：text, number, date, boolean）`
          );
        }
      });
      
      // 检查子字段名称重复
      const subFieldNames = field.fields.map(f => f.name).filter(Boolean);
      const subDuplicates = subFieldNames.filter(
        (name, idx) => subFieldNames.indexOf(name) !== idx
      );
      if (subDuplicates.length > 0) {
        errors.push(
          `对象字段 "${field.name}" 存在重复的子字段名称: ${[...new Set(subDuplicates)].join(', ')}`
        );
      }
    }
    
    // 数组字段验证（如果 itemType 为 object，也需检查）
    if (field.type === 'array' && field.itemType === 'object') {
      if (!field.fields || !Array.isArray(field.fields)) {
        field.fields = [];
      }
      
      // 数组元素对象的子字段也不能嵌套
      field.fields.forEach((subField, subIndex) => {
        if (['object', 'array'].includes(subField.type)) {
          errors.push(
            `数组字段 "${field.name}" 的元素字段 "${subField.name}": 不支持 ${subField.type} 类型`
          );
        }
      });
    }
  });
  
  return errors;
}
```

---

## 5. 样式参考（`<style scoped>`）

### 对话框内容样式
```css
.sub-field-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sub-field-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 2px solid var(--border-color);
}

.field-count {
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
  font-weight: 500;
}

.sub-field-table {
  border-radius: var(--border-radius-md);
}

.sub-field-table :deep(.el-table__header) {
  background: var(--background-color-light);
}

.sub-field-table :deep(.el-table__header th) {
  background: var(--background-color-light);
  color: var(--text-color-primary);
  font-weight: 600;
}

.sub-field-table :deep(.el-table__row:hover) {
  background: var(--background-info-pale);
}

.sub-field-tip {
  margin-top: 8px;
}
```

### 顶层表格中对象字段的视觉区分
```css
/* 在 fields-table 样式后添加 */
.fields-table :deep(.el-table__row) {
  position: relative;
}

/* 为 object 类型字段添加左侧边框标识 */
.fields-table :deep(.el-table__row[data-field-type="object"]) {
  border-left: 4px solid var(--primary-color);
  background-color: rgba(var(--primary-color-rgb), 0.02);
}

/* 或在模板中动态添加 class */
/* <el-table :row-class-name="rowClassName"> */
```

### 示例值列显示子字段数量提示
```vue
<!-- 在顶层表格的示例值列中 -->
<el-table-column label="示例值" min-width="180">
  <template #default="{ row, $index }">
    <!-- 现有输入组件 -->
    
    <!-- object 类型显示子字段数量 -->
    <div v-if="row.type === 'object'" class="object-field-hint">
      <el-tag type="info" size="small">
        {{ row.fields?.length || 0 }} 个子字段
      </el-tag>
    </div>
    
    <!-- array with object 类型也可显示 -->
    <div v-else-if="row.type === 'array' && row.itemType === 'object'" class="object-field-hint">
      <el-tag type="info" size="small">
        数组元素包含 {{ row.fields?.length || 0 }} 个字段
      </el-tag>
    </div>
  </template>
</el-table-column>
```

```css
.object-field-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}
```

---

## 6. 更新 `loadSample()` 方法

### 添加对象字段示例
```javascript
function loadSample() {
  ElMessageBox.confirm(
    '加载示例将覆盖当前设计，是否继续？',
    '确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const sample = {
      formName: '合同信息表单',
      fields: [
        {
          id: generateFieldId(),
          name: 'contractInfo',
          type: 'object',
          required: true,
          fields: [
            {
              id: generateSubFieldId(),
              name: 'partyA',
              type: 'text',
              example: '甲方公司名称',
              required: true
            },
            {
              id: generateSubFieldId(),
              name: 'partyB',
              type: 'text',
              example: '乙方公司名称',
              required: true
            },
            {
              id: generateSubFieldId(),
              name: 'amount',
              type: 'number',
              example: 100000,
              required: true
            },
            {
              id: generateSubFieldId(),
              name: 'signDate',
              type: 'date',
              example: '2025-11-06',
              required: true
            },
            {
              id: generateSubFieldId(),
              name: 'isEffective',
              type: 'boolean',
              example: true,
              required: false
            }
          ]
        },
        {
          id: generateFieldId(),
          name: 'contractNumber',
          type: 'text',
          example: 'CONTRACT-2025-001',
          required: true
        },
        {
          id: generateFieldId(),
          name: 'effectiveDate',
          type: 'date',
          example: '2025-01-01',
          required: false
        }
      ]
    };
    
    formData.name = sample.formName;
    formData.structure = { ...sample };
    
    ElMessage.success('示例表单已加载（包含嵌套对象字段）');
  }).catch(() => {
    // User cancelled
  });
}
```

---

## 7. 测试用例参考

### 功能测试脚本
```javascript
// 测试用例 1：添加对象字段并管理子字段
describe('嵌套对象字段功能', () => {
  it('应该能为 object 字段添加子字段', async () => {
    // 1. 创建 object 字段
    addField(); // 添加顶层字段
    const objectField = formData.structure.fields[0];
    objectField.type = 'object';
    objectField.name = 'testObject';
    
    // 2. 打开子字段对话框
    openSubFieldDialog(0, objectField);
    expect(subFieldDialog.visible).toBe(true);
    
    // 3. 添加子字段
    addSubField();
    expect(objectField.fields.length).toBe(1);
    expect(objectField.fields[0].type).toBe('text');
    
    // 4. 修改子字段
    objectField.fields[0].name = 'subField1';
    objectField.fields[0].type = 'number';
    updateSubField(0, objectField.fields[0]);
    
    // 5. 关闭对话框
    closeSubFieldDialog();
    expect(subFieldDialog.visible).toBe(false);
    
    // 6. 验证数据持久化
    expect(formData.structure.fields[0].fields[0].name).toBe('subField1');
  });
  
  it('应该阻止子字段类型为 object', () => {
    // 验证类型选择器过滤
    const types = allowedSubFieldTypes.value;
    expect(types.find(t => t.value === 'object')).toBeUndefined();
    expect(types.find(t => t.value === 'array')).toBeUndefined();
  });
  
  it('应该在验证时拒绝非法嵌套', () => {
    // 构造非法数据
    const badStructure = {
      fields: [
        {
          name: 'level1',
          type: 'object',
          fields: [
            {
              name: 'level2',
              type: 'object', // 非法：二层嵌套
              fields: []
            }
          ]
        }
      ]
    };
    
    const errors = formsStore.validateFormStructure(badStructure);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('不支持 object 类型');
  });
});
```

---

## 8. 调试技巧

### 控制台日志
```javascript
// 在关键方法中添加调试日志
function openSubFieldDialog(index, field) {
  console.log('[SubField] Opening dialog for field:', {
    index,
    fieldName: field.name,
    existingSubFields: field.fields?.length || 0
  });
  // ... 实现
}

function addSubField() {
  console.log('[SubField] Adding sub-field to:', subFieldDialog.parentField?.name);
  // ... 实现
  console.log('[SubField] Total sub-fields now:', subFieldDialog.parentField?.fields?.length);
}
```

### Vue DevTools 检查
- 查看 `formData.structure.fields` 的响应式变化
- 监控 `subFieldDialog.visible` 状态
- 检查 `subFieldDialog.parentField.fields` 数组更新

### 常见问题排查
1. **对话框打开但表格为空**: 检查 `parentField.fields` 是否正确初始化
2. **子字段修改不生效**: 确认 `updateSubField` 使用了响应式更新（展开运算符或 Vue.set）
3. **关闭对话框后数据丢失**: 验证 `parentField` 是否引用了 `formData` 中的对象（而非深拷贝）
4. **类型选择器仍显示 object**: 检查 `allowedSubFieldTypes` computed 是否正确过滤

---

**使用建议**: 复制相关代码片段到项目中时，请根据实际项目的命名规范和代码风格进行调整。
