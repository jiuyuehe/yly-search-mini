<template>
  <div class="translation-tool">
    <!-- Use the new Advanced Translation Module -->
    <AdvancedTranslationModule 
      :fileId="fileId" 
      @text-extracted="onTextExtracted"
    />
  </div>
</template>

<script setup>
import AdvancedTranslationModule from './AdvancedTranslationModule.vue';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['text-extracted']);

function onTextExtracted(text) {
  emit('text-extracted', text);
}
</script>

<style scoped>
.translation-tool {
  height: 100%;
  overflow: hidden;
}
</style>
