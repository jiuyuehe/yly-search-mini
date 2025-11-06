<template>
  <div class="forms-view">
    <AppHeader />
    <div class="view-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>表单管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="view-content">
      <FormsManager @form-selected="onFormSelected" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import AppHeader from '../components/common/AppHeader.vue';
import FormsManager from '../components/forms/FormsManager.vue';

const router = useRouter();

function onFormSelected(form) {
  // Can be used for specific actions when form is selected
  // debug log removed
}
</script>

<style scoped>
.forms-view {
  min-height: 100vh;
  background-color: var(--background-page);
}

.view-header {
  padding: 20px 24px;
  background-color: var(--background-color);
  border-bottom: var(--border-width-thin) solid var(--border-color);
  box-shadow: 0 1px 3px rgba(var(--color-black-rgb), 0.05);
}

.view-header :deep(.el-breadcrumb__inner) {
  color: var(--text-color-secondary);
  font-weight: 500;
}

.view-header :deep(.el-breadcrumb__inner.is-link:hover) {
  color: var(--primary-color);
}

.view-content {
  padding: 0;
}
</style>