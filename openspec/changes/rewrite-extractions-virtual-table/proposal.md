# Change Proposal: rewrite-extractions-virtual-table

## Summary
Replace the current Handsontable-based `extractions-form-detail` page with Element Plus `el-table-v2` (virtualized table) to support large dataset (up to 1000 rows) efficient rendering, grouped headers, inline editing, navigation links, server-side sorting, and filtering.

## Motivation
- Performance: Need virtualization for 1000-row scenarios; Handsontable overhead is unnecessary for required features.
- UX Alignment: Element Plus integration keeps design system consistent.
- Extensibility: `el-table-v2` slot-driven grouped header and custom cell renders enable future expansion (multi-row grouping, operations column, status indicators).

## Scope
In scope:
- New view/component to replace `FormExtractionsDetailView.vue` (Handsontable version removed).
- Virtual table with:
  - Async loading (initial page + subsequent fetch for full up to 1000 rows).
  - Multi-row grouped headers (3 header rows sample: group + subgroup + leaf).
  - Inline edit cells (text, number, date, boolean) with optimistic local state & batch save.
  - Link column to preview document via `esId`.
  - Sort (time, id) & filter (keyword on flattened field values) interactions.
  - Row action demo buttons (e.g., 查看, 编辑, 删除 - wired minimally).
- Data normalization reuses existing flatten utilities.
- Remove all Handsontable imports, CSS, and components for this route.

Out of scope (future):
- Advanced validation rules; column drag reorder persistence; multi-form compare view.

## Success Criteria
- Loading 1000 rows under 2s (local dev) with smooth scroll.
- Edit a cell -> visual dirty state; Save button flushes changes via API; error shows banner, preserves unsaved states.
- Grouped headers visually distinct with custom slot logic (sample grouping logic documented).
- Link column navigates to `/preview/doc/<esId>?retureBtn=true`.
- All HOT code for detail route removed.

## Risks & Mitigations
- Large render jitter: Use fixed widths & memoized cell renderers.
- Batch save conflicts: Identify rows by id; if backend partial failure, show error list & keep failed rows dirty.
- Grouped headers complexity: Provide utility to derive header rows from form structure with fallback.

## Dependencies
- Existing APIs for extraction histories & update operations remain unchanged.
- `formsStore` for form meta; `extractionsStore` for history loading & update.

## High-Level Approach
1. Scaffold new component `VirtualFormExtractionsDetail.vue` with example grouped headers & demo data.
2. Integrate real data & adapt flatten logic for columns.
3. Add inline editors via conditional cell slot: input/checkbox/date picker.
4. Implement dirty tracking + batch save.
5. Add sorting and filtering controls (toolbar).
6. Remove old HOT detail view + references.
7. Final polish & documentation.

## Validation Plan
- Manual test: load form with 2 sample rows & synthetic expansion to 1000 rows.
- Performance check: console timing for render.
- Spec validation: all ADDED requirements covered.
