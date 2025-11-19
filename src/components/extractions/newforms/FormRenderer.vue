<template>
  <el-form
    ref="formRef"
    :model="formModel"
    label-width="120px"
    class="form-renderer"
  >
    <template v-for="field in schema" :key="field.key">
      <!-- 短文本输入 -->
      <el-form-item
        v-if="field.type === 'input-short'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-input
          v-model="formModel[field.key]"
          :placeholder="field.placeholder || `请输入${field.label}`"
          :disabled="readonly"
        />
      </el-form-item>

      <!-- 长文本输入 -->
      <el-form-item
        v-if="field.type === 'input-long'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-input
          v-model="formModel[field.key]"
          type="textarea"
          :rows="4"
          :placeholder="field.placeholder || `请输入${field.label}`"
          :disabled="readonly"
        />
      </el-form-item>

      <!-- 数字输入 -->
      <el-form-item
        v-if="field.type === 'input-number'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-input-number
          v-model="formModel[field.key]"
          :placeholder="field.placeholder || `请输入${field.label}`"
          :disabled="readonly"
        />
      </el-form-item>

      <!-- 手机号输入 -->
      <el-form-item
        v-if="field.type === 'input-phone'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-input
          v-model="formModel[field.key]"
          :placeholder="field.placeholder || '请输入手机号'"
          :disabled="readonly"
        >
          <template #prefix>
            <el-icon><Phone /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- 邮箱输入 -->
      <el-form-item
        v-if="field.type === 'input-email'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-input
          v-model="formModel[field.key]"
          :placeholder="field.placeholder || '请输入邮箱'"
          :disabled="readonly"
        >
          <template #prefix>
            <el-icon><Message /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- 日期选择 -->
      <el-form-item
        v-if="field.type === 'input-date'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-date-picker
          v-model="formModel[field.key]"
          type="date"
          :placeholder="field.placeholder || '请选择日期'"
          :disabled="readonly"
          style="width: 100%"
        />
      </el-form-item>

      <!-- 日期时间选择 -->
      <el-form-item
        v-if="field.type === 'input-datetime'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-date-picker
          v-model="formModel[field.key]"
          type="datetime"
          :placeholder="field.placeholder || '请选择日期时间'"
          :disabled="readonly"
          style="width: 100%"
        />
      </el-form-item>

      <!-- IP地址输入 -->
      <el-form-item
        v-if="field.type === 'input-ip'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-input
          v-model="formModel[field.key]"
          :placeholder="field.placeholder || '请输入IP地址'"
          :disabled="readonly"
        >
          <template #prefix>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- 单选下拉 -->
      <el-form-item
        v-if="field.type === 'select-single'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-select
          v-model="formModel[field.key]"
          :placeholder="field.placeholder || `请选择${field.label}`"
          :disabled="readonly"
          style="width: 100%"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 多选下拉 -->
      <el-form-item
        v-if="field.type === 'select-multiple'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-select
          v-model="formModel[field.key]"
          multiple
          :placeholder="field.placeholder || `请选择${field.label}`"
          :disabled="readonly"
          style="width: 100%"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 单选按钮 -->
      <el-form-item
        v-if="field.type === 'radio'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-radio-group v-model="formModel[field.key]" :disabled="readonly">
          <el-radio
            v-for="option in field.options"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 多选框 -->
      <el-form-item
        v-if="field.type === 'checkbox'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-checkbox-group v-model="formModel[field.key]" :disabled="readonly">
          <el-checkbox
            v-for="option in field.options"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <!-- 文件上传 -->
      <el-form-item
        v-if="field.type === 'file-upload'"
        :label="field.label"
        :required="field.required"
        :prop="field.key"
      >
        <el-upload
          v-model:file-list="formModel[field.key]"
          action="#"
          :auto-upload="false"
          :disabled="readonly"
        >
          <el-button :icon="Upload">选择文件</el-button>
        </el-upload>
      </el-form-item>

      <!-- 对象类型（嵌套表单） -->
      <el-form-item
        v-if="field.type === 'object'"
        :label="field.label"
        :required="field.required"
      >
        <el-card class="nested-form-card">
          <FormRenderer
            v-if="field.children && field.children.length > 0"
            :schema="field.children"
            v-model="formModel[field.key]"
            :readonly="readonly"
          />
          <el-empty v-else description="未配置子字段" />
        </el-card>
      </el-form-item>
    </template>
  </el-form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { generateFormData } from '../utils/formUtils'
import {
  Phone,
  Message,
  Link,
  Upload
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  schema: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 表单引用
const formRef = ref(null)

// 表单数据
const formModel = computed({
  get() {
    // 如果有传入的值，使用传入的值，否则生成默认值
    if (Object.keys(props.modelValue).length > 0) {
      return props.modelValue
    }
    return generateFormData(props.schema)
  },
  set(val) {
    emit('update:modelValue', val)
  }
})

// 监听模型变化
watch(formModel, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

// 暴露验证方法
const validate = () => {
  return formRef.value?.validate()
}

// 暴露重置方法
const resetFields = () => {
  formRef.value?.resetFields()
}

// 暴露给父组件
defineExpose({
  validate,
  resetFields
})
</script>

<style scoped>
.form-renderer {
  padding: 10px 0;
}

.nested-form-card {
  width: 100%;
  background: #f5f7fa;
}

.nested-form-card :deep(.el-card__body) {
  padding: 15px;
}

.nested-form-card :deep(.el-form-item) {
  margin-bottom: 15px;
}
</style>
