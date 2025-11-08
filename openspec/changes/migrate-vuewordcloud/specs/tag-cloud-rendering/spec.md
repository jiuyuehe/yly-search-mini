# Capability: Tag Cloud Rendering

## MODIFIED Requirements
- Requirement: Tag cloud component renders word cloud visualization from backend API data using VueWordCloud library instead of wordcloud2.js.
  - Scenario: User loads SearchView with tag cloud enabled. Component fetches tags via `tagCloudService.getKeywordsCloud()`, transforms data to `[[text, weight]]` format, and renders using `<vue-word-cloud>` component with words scaled by weight and colored by gradient.
  - Scenario: Backend returns 100 tags. Cloud renders within 2 seconds with smooth animation. Words are sized proportionally (high weight = larger font) and colored from purple (low) to blue (high).

- Requirement: Tag weights control font size via VueWordCloud's `:font-size-ratio` prop, replacing manual `weightFactor` function.
  - Scenario: Tag with weight 10 is displayed significantly larger than tag with weight 1. Ratio is consistent across all tags.

- Requirement: Tag colors computed via `:color` function prop, preserving existing HSL gradient logic (hue 210→40, saturation 52%→82%, lightness 34%→52%).
  - Scenario: Highest weight tag rendered in blue-ish hue; lowest weight tag in purple-ish hue. Intermediate weights transition smoothly along gradient.

## REMOVED Requirements
- Requirement: ~~Tag cloud supports custom shape functions (circle, cardioid, diamond, pentagon, star, custom code) via wordcloud2.js shape API~~.
  - Rationale: VueWordCloud uses spiral layout by default and does not support custom shape functions. Shape selector UI removed or made no-op.

- Requirement: ~~Advanced panel allows users to define custom shape functions via code editor~~.
  - Rationale: Custom shape functions not supported by VueWordCloud. Advanced panel removed entirely.

- Requirement: ~~Tag cloud renders on HTML5 Canvas with manual pixel-perfect hover detection and highlight layer~~.
  - Rationale: VueWordCloud uses DOM-based rendering with native Vue event handling. No canvas management needed.

## ADDED Requirements
- Requirement: Tag cloud uses VueWordCloud scoped slot template for rendering individual words with click and hover handlers.
  - Scenario: Each word rendered as `<div>` with `@click` listener. Clicking word emits `tag-click` event with tag text. Hovering word shows native `title` tooltip with tag name and weight.

- Requirement: Tag cloud displays loading indicator during data fetch and progress feedback during layout computation via `@update:progress` event.
  - Scenario: User clicks refresh button. Loading spinner shown while `store.refreshTagCloud()` executes. Progress bar (optional) updates as VueWordCloud computes layout.

- Requirement: Empty state shown when no tags available (backend returns empty array or all tags filtered out).
  - Scenario: Backend returns no tags. Component displays `<el-empty description="暂无标签" />` instead of blank space.
