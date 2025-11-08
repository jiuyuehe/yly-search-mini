# Tasks: migrate-vuewordcloud

## P0 (Core Migration)
1. ✅ Review current TagCloud.vue implementation, API integration, and event contracts
2. Install `vuewordcloud` package via `pnpm add vuewordcloud`
3. Backup current TagCloud.vue as TagCloudLegacy.vue (temporary safety net)
4. Create new TagCloud.vue with VueWordCloud component:
   - Import and register VueWordCloud
   - Add basic template structure (wrapper, toolbar, vue-word-cloud element)
5. Implement data transformation:
   - Computed `words` property: map `store.tagCloud` to `[[text, weight]]` format
   - Filter tags by length (maxTagLength = 32)
6. Implement color mapping:
   - Port existing HSL color function logic to `:color` prop
   - Test gradient from purple to blue based on weight
7. Implement scoped slot template:
   - Render each word with `@click` handler
   - Add `title` attribute for hover tooltip (tag + weight)
   - Emit `tag-click` event with tag text
8. Wire toolbar controls:
   - Refresh button -> `onRefresh()` -> `store.refreshTagCloud()`
   - Loading state indicator
   - Shape selector (optional: keep UI but make no-op or remove entirely)
9. Add empty state: `<el-empty>` when no tags available
10. Expose `handleClick` method via `defineExpose` (for SearchView refs)

## P1 (Cleanup & Integration)
11. Test in SearchView:
    - Load page -> tag cloud renders
    - Click tag -> search triggered
    - Hover tag -> tooltip visible
    - Refresh button -> data reloads
12. Remove advanced panel UI block and related state:
    - `advancedOpen`, `customShapeCode`, `customShapeFn`, `customShapeError`
    - `applyCustomShape`, `resetCustomShape`, `fillSample` functions
    - Advanced panel template section
13. Remove wordcloud2.js integration:
    - Delete `import '../../utils/wordcloud2.js'` line
    - Remove `const WordCloud = window.WordCloud` usage
    - Delete `buildList()`, `renderCloud()`, `scheduleRender()` functions
14. Remove canvas-related code:
    - `cloudCanvas`, `highlightCanvas` refs
    - `clearCanvas`, `drawHighlight`, `clearHighlight` functions
    - ResizeObserver setup and disconnect logic
15. Remove custom shape logic:
    - `normalizeCustomCode` function
    - Shape parsing and validation code
16. Clean up unused utilities:
    - Check if `examplesPresets.js` is only used by TagCloud; if yes, delete file
    - Check if `wordcloud2.js` is only used by TagCloud; if yes, delete file
    - Remove imports from other files if any

## P2 (Validation & Polish)
17. Validate build: `npm run build` passes without wordcloud2.js references
18. Visual regression test: Compare old vs new tag cloud screenshots
19. Performance test: Load 100 tags -> measure render time (<2s target)
20. Bundle size check: Verify wordcloud2.js removed from bundle (check dist size)
21. Update component documentation (optional):
    - Add comment noting VueWordCloud usage
    - Document removed features (custom shapes, advanced panel)
22. Delete TagCloudLegacy.vue backup (if all tests pass)
23. Update PROJECT_SUMMARY.md (optional): Note TagCloud migration to VueWordCloud

## Validation Checklist
- [ ] Build passes: `npm run build` succeeds
- [ ] No console errors when loading SearchView
- [ ] Tag cloud renders with backend data
- [ ] Clicking tag triggers search (SearchView `handleTagClick` called)
- [ ] Hover shows tooltip with tag name and weight
- [ ] Refresh button reloads and re-renders cloud
- [ ] Shape selector (if kept) updates layout or is documented as no-op
- [ ] wordcloud2.js and related files removed from codebase
- [ ] Bundle size reduced (compare before/after)
- [ ] Visual appearance comparable to old implementation (colors, sizes, layout)
