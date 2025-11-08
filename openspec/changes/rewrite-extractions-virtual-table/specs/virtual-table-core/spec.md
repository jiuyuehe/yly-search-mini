# Capability: Virtual Table Core

## ADDED Requirements
- Requirement: Use Element Plus el-table-v2 for the `/extractions/form/:id` detail view to support up to 1000 rows with virtualization.
  - Scenario: Load 1000 items successfully renders and scrolls smoothly.
- Requirement: Columns include ID, esId (link), createTime, and flattened field columns derived from structure/fields.
  - Scenario: esId links to `/preview/doc/<esId>?retureBtn=true`.
- Requirement: Toolbar provides refresh, filter (keyword), and sorting (createTime asc/desc, id asc/desc).
  - Scenario: Changing sort/filter updates the displayed data immediately without reloading.
