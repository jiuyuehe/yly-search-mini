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
import { formsService } from '../services/formsService'

const route = useRoute()
const router = useRouter()

const formId = computed(() => route.params.id)
const currentForm = computed(() => (formId.value ? formStore.getForm(formId.value) : null))

const loadForms = async (id) => {
  try {
    if (id) {
      // 尝试直接从服务端拉取单个表单，避免依赖当前列表页的分页
      try {
        const f = await formsService.getForm(id)
        if (f && !formStore.getForm(f.id)) {
          // 插入到本地列表，放到开头以便快速查看
          formStore.forms.unshift(f)
        }
      } catch (e) {
        console.error('按 id 拉取表单失败，回退到分页列表拉取:', e)
        await formStore.loadForms({ pageNo: 1, pageSize: 20 })
      }
    } else {
      await formStore.loadForms({ pageNo: 1, pageSize: 20 })
    }
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
    await loadForms(id)
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
