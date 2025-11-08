# Capability: Validation for Nested Object Fields

## ADDED Requirements

### Requirement: Forbid nested object/array types in object subfields
- If a top-level field has `type === 'object'`, each of its `fields[]` subfields MUST NOT have `type === 'object'` or `type === 'array'`.
- Violations MUST be reported by `validateFormStructure(structure)` with a clear error message.

#### Scenario: Reject subfield with type object
Given a structure with a top-level object field `contract`
And a subfield `partyA` whose `type === 'object'`
When `validateFormStructure` runs
Then it MUST include an error like `对象字段 "contract" 的子字段 "partyA": 不支持 object 类型`.

#### Scenario: Reject subfield with type array
Given a structure with a top-level object field `contract`
And a subfield `tags` whose `type === 'array'`
When `validateFormStructure` runs
Then it MUST include an error like `对象字段 "contract" 的子字段 "tags": 不支持 array 类型`.

### Requirement: Ensure object fields initialize `fields` array
- When validating, if an object-type field lacks a `fields` array, it MUST be initialized to an empty array to avoid runtime errors.

#### Scenario: Auto-initialize missing fields array
Given a field with `type === 'object'` and no `fields`
When `validateFormStructure` runs
Then the validator SHOULD set `field.fields = []` and continue validation without crashing.

### Requirement: Duplicate name checks
- Top-level field names MUST be unique.
- Subfield names within the same object field MUST be unique.
- Errors MUST list the duplicated names.

#### Scenario: Duplicate top-level names
Given two top-level fields with the same `name`
When `validateFormStructure` runs
Then it MUST include an error like `存在重复的字段名称: <name>`.

#### Scenario: Duplicate subfield names
Given object field `contract` whose subfields contain two named `partyA`
When `validateFormStructure` runs
Then it MUST include an error like `对象字段 "contract" 存在重复的子字段名称: partyA`.

### Requirement: Object fields MUST contain at least one subfield
- If a field is `type === 'object'`, it MUST contain at least one subfield; otherwise surface an error.

#### Scenario: Empty object field
Given object field `contract` with `fields.length === 0`
When `validateFormStructure` runs
Then it MUST include an error like `字段 "contract" 必须包含子字段`.

### Requirement: Arrays with itemType 'object' follow the same subfield rules
- For `type === 'array'` with `itemType === 'object'`, the `fields[]` MUST be present and MUST NOT contain nested `object` or `array`.

#### Scenario: Array-of-object without fields
Given a field `items` with `type === 'array'` and `itemType === 'object'` and no `fields`
When validating
Then it MUST include an error that subfields are required for object elements.

#### Scenario: Array-of-object nested violation
Given a field `items` with `type === 'array'` and `itemType === 'object'`
And an element subfield whose `type === 'array'`
When validating
Then it MUST include an error that nested `array` or `object` types are not supported inside object elements.

## Notes
- Cross-reference: Pairs with `object-subfield-editor` capability to ensure UI cannot select invalid types and store rejects illegal structures.
