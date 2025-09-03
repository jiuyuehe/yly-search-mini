<template>
  <div class="translation-workspace">
    <AdvancedTranslationModule 
      ref="advModuleRef"
      :file-id="fileId"
      :es-id="esId"
      :active="active"
      :initial-source-text="initialSourceText"
      :initial-translation="initialTranslation"
      @text-extracted="onTextExtracted"
      @translated="onTranslated"
    />
  </div>
</template>

<script setup>
import AdvancedTranslationModule from '../ai/AdvancedTranslationModule.vue';

defineProps({
  fileId: { type: String, required: true },
  esId: { type: String, default: '' },
  active: { type: Boolean, default: false },
  initialSourceText: { type: String, default: '' },
  initialTranslation: { type: String, default: '' }
});

const emit = defineEmits(['text-extracted']);

// local state
import { ref } from 'vue';
const translated = ref('');
const advModuleRef = ref(null);

function onTranslated(text){ translated.value = text; }

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
.tw-left, .tw-right { height:100%; display:flex; flex-direction:column; }
.tw-left { flex:1 1 50%; min-width:0; }
.tw-right { flex:1 1 50%; min-width:0; }
</style>
