<template>
  <FileChatPanel
    v-bind="$props"
    url="/admin-api/rag/ai/text/file-chat/stream-rag"
    :defaultUseContext="true"
    :sessionchat="false"
    :showReturn="false"
    chatType="rag"
  />
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
