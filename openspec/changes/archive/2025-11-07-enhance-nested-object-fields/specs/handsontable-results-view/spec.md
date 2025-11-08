# Capability: Handsontable-based Results View (New)

## ADDED Requirements

### Requirement: New results table component using Handsontable
- The system MUST implement a new component (do not delete old) to display extraction results in a grid powered by Handsontable.
- The grid MUST support displaying nested structures by expanding an object field into multiple columns using dot-notation or user-friendly labels.
- The grid MUST support in-place editing (double-click to edit a cell) for simple value fields.
- The component SHOULD be mountable from Forms page as an alternative view.

#### Scenario: Render flat fields
Given results with only simple fields
When rendering grid
Then columns match field names and cells show values, editable where applicable.

#### Scenario: Render object subfields
Given results include an object field with subfields
When rendering
Then columns for subfields appear (e.g., `合同信息.甲方`, `合同信息.金额`), populated and editable.

#### Scenario: Read-only for non-editable types
Given a field is not editable or requires special handling
When rendering
Then the cell is read-only or uses appropriate editor.

### Requirement: Non-destructive integration
- The system MUST keep existing results view intact; the new view can be routed via a new path or toggle in UI.
- Changes in the grid MUST communicate edits to the appropriate update API (if available) or local state with explicit save.

#### Scenario: Toggle to new view without breaking old
Given the old results view exists
When a user opts into the new Handsontable view
Then the old view MUST remain available and functional via its original route or toggle.

## Notes
- Reference: https://handsontable.com/docs/javascript-data-grid/vue3-installation/
- Licensing: Ensure compliance with Handsontable license for the intended usage.
