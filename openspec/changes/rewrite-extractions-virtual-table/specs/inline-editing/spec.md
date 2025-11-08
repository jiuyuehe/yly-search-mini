# Capability: Inline Editing

## ADDED Requirements
- Requirement: Editable data cells support text, number, boolean, date types with native inputs.
  - Scenario: Modify a value and cell's row becomes dirty (highlight) until saved.
- Requirement: Batch save commits all dirty rows via existing update API.
  - Scenario: After successful batch, dirty highlight clears.
- Requirement: Inline single-row save button in ops column saves only that row.
  - Scenario: Saving a single dirty row clears only that row's dirty state.
