# Design: Handsontable Extraction Suite

## Overview
Implement a Handsontable (HOT) playground and redesign extractions UX into card landing + per-form HOT detail, leveraging existing normalization and nested headers logic.

## Components & Routes
- Route `/lab/hot` (`HotLabView.vue`): isolated demo of nested headers, inline edit tracking, async load simulation, save payload reconstruction (dot notation -> nested object).
- Route `/extractions` (Cards View TBD): replaces direct table; lists forms with summary stats and key fields snapshot.
- Route `/extractions/form/:id` (Detail HOT View TBD): focuses on one form's extraction histories with full-feature HOT (nestedHeaders, pagination, edit/save, modified styling).

## Data Flow
1. Forms list from `/rag/admin-api/rag/ai/form/page` (pageNo=1&pageSize=N) -> cards.
2. Detail view fetches form structure (structure or structureResult) and extraction history list (existing API). Normalization reuses `ResultsGrid.vue` flatten/unflatten patterns; may extract into a shared utility module `src/utils/flatten.js` for reuse.
3. Save operations emit payload of updated rows; perform batch API calls or single endpoint (TBD based on existing save API in store/service).

## Normalization Enhancements
- Unify detection: prefer `structureResult` if present else `structure`.
- Arrays of objects: flatten first element for columns; maintain count in `__count` for potential later expansion control.
- Type mapping: numeric/date/checkbox derived from field definitions; fallback to text.

## UX & Styling
- Modified rows highlight (soft amber) until save confirmed.
- Sticky top nested header row; scroll body.
- Card layout: responsive grid (minmax 280px) with key metadata (form name, field count, updatedAt).
- Detail HOT: compact row height, zebra stripes, hover highlight.

## Error & Loading States
- Skeleton loaders for cards & HOT initial load.
- Error banner component (Element Plus `ElAlert`) with retry action.

## Tasks Alignment
- P0: Playground + basic routes scaffolding.
- P1: Normalization & UX polish extraction.
- P2: Pagination, debounce save, docs.

## Risks
- Large forms performance: mitigate with server-side pagination and HOT virtualization (rowHeights minimal).
- Structure divergence (structure vs structureResult): address via helper reconciliation function.

## Follow Ups (Post P2)
- Column reorder persistence.
- Inline validation (regex / required fields) from form definitions.
- Export selected rows from detail view.
