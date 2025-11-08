<template>
  <div class="tag-cloud-wrapper">


    <vue-word-cloud
      v-if="words.length"
      :words="words"
      :color="colorFunction"
      :font-family="'Microsoft YaHei, sans-serif'"
      :font-size-ratio="5"
      :spacing="0.15"
      :animation-duration="800"
      :animation-easing="'ease-out'"
      style="height: 540px; width: 100%;"
      @update:progress="onProgress"
    >
      <template #default="{ text, weight }">
        <div
          class="word-item"
          :title="`${text} (权重: ${weight})`"
          @click="handleWordClick(text, weight)"
        >
          {{ text }}
        </div>
      </template>
    </vue-word-cloud>

    <el-empty v-if="!words.length && !loading" description="暂无标签" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import VueWordCloud from 'vuewordcloud';
import { useSearchStore } from '../../stores/search';

const emit = defineEmits(['tag-click']);
const props = defineProps({
  autoLoad: { type: Boolean, default: true },
  maxTagLength: { type: Number, default: 32 }
});

const store = useSearchStore();
const loading = ref(false);
const progress = ref(0);

const rawTags = computed(() => store.tagCloud || []);

const words = computed(() => 
  rawTags.value
    .filter(t => {
      const name = (t.tag || '').trim();
      return name.length > 0 && name.length <= props.maxTagLength;
    })
    .map(t => [t.tag, t.weight || 1])
);

const colorFunction = ([, weight]) => {
  if (!words.value.length) return '#409EFF';
  const maxWeight = Math.max(...words.value.map(w => w[1]), 1);
  const ratio = Math.min(Math.max(weight / maxWeight, 0), 1);
  const hue = Math.round(210 - ratio * 170);
  const sat = 52 + Math.round(ratio * 30);
  const light = 34 + Math.round(ratio * 18);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
};

function handleWordClick(text, _weight) {
  emit('tag-click', text);
}

async function onRefresh() {
  loading.value = true;
  try {
    await store.refreshTagCloud();
  } catch (e) {
    console.warn('刷新标签云失败', e);
  } finally {
    loading.value = false;
  }
}

function onProgress(value) {
  progress.value = value;
}

async function load() {
  loading.value = true;
  try {
    await store.fetchTagCloud(true);
  } catch (e) {
    console.warn('加载标签云失败', e);
  } finally {
    loading.value = false;
  }
}

function handleClick(tag, opts = {}) {
  if (!opts || !opts.suppressEmit) {
    emit('tag-click', tag);
  }
}

defineExpose({ handleClick });

onMounted(() => {
  if (props.autoLoad) {
    load();
  }
});
</script>

<style scoped>
.tag-cloud-wrapper {
  padding: 8px 10px 18px;
  border: var(--border-width-thin) solid var(--border-color-muted);
  border-radius: var(--border-radius-md);
  background: var(--el-bg-color, var(--background-color));
  position: relative;
}

.cloud-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 8px;
  flex-wrap: wrap;
}

.left-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-weight: 600;
  font-size: var(--font-size-md);
}

.loading {
  font-size: var(--font-size-xs);
  color: var(--text-color-placeholder);
}

.meta {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
}

.word-item {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  display: inline-block;
  padding: 2px 4px;
  border-radius: 3px;
}

.word-item:hover {
  transform: translateY(-2px) scale(1.05);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  background: rgba(64, 158, 255, 0.1);
}

.word-item:active {
  transform: translateY(0) scale(1);
}
</style>