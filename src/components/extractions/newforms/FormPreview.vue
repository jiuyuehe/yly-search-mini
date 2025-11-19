<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`预览: ${form?.name || '表单'}`"
    width="60%"
    @close="handleClose"
  >
    <div v-if="form" class="preview-container">
      <el-alert
        title="这是表单预览模式"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          您可以在此查看表单的外观和字段配置。预览模式下的数据不会被保存。
        </template>
      </el-alert>
      
      <FormRenderer
        v-if="form.schema && form.schema.length > 0"
        :schema="form.schema"
        v-model="previewData"
        readonly
      />
      
      <el-empty v-else description="该表单暂无字段配置" />
      
      <!-- 显示当前表单数据 -->
      <el-divider>当前表单数据</el-divider>
      <el-card class="data-preview">
        <pre>{{ JSON.stringify(previewData, null, 2) }}</pre>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { generateFormData } from '../utils/formUtils'
import FormRenderer from './FormRenderer.vue'

// Props
const props = defineProps({
  visible: Boolean,
  form: Object
})

// Emits
const emit = defineEmits(['update:visible'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const previewData = ref({})

// 监听 form 变化，生成预览数据
watch(() => props.form, (newForm) => {
  if (newForm && newForm.schema) {
    previewData.value = generateFormData(newForm.schema)
  }
}, { immediate: true })

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.preview-container {
  padding: 10px 0;
}

.data-preview {
  max-height: 300px;
  overflow: auto;
  background: #f5f7fa;
}

.data-preview pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #303133;
}
</style>
