# Design: rewrite-extractions-virtual-table (Archived)

(Archived copy)

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
Editable types render appropriate Element Plus component; dirty tracking via row.__dirty.

## Batch Save
Collect dirty rows, reconstruct nested object with unflatten, persist sequentially.

## Sorting & Filtering
Client-side initial implementation: sort by createTime/id, filter keyword across flattened values.

## Performance
Virtualized rows; fixed column widths.

## Removal Plan (Handsontable)
Deleted legacy HOT-based component.

## Future Extensions
Server-side pagination, column resize persistence, per-column filters.
