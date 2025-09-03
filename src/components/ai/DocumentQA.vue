<template>
  <FileChatPanel v-bind="$props" />
</template>

<script setup>
import FileChatPanel from './FileChatPanel.vue';
defineProps({
  fileId: { type: String, required: true },
  esId: { type: String, default: '' },
  userId: { type: [String, Number], default: '' }
});
</script>

<style scoped>
/* Thin wrapper: no styles needed */
</style>
