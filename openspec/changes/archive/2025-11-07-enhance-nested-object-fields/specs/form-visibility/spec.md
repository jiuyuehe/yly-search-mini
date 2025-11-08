# Capability: Form Visibility (Public vs Personal)

## ADDED Requirements

### Requirement: Visibility selector in FormDesigner
- The designer MUST provide a radio group near extraction count to choose visibility: `公开` (public) or `个人` (personal).
- When `个人` is selected, the saved form payload MUST include `userId` (current user id) so the backend can store ownership.
- When `公开` is selected, the form payload MUST NOT include `userId` (or MUST set it to null/undefined).

#### Scenario: Choose public
Given a new form
When user selects `公开`
Then `saveForm()` MUST omit `userId` in the payload
And the UI label shows it beside extraction mode.

#### Scenario: Choose personal
Given a new form
When user selects `个人`
Then `saveForm()` MUST include the current user's id as `userId` in the payload.

### Requirement: Default behaviour
- The default selection MUST be `公开` if not specified.

#### Scenario: Default selection is public
Given the designer is opened for a new form
When the user does not change the visibility radio
Then the selection MUST be `公开` by default
And saving MUST omit `userId`.

## Notes
- The mechanism to fetch current user id SHOULD integrate with existing auth/session service if present; otherwise a placeholder can be wired and replaced later.
