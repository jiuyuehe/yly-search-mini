<template>
  <div class="form-designer-view">
    <AppHeader />
    <div class="view-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/forms' }">表单管理</el-breadcrumb-item>
        <el-breadcrumb-item>{{ isEdit ? '编辑表单' : '新建表单' }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="view-content">
      <FormDesigner />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '../components/common/AppHeader.vue';
import FormDesigner from '../components/forms/FormDesigner.vue';

const route = useRoute();

const isEdit = computed(() => !!route.params.id);
</script>

<style scoped>
.form-designer-view {
  min-height: 100vh;
  background-color: #F7F8FA;
}

.view-header {
  padding: 20px 24px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.view-header :deep(.el-breadcrumb__inner) {
  color: #6B7280;
  font-weight: 500;
}

.view-header :deep(.el-breadcrumb__inner.is-link:hover) {
  color: #3B82F6;
}

.view-content {
  padding: 0;
}
</style>