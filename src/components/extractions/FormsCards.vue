<template>
  <div class="forms-cards" v-loading="formsStore.loading.list">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" v-for="f in formsStore.forms" :key="f.id">
        <el-card class="form-card" shadow="hover" @click="openForm(f)">
          <div class="title">{{ f.name }}</div>
          <div class="meta">ID: {{ f.id }}</div>
          <div class="fields-count">字段数: {{ (f.structure?.fields?.length) || f.fields?.length || 0 }}</div>
          <div class="updated">更新时间: {{ formatDate(f.updated_at || f.updateTime) }}</div>
          <div class="sample" v-if="sampleFields(f).length">
            <span class="sample-label">字段示例:</span>
            <span class="sample-items">{{ sampleFields(f).join(', ') }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <div v-if="!formsStore.forms.length && !formsStore.loading.list" class="empty">暂无表单</div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useFormsStore } from '../../stores/forms'
import { onMounted } from 'vue'

const router = useRouter()
const formsStore = useFormsStore()

onMounted(() => { if (!formsStore.forms.length) formsStore.loadForms() })

function openForm(form) {
  router.push(`/extractions/form/${form.id}`)
}

function sampleFields(form) {
  const fields = form?.structure?.fields || form?.fields || []
  return fields.slice(0, 4).map(f => f.name)
}

function formatDate(dt) {
  if (!dt) return ''
  try { return new Date(dt).toLocaleDateString('zh-CN') } catch { return dt }
}
</script>

<style scoped>
.forms-cards { padding: 16px; }
.form-card { cursor: pointer; margin-bottom: 16px; transition: transform .15s ease; }
.form-card:hover { transform: translateY(-3px); }
.form-card .title { font-weight:600; font-size:14px; margin-bottom:4px; }
.form-card .meta, .form-card .fields-count, .form-card .updated { font-size:12px; color:#666; }
.form-card .sample { margin-top:6px; font-size:12px; color:#555; }
.sample-label { font-weight:500; }
.empty { text-align:center; padding:40px 0; color:#888; }
</style>
