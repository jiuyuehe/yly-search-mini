# Change Proposal: migrate-vuewordcloud

## Summary
Replace the current TagCloud component's wordcloud2.js canvas-based rendering with VueWordCloud (https://github.com/SeregPie/VueWordCloud), a modern Vue 3 native word cloud library that provides declarative API, better animation support, and eliminates manual canvas management complexity.

## Motivation
- **Maintainability**: wordcloud2.js is an external library requiring manual canvas lifecycle management, ResizeObserver, hover/click event handling on canvas coordinates, and custom tooltip positioning. VueWordCloud provides Vue-native declarative slots and scoped templates.
- **Developer Experience**: Current implementation (~500+ LOC) includes complex shape functions, custom highlight layers, manual pixel-perfect hit detection, and intricate rendering pipeline. VueWordCloud reduces this to declarative props and slot templates (~150 LOC estimated).
- **Feature Alignment**: VueWordCloud offers built-in animations (enter/leave), progress events, and Vue 3 composition API compatibility out of the box.
- **Bundle Size**: Removing wordcloud2.js (~50KB) and custom utilities (examplesPresets.js, wordcloud2.js wrapper) streamlines dependencies.

## Scope
In scope:
- Replace `TagCloud.vue` implementation with VueWordCloud component
- Install `vuewordcloud` package (npm)
- Adapt existing API data format `{ tag, weight }[]` to VueWordCloud's `[text, weight][]` format
- Preserve existing interactions:
  - Click on tag -> emit `@tag-click` event -> trigger search
  - Hover tag -> show tooltip with tag name and weight
- Preserve toolbar controls: shape selector (keep compatible shapes), refresh button, style preset dropdown (adapt to VueWordCloud's color/font props)
- Remove advanced custom shape panel (VueWordCloud doesn't support custom shape functions; retain basic shape presets if available or fallback to default)
- Remove wordcloud2.js, examplesPresets.js, and related utilities
- Keep API service layer (`tagCloudService`) and store integration (`search.js`) unchanged

Out of scope:
- Changing backend API contract or data structure
- Adding new tag cloud features beyond current functionality
- Modifying FilterSidebar or other consumers of `@tag-click` event

## Success Criteria
- Tag cloud renders successfully with backend data (`tagCloudService.getKeywordsCloud()`)
- Clicking a tag emits `@tag-click(tag)` and triggers search in SearchView
- Hover displays tag name and weight (via VueWordCloud slot or tooltip)
- Refresh button reloads data and re-renders cloud
- Shape selector applies shape (circle, cardioid/heart if supported, or fallback)
- Build passes; no console errors; wordcloud2.js imports removed
- Visual regression: cloud layout comparable to previous version (words scaled by weight, colorized, responsive)

## Risks & Mitigations
- **Shape Support**: VueWordCloud may not support all wordcloud2.js shapes (cardioid, diamond, pentagon, star, custom functions). Mitigation: Offer subset of shapes; document unsupported shapes; fallback to default shape gracefully.
- **Performance**: VueWordCloud uses Web Workers by default. Mitigation: Test with 100+ tags; if slow, investigate `createWorker` prop override or reduce tag count.
- **Styling Control**: VueWordCloud's color/font props may differ from wordcloud2.js colorFunc. Mitigation: Map existing `colorFunc` logic to `:color` function prop; validate color contrast.
- **Hover/Click Behavior**: VueWordCloud slots may not provide click/hover out-of-box. Mitigation: Use scoped slot with `@click` on rendered element; emit custom events.

## Dependencies
- New dependency: `vuewordcloud` (npm package, MIT license, Vue 3 compatible)
- Remove: `src/utils/wordcloud2.js`, `src/utils/examplesPresets.js` (if only used by TagCloud)
- Existing API: `tagCloudService.getKeywordsCloud()` remains unchanged
- Store: `searchStore.tagCloud` and `searchStore.fetchTagCloud()` remain unchanged

## High-Level Approach
1. Install `vuewordcloud` via `pnpm add vuewordcloud`
2. Create new `TagCloudV2.vue` (or rename current to `TagCloudLegacy.vue` temporarily)
3. Import `VueWordCloud` component and register locally
4. Map `tags` array `{ tag, weight }` to `words` prop format `[[tag, weight]]`
5. Implement scoped slot template for word rendering:
   - Bind `@click` to emit `tag-click`
   - Show tooltip on hover (Vue directive or inline style)
6. Map toolbar controls:
   - Shape: use `:rotation`, `:spacing`, or similar props (no direct shape prop; VueWordCloud uses spiral layout by default)
   - Color: map to `:color` function prop
   - Refresh: keep existing `onRefresh` logic
7. Remove advanced panel (custom shape code editor)
8. Test integration in SearchView; validate click/hover events
9. Delete wordcloud2.js and related utils; clean imports
10. Update docs if needed (optional P2)

## Validation Plan
- Manual test: Load SearchView -> Tag Cloud visible -> Click tag -> Search triggered
- Hover test: Mouse over tag -> Tooltip appears with tag + weight
- Refresh test: Click refresh -> New data fetched -> Cloud re-renders
- Shape test: Change shape selector -> Cloud layout updates (if supported)
- Performance test: Load 100 tags -> Renders within 2s; smooth interaction
- Build test: `npm run build` passes; no wordcloud2.js references in bundle
