# Capability: Forms Manager Visibility Column

## ADDED Requirements

### Requirement: Show visibility (Public/Personal) in forms list
- The forms management page (`/forms`) MUST include a column "可见性" that shows `公开` when a form has no `userId`, and `个人` when `userId` exists.

#### Scenario: Public form
Given a form with no `userId`
When rendering the row
Then the visibility cell MUST display `公开`.

#### Scenario: Personal form
Given a form with `userId` present
When rendering the row
Then the visibility cell MUST display `个人`.

### Requirement: No breaking change to existing actions
- The new column MUST NOT affect existing operations (edit/delete/toggle).

#### Scenario: Actions unaffected
Given the forms list renders with the new visibility column
When a user clicks edit/delete/toggle on any row
Then those actions MUST behave the same as before adding the column.
