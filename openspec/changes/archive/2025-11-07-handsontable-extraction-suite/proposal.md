# Proposal: Handsontable Extraction Suite

Change ID: handsontable-extraction-suite
Status: Proposed
Owner: FE
Last Updated: 2025-11-07

## Goals
- Provide a standalone Vue 3 Handsontable learning playground to master nested headers, async load, inline edit+save, and polished styling.
- Redesign /extractions to show form cards loaded from `/rag/admin-api/rag/ai/form/page`.
- Add a per-form detail grid page with powerful Handsontable (nested headers, async paging, inline edit-save) driven by form structure vs structureResult.

## Non-goals
- Backend API changes.
- Multi-tenant or auth flows.

## Rationale
The current results grid was upgraded to Handsontable but UX and discoverability for forms can be improved. A focused playground accelerates team familiarity and reduces regressions.

## Deliverables
1) Playground route `/lab/hot` with demos (multi-headers, async data, edits, save).
2) Extractions landing page reworked as form cards grid.
3) Detail route `/extractions/form/:id` with HOT-powered grid.

## Risks
- Styling clashes (Element Plus vs HOT) — mitigate with scoped CSS variables.
- Data diversity — add robust normalization for structure/structureResult and arrays of objects.

