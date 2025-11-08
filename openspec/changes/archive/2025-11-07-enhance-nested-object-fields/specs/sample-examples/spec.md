# Capability: Sample Forms Examples

## ADDED Requirements

### Requirement: Provide three sample forms
The system MUST offer three sample presets accessible from FormDesigner "加载示例":
- Sample A: No object subfields (flat fields only)
- Sample B: One object with a few subfields
- Sample C: Slightly more complex: object + array-of-object with 2-3 subfields

#### Scenario: Sample A (flat)
When user clicks 加载示例 and selects Sample A
Then the designer loads a structure with only simple fields (text/number/date/boolean) and no `object` or `array`.

#### Scenario: Sample B (object with subfields)
When user selects Sample B
Then the structure includes one `object` field (e.g., `合同信息`) with 2-5 subfields (mixed simple types) and no further nesting.

#### Scenario: Sample C (complex)
When user selects Sample C
Then the structure includes:
- One object field with subfields
- One array field whose `itemType==='object'` and fields defined (2-3 subfields)
And the result MUST still respect the two-layer nesting limit.

### Requirement: Backwards compatibility
- If only one button is present, the system MUST default to selecting Sample B; otherwise it SHOULD provide a small chooser (menu/popover) to pick A/B/C.

#### Scenario: Default to Sample B
Given the designer only shows a single "加载示例" button
When the user clicks it
Then Sample B MUST be loaded by default.
