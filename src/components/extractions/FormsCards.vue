<template>
  <div class="forms-cards" v-loading="formsStore.loading.list">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" v-for="f in pagedForms" :key="f.id">
        <el-card class="form-card" shadow="hover">
          <div class="card-content" @click="openForm(f)">
            <div class="header-row">
              <div class="title">{{ f.name }}
                <el-tooltip v-if="f.esIndexName" content="已建立索引" placement="top">
                  <el-icon color="#52c41a" style="vertical-align: middle; margin-left: 4px;">
                    <CircleCheckFilled />
                  </el-icon>
                </el-tooltip>
              </div>
              <el-tag :type="getVisibilityTagType(f)" size="small" class="visibility-tag">
                {{ getVisibilityLabel(f) }}
              </el-tag>
            </div>
            <div class="meta">ID: {{ f.id }}</div>
            <div class="fields-count">字段数: {{ (f.structure?.fields?.length) || f.fields?.length || 0 }}</div>
            <div class="updated">更新时间: {{ formatDate(f.updated_at || f.updateTime) }}</div>
            <div class="sample" v-if="sampleFields(f).length">
              <span class="sample-label">字段示例:</span>
              <span class="sample-items">{{ sampleFields(f).join(', ') }}</span>
            </div>
          </div>
          <div class="card-actions" @click.stop>
            <el-button-group>
              <el-button size="small" type="primary" @click="editForm(f)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(f)">删除</el-button>
            </el-button-group>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <div v-if="!formsStore.forms.length && !formsStore.loading.list" class="empty">暂无表单</div>
    <div v-else class="pagination-wrapper">
      <el-pagination
        background
        layout="prev, pager, next"
        :page-size="pageSize"
        :current-page="currentPage"
        :total="formsStore.forms.length"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useFormsStore } from '../../stores/forms'
import { onMounted, ref, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'

const router = useRouter()
const formsStore = useFormsStore()

onMounted(() => { if (!formsStore.forms.length) formsStore.loadForms() })

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)

const pagedForms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return formsStore.forms.slice(start, start + pageSize.value)
})

function onPageChange(page) {
  currentPage.value = page
}

// 删除后若当前页超出范围，回调到最后一页
watch(
  () => formsStore.forms.length,
  (len) => {
    const maxPage = Math.max(1, Math.ceil(len / pageSize.value))
    if (currentPage.value > maxPage) currentPage.value = maxPage
  }
)

function openForm(form) {
  router.push(`/extractions/form/${form.id}`)
}

function editForm(form) {
  router.push(`/forms/edit/${form.id}`)
}

async function handleDelete(form) {
  try {
    await ElMessageBox.confirm(
      `确定要删除表单"${form.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await formsStore.deleteForm(form.id)
    ElMessage.success('删除成功')
    // 触发 watch 来调整当前页
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error?.message || error))
    }
  }
}

function getVisibilityLabel(form) {
  // If form has userId (or creator_id) and it's not empty, it's personal
  // Otherwise it's public
  const userId = form.userId || form.creator_id || form.creatorId
  if (userId != null && userId !== '') {
    return '个人'
  }
  return '公开'
}

function getVisibilityTagType(form) {
  const userId = form.userId || form.creator_id || form.creatorId
  if (userId != null && userId !== '') {
    return 'info'
  }
  return 'success'
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
.form-card { margin-bottom: 16px; transition: transform .15s ease; display: flex; flex-direction: column; }
.form-card:hover { transform: translateY(-3px); }
.card-content { cursor: pointer; flex: 1; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.form-card .title { font-weight: 600; font-size: 14px; flex: 1; }
.visibility-tag { flex-shrink: 0; margin-left: 8px; }
.form-card .meta, .form-card .fields-count, .form-card .updated { font-size: 12px; color: #666; margin-bottom: 4px; }
.form-card .sample { margin-top: 6px; font-size: 12px; color: #555; }
.sample-label { font-weight: 500; }
.card-actions { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter); display: flex; justify-content: center; }
.empty { text-align: center; padding: 40px 0; color: #888; }
.pagination-wrapper { margin-top: 12px; display: flex; justify-content: center; }
</style>
