<template>
  <div class="translation-workspace">
    <AdvancedTranslationModule 
      ref="advModuleRef"
      :file-id="fileId"
      :file="file"
      :es-id="esId"
      :active="active"
      :initial-source-text="initialSourceText"
      :initial-translation="initialTranslation"
      @text-extracted="onTextExtracted"
      @translated="onTranslated"
      @update-file-contents="onUpdateFileContents"
    />
  </div>
</template>

<script setup>
import AdvancedTranslationModule from '../ai/translation/AdvancedTranslationModule.vue';



defineProps({
  file: { type: Object, default: null },
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

function onUpdateFileContents(payload){
  // forward to parent so PreviewView can update fileData
  emit('update-file-contents', payload);
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
