# Tasks: Handsontable Extraction Suite

## P0
1. Create `/lab/hot` view with Handsontable demos (nestedHeaders, async load, inline edit-save, custom theme). (DONE)
2. Create `/extractions` cards view: load `/rag/admin-api/rag/ai/form/page?pageNo=1&pageSize=100`, render cards with name and key fields preview; click navigates to detail. (DONE - initial scaffold)
3. Create `/extractions/form/:id` detail view: load form structure (structure JSON) + results list API; render HOT with nestedHeaders by structure; support inline edit and save. (DONE - scaffold & basic inline save; needs array-of-object fields flatten from backend 'fields')

## P1
4. Data normalization: structure vs structureResult mapping; arrays of objects flattening; numeric/date/checkbox types mapping. (IN PROGRESS - shared utils introduced)
5. UX polish: modified cell highlight, sticky headers, zebra striping, compact paddings.

## P2
6. Pagination & server-side loading in detail grid; debounce save; error banners.
7. Docs: update PROJECT_SUMMARY.md; add README hints in views.

Validation:
- openspec validate handsontable-extraction-suite --strict passes (PENDING)
- Build succeeds; navigating to new routes renders. (PARTIAL - manual build done for previous changes, need re-run)
