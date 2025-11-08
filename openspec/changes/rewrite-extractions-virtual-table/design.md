# Design: rewrite-extractions-virtual-table

## Data Model
Backend extraction item shape:
```
{
  id,
  formId,
  esId,
  createTime,
  fields: { key: value | key: [ {subKey: subValue} ] | key: [JSON-string] }
}
```
Normalization uses existing `toUnifiedFields` + `flatten` producing dot paths for object/array-of-object fields.

## Column Derivation
1. Collect flattened keys from sample N rows (first fetch).
2. Map types using form structure: number -> numeric input; boolean -> checkbox; date -> date picker; default -> text.
3. Add synthetic columns: `esId` (link), action column (buttons), and metadata (createTime).

## Grouped Headers Generation
- Up to 3 header rows: Top-level objects grouped by their child count; second row lists child names; third row leaf placeholders (or merges cells when only two levels needed).
- Utility: `buildGroupedHeaders(structure, flatKeys)` returns `[{cellsRow1},{cellsRow2},{cellsRow3}]` with placeholder markers for non-grouped columns.

## Inline Editing
- Editable if column type != metadata/link/action.
- Use cell slot to render:
  - text: `<el-input v-model="row[column.dataKey]" />`
  - number: `<el-input-number v-model="row[column.dataKey]" />`
  - boolean: `<el-checkbox v-model="row[column.dataKey]" />`
  - date: `<el-date-picker v-model="row[column.dataKey]" type="date" value-format="YYYY-MM-DD" />`
- Dirty tracking: if originalRowValue !== currentValue mark row.__dirty = true; highlight background.

## Batch Save
- Toolbar button "保存修改 (X)" collects dirty rows -> reconstruct nested object via `unflatten` -> call update API sequentially or batched.
- Error handling: gather failures; show dismissible alert; retain dirty state for failed ones.

## Sorting & Filtering
- Sorting: client initial (createTime desc) with toolbar controls; optional server param in later iteration.
- Filtering: text input performing simple includes() across flattened values; recompute displayed data array.

## Performance
- Avoid recomputing columns on each edit by caching derived columns & header groups.
- Use fixed column widths to minimize layout thrash.

## Removal Plan (Handsontable)
- Delete `FormExtractionsDetailView.vue`.
- Remove any HOT-specific imports in other files (if referenced).
- Retain sandbox `/lab/hot` only if still useful; if not required, also remove per scope (explicit removal only of detail route).

## Future Extensions
- Server-side pagination for >1000.
- Column resize persistence.
- Per-column filters (type-aware).
