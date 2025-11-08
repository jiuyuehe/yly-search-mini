# Tasks: rewrite-extractions-virtual-table

## P0
1. ✅ Scaffold new `VirtualFormExtractionsDetail.vue` with `el-table-v2` demo, static grouped headers, dummy edit + dirty highlight.
2. ✅ Wire route `/extractions/form/:id` to new component (keep old file temporarily renamed until removal).
3. ✅ Integrate real data load (existing store) and normalization utilities.
4. ✅ Derive columns + grouped headers from structure / flattened keys.
5. ✅ Implement inline editors (text/number/checkbox/date) + dirty tracking.
6. ✅ Add link column `esId` -> navigate `/preview/doc/<esId>?retureBtn=true`.
7. ✅ Add toolbar: refresh, save modified, filter input, sort toggles (createTime asc/desc).
8. ✅ Batch save dirty rows -> API update; success clears dirty; failures remain.

## P1
9. ✅ Optimize header grouping logic (merge cells, placeholder handling).
10. Large dataset simulation loader up to 1000 (if backend <1000, synth expand optionally behind flag for perf test). 
11. Error banner & retry for failed saves.
12. ✅ Remove old HOT detail component & clean imports.
13. ✅ Add el-table-v2 to ExtractionsManager list view with selection, operations, and pagination.

## P2
14. Documentation updates (PROJECT_SUMMARY.md) + README snippet.
15. Add unit utility tests for flatten/unflatten + header builder.
16. Optional: Debounce filter input & highlight matched terms.

Validation:
- ✅ Build passes after removal of HOT component.
- Loading 1000 synthetic rows scrolls smoothly (<100ms scroll hitch baseline).
- ✅ Editing + batch save functions end-to-end.
