# Spec Delta: handsontable-extraction-suite

## ADDED: handsontable-extraction-suite
MUST: Provide a HOT playground route `/lab/hot` with nested headers, async load simulation, inline edits marking, and bulk save.
MUST: Replace `/extractions` list view with form cards enabling navigation to `/extractions/form/:id`.
MUST: Implement per-form HOT detail view with nested headers built from structure/structureResult, inline edit + save, and error/loading states.
SHOULD: Highlight modified rows until save confirmation.
SHOULD: Support numeric/date/checkbox cell types based on field metadata.
COULD: Debounce saves and batch API calls to reduce load.

## ADDED: normalization-enhancements
MUST: Unify structure vs structureResult resolution logic.
MUST: Flatten arrays of objects for column generation; record count.
MUST: Provide shared flatten/unflatten utility for reuse by playground and detail view.
SHOULD: Map field types to HOT column `type` (numeric, date, checkbox) when possible.
COULD: Provide extension point for custom renderers.

## ADDED: ux-polish
MUST: Sticky nested header row in detail view.
MUST: Card grid responsive layout for `/extractions` (min 280px width cards).
SHOULD: Zebra striping and hover highlight in HOT detail grid.
COULD: Inline validation warnings for required fields.

## ADDED: pagination-saving
MUST: Implement server-side pagination for extraction histories in detail view.
MUST: Debounce row save operations (configurable delay). 
SHOULD: Show error banner with retry on failed saves.
COULD: Batch save multiple edited rows in one request.
