<template>
  <div class="translation-workspace">
    <!-- Use the new Advanced Translation Module -->
    <AdvancedTranslationModule 
      :fileId="fileId" 
      :initialSourceText="initialSourceText"
      @text-extracted="onTextExtracted"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AdvancedTranslationModule from '../ai/AdvancedTranslationModule.vue';

const props = defineProps({
  fileId: { type: String, required: true },
  initialSourceText: { type: String, default: '' }
});

const emit = defineEmits(['text-extracted']);

function onTextExtracted(text) {
  emit('text-extracted', text);
}
</script>

<style scoped>
.translation-workspace { 
  display: flex; 
  width: 100%; 
  height: 100%; 
  background: #fff; 
  overflow: hidden; 
}
</style>
