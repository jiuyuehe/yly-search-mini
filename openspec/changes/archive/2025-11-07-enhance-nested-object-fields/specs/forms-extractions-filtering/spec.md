# Capability: Correct Filtering for Extractions by Form

## ADDED Requirements

### Requirement: Filter data results by selected form in Forms page
- In `/forms`, when clicking the link to view related data results, the app MUST navigate to `/extractions?form_id=<id>`.
- The Extractions view MUST filter results to only show items for the specified `form_id`.

#### Scenario: Navigate with form_id
Given a form with id 9
When user clicks the related results link
Then router navigates to `/extractions?form_id=9`
And the Extractions page MUST show only results of form 9.

### Requirement: Back navigation consistency
- Using browser back/forward MUST preserve filtering parameters so users land on the same filtered state.

#### Scenario: Preserve filter on back/forward
Given the user is on `/extractions?form_id=9`
When the user navigates away and then uses back/forward
Then the page MUST remain filtered to `form_id=9`.
