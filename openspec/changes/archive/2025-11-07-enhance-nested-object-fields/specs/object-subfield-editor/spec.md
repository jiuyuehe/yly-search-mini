# Capability: Object Subfield Editor

## ADDED Requirements

### Requirement: Manage subfields for object-type fields in FormDesigner
The system MUST provide an in-place entry to manage subfields of any field whose `type === 'object'`.

- The table row for an object-type field MUST render a primary action "Manage Subfields" (gear icon acceptable) in the operation column.
- Clicking the button MUST open a modal dialog titled `管理子字段：{field.name}`.
- The dialog MUST display the subfields as a table with columns: index, name, type, required, example, actions.
- The actions MUST include add, delete (with confirm), move-up, and move-down.
- The dialog MUST auto-save (no explicit confirm button). Closing the dialog preserves in-memory edits immediately.
- The dialog width SHOULD be responsive: 70% on desktop, 95% on small screens (<768px).

#### Scenario: Show manage button only when field.type === 'object'
Given a FormDesigner table with multiple fields of different types
When a row has `type === 'object'`
Then the operation column MUST contain a button to open the subfield editor
And rows that are not object-type MUST NOT show this button.

#### Scenario: Open dialog and view existing subfields
Given a field with `type === 'object'` and `fields.length = 3`
When the user clicks Manage Subfields
Then a dialog opens titled `管理子字段：{field.name}`
And the table shows 3 rows representing the existing subfields.

#### Scenario: Add a new subfield
Given the subfield dialog is open
When the user clicks "添加子字段"
Then a new row is appended with defaults: `name='子字段{n}'`, `type='text'`, `required=false`, `example=''`
And the dialog table updates immediately.

#### Scenario: Delete a subfield with confirmation
Given the subfield dialog is open and there is at least one subfield
When the user clicks the delete icon
Then a confirmation prompt MUST appear
And upon confirm, the subfield is removed and the table refreshes.

#### Scenario: Reorder subfields
Given the subfield dialog is open
When the user clicks up or down on a subfield that can move
Then the subfield MUST swap positions accordingly.

### Requirement: Subfield type options are limited to simple types
- In the dialog, the type selector MUST only list: `text`, `number`, `date`, `boolean`.
- `object` and `array` MUST NOT appear as type options for subfields.

#### Scenario: Restrict type selector options
Given the subfield dialog is open
When the user opens the type dropdown
Then the dropdown MUST NOT contain `object` or `array` options
And MUST contain `text`, `number`, `date`, `boolean`.

### Requirement: Object field row hints
- For object-type rows in the main table, the example column MUST show a subtle hint: the field is an object and how many subfields it currently has.

#### Scenario: Show object hint and count
Given a field `type='object'` with 3 subfields
When rendering the table row
Then the example column SHOULD display a hint like `对象类型` and `3 个子字段`.

## Notes
- Cross-reference: See `validation-nested-objects` capability for validation rules that pair with this UI.
- Scope: No drag-and-drop sorting is required; up/down buttons are sufficient.
