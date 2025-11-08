# Design: migrate-vuewordcloud

## Architecture Overview
Replace canvas-based wordcloud2.js rendering with VueWordCloud's declarative Vue 3 component, preserving API integration and interaction contracts.

## Data Flow
1. **Load**: SearchView -> `searchStore.fetchTagCloud()` -> `tagCloudService.getKeywordsCloud()` -> `store.tagCloud = [{ tag, weight }]`
2. **Transform**: TagCloud component computed property transforms `{ tag, weight }[]` to `[[text, weight]]` for VueWordCloud `:words` prop
3. **Render**: VueWordCloud internally calculates layout, sizes, colors via props (`:color`, `:font-family`, `:font-size-ratio`)
4. **Interact**: User clicks word -> scoped slot `@click` handler -> `emit('tag-click', tag)` -> SearchView `handleTagClick(tag)` -> `searchStore.searchFilesByTags([tag])`

## Component Structure

### TagCloud.vue (New Implementation)
```vue
<template>
  <div class="tag-cloud-wrapper">
    <div class="cloud-toolbar">
      <!-- Existing toolbar: shape selector (subset), refresh button -->
    </div>
    <vue-word-cloud
      v-if="words.length"
      :words="words"
      :color="colorFunction"
      :font-family="'sans-serif'"
      :font-size-ratio="5"
      :spacing="0.2"
      :animation-duration="800"
      style="height: 540px; width: 100%;"
      @update:progress="onProgress"
    >
      <template #default="{ text, weight, word }">
        <div
          class="word-item"
          :title="`${text} (${weight})`"
          @click="handleWordClick(word)"
        >
          {{ text }}
        </div>
      </template>
    </vue-word-cloud>
    <el-empty v-else description="暂无标签" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import VueWordCloud from 'vuewordcloud';
import { useSearchStore } from '../../stores/search';

const store = useSearchStore();
const loading = ref(false);

// Transform store data to VueWordCloud format
const words = computed(() => 
  (store.tagCloud || [])
    .filter(t => t.tag && t.tag.trim().length > 0 && t.tag.length <= 32)
    .map(t => [t.tag, t.weight || 1])
);

const colorFunction = ([, weight]) => {
  const max = Math.max(...words.value.map(w => w[1]), 1);
  const ratio = weight / max;
  const hue = Math.round(210 - ratio * 170);
  const sat = 52 + Math.round(ratio * 30);
  const light = 34 + Math.round(ratio * 18);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
};

function handleWordClick(word) {
  emit('tag-click', word[0]);
}

async function onRefresh() {
  loading.value = true;
  try { await store.refreshTagCloud(); }
  finally { loading.value = false; }
}

defineEmits(['tag-click']);
defineExpose({ handleClick: (tag) => emit('tag-click', tag) });
</script>
```

## Key Design Decisions

### 1. Word Format Transformation
- **Input**: `store.tagCloud: Array<{ tag: string, weight: number }>`
- **Output**: `words: Array<[string, number]>` (VueWordCloud format)
- **Filter**: Tags > 32 chars excluded (preserve existing `maxTagLength` logic)

### 2. Color Mapping
- Preserve existing HSL gradient logic: high weight -> blue-ish; low weight -> purple-ish
- Map to VueWordCloud `:color` function prop: `(word) => 'hsl(...)'`
- Color function receives `[text, weight]` tuple; compute ratio against max weight

### 3. Interaction Handling
- **Click**: Scoped slot template binds `@click` on each word div -> `handleWordClick(word)` -> `emit('tag-click', text)`
- **Hover Tooltip**: Use native `title` attribute or Vue tooltip directive (Element Plus `el-tooltip` if needed)
- **Exposed Method**: `defineExpose({ handleClick })` for SearchView programmatic calls (preserve existing API)

### 4. Toolbar Simplification
- **Shape Selector**: VueWordCloud doesn't support shape prop directly (spiral layout by default). Options:
  - Remove shape selector entirely (simplest)
  - Keep selector UI but make it no-op or only affect spacing/rotation props (cosmetic)
  - Document limitation in proposal
- **Style Preset**: Map to `:font-family`, `:font-size-ratio`, `:color` combinations
- **Refresh**: Keep existing button; calls `store.refreshTagCloud()`

### 5. Advanced Panel Removal
- wordcloud2.js custom shape functions (`customShapeFn`, `customShapeCode`) not supported by VueWordCloud
- Remove entire "高级" panel and related state/logic
- Simplifies component by ~80 LOC

### 6. Performance Considerations
- VueWordCloud uses Web Worker by default (`:create-worker` prop)
- No manual canvas resize observer needed (component handles internally)
- Animation: `:animation-duration` and `:animation-easing` props control enter/leave transitions
- Progress feedback: `@update:progress` event for loading indicator

### 7. Fallback Handling
- If VueWordCloud fails to render (rare), show `<el-empty>` with error message
- Remove old canvas fallback list (VueWordCloud handles DOM rendering natively)

## Migration Steps (Implementation Order)
1. Install `vuewordcloud` package
2. Create new component file (or backup old one)
3. Import and register VueWordCloud
4. Implement `words` computed property (data transformation)
5. Implement `colorFunction` (preserve color logic)
6. Add scoped slot template with click handler
7. Wire up toolbar (refresh button, simplified controls)
8. Remove advanced panel UI and related logic
9. Test in SearchView integration
10. Remove wordcloud2.js imports and utilities
11. Validate build and bundle size

## Removed Code Sections
- `import '../../utils/wordcloud2.js'` (side-effect import)
- `import { getExamplePreset } from '../../utils/examplesPresets.js'`
- `const WordCloud = window.WordCloud` usage
- Canvas refs: `cloudCanvas`, `highlightCanvas`
- ResizeObserver setup
- Manual canvas size calculation (`calcWrapperHeight`, DPR scaling)
- Hit detection and hover highlight logic (`drawHighlight`, `clearHighlight`)
- Custom shape parsing and `applyCustomShape` function
- `buildList()` weight transformation (VueWordCloud handles sizing internally)
- Advanced panel template block and related state

## Retained Code Sections
- Store integration: `useSearchStore`, `fetchTagCloud`, `refreshTagCloud`
- Emit `@tag-click` event
- `defineExpose({ handleClick })` for parent refs
- Toolbar structure (shape/refresh buttons, even if shape is no-op)
- Loading state and error handling
- Empty state display

## API Compatibility Matrix
| Current (wordcloud2.js) | VueWordCloud Equivalent | Notes |
|---|---|---|
| `list: [[word, weight]]` | `:words="[[text, weight]]"` | Direct mapping |
| `color: colorFunc` | `:color="colorFunc"` | Function prop same signature |
| `shape: 'circle'` | N/A (spiral layout) | Shape prop not supported |
| `gridSize: 4` | `:spacing="0.2"` | Approximate mapping |
| `weightFactor: fn` | `:font-size-ratio="5"` | Controls size scaling |
| `hover: fn` | Scoped slot with `@mouseover` | Manual event handling |
| `click: fn` | Scoped slot with `@click` | Manual event handling |
| `done: fn` | `@update:progress` | Progress event when done |

## Testing Strategy
- **Unit**: Verify `words` computed property transformation (mock store data)
- **Integration**: Load SearchView with tag cloud; click tag -> search triggered
- **Visual**: Compare rendering with old implementation (screenshot diff)
- **Performance**: Measure initial render time with 100 tags; compare to baseline
- **Regression**: Ensure all SearchView tag-click flows still work (FilterSidebar, TagCloud)
