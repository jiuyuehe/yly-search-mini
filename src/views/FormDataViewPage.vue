<template>
  <div class="form-data-page">
    <el-empty v-if="!currentForm" description="表单正在加载中..." class="empty-state" />
    <FormDataView
      v-else
      :visible="true"
      :form="currentForm"
      @update:visible="handleClose"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formStore } from '../stores/formStore'
import FormDataView from '../components/extractions/newforms/FormDataView.vue'

const route = useRoute()
const router = useRouter()

const formId = computed(() => route.params.id)
const currentForm = computed(() => (formId.value ? formStore.getForm(formId.value) : null))

const loadForms = async () => {
  try {
    await formStore.loadForms()
  } catch (error) {
    console.error('加载表单数据失败:', error)
  }
}

onMounted(async () => {
  if (!formStore.forms.length) {
    await loadForms()
  }
})

watch(formId, async (id) => {
  if (id && !formStore.getForm(id)) {
    await loadForms()
  }
}, { immediate: true })

const handleClose = () => {
  router.push({ name: 'newForm' })
}
</script>

<style scoped>
.form-data-page {
  min-height: 100vh;
  background: var(--background-color);
  padding: 24px;
}

.empty-state {
  padding: 40px;
}
</style>
