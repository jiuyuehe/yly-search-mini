# Capability: JSON Preview Modal

## ADDED Requirements

### Requirement: Replace inline JSON block with modal preview
- The designer MUST remove the inline card `header="JSON结构"` from FormDesigner page.
- The designer MUST add an operation button `查看JSON` in the header action group (before `加载示例`).
- Clicking `查看JSON` MUST open a modal dialog showing the current `formData.structure` as formatted JSON.
- The dialog MUST be read-only and wide enough for readability (60-70%).

#### Scenario: Open JSON modal
Given the designer is open with some fields
When user clicks `查看JSON`
Then a modal opens showing the JSON of `formData.structure` formatted with indentation.

#### Scenario: Remove inline JSON card
Given the designer page
When rendering
Then the inline JSON card is NOT present anymore.
