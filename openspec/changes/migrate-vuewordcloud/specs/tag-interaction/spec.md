# Capability: Tag Interaction

## MODIFIED Requirements
- Requirement: Clicking a tag triggers search via `@tag-click` event emission, using VueWordCloud scoped slot click handler instead of canvas coordinate detection.
  - Scenario: User clicks word "报告" in tag cloud. Component emits `tag-click('报告')` event. SearchView receives event, calls `handleTagClick('报告')`, triggers `searchStore.searchFilesByTags(['报告'])`, switches to result list view.
  - Scenario: Parent component (SearchView) calls exposed `handleClick(tag)` method programmatically. Event emitted with `{ suppressEmit: true }` option to prevent duplicate search calls.

- Requirement: Hovering over a tag displays tooltip with tag name and weight, using native HTML `title` attribute instead of custom canvas overlay.
  - Scenario: User hovers over tag "合同" with weight 25. Tooltip shows "合同 (25)" via native browser tooltip (or Element Plus `el-tooltip` directive if needed for styling).

## REMOVED Requirements
- Requirement: ~~Tag cloud supports double-layer canvas rendering with main word layer and separate highlight layer for hover effects~~.
  - Rationale: VueWordCloud uses DOM rendering. Hover styling achieved via CSS `:hover` pseudo-class or Vue event handlers.

- Requirement: ~~Manual pixel-perfect hit detection on canvas for click and hover events using bounding box coordinates~~.
  - Rationale: DOM-based rendering provides native event targets. No coordinate calculation needed.

## ADDED Requirements
- Requirement: Tag cloud exposes `handleClick(tag)` method via `defineExpose` for programmatic tag selection by parent components.
  - Scenario: SearchView imports `tagCloudRef` and calls `tagCloudRef.value.handleClick('标签A')` programmatically. Event emitted immediately without user interaction.

- Requirement: Tag click and hover events work correctly with VueWordCloud's scoped slot template structure.
  - Scenario: Scoped slot receives `{ text, weight, word }` props. Template binds `@click="handleWordClick(word)"` on rendered element. Handler extracts tag text and emits event.
  - Scenario: Hovering word element (via CSS or `@mouseenter`) updates tooltip content dynamically (if using Vue tooltip instead of native `title`).

- Requirement: Refresh button reloads tag data via `store.refreshTagCloud()` and triggers VueWordCloud re-render via reactive `:words` prop.
  - Scenario: User clicks "刷新" button. Loading state shown. Backend API called (`tagCloudService.updateKeywordsCloud()` + `getKeywordsCloud()`). Store updates `tagCloud` array. Computed `words` prop changes. VueWordCloud detects change and re-renders cloud with new data.
