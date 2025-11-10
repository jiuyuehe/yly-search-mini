<template>
  <div class="extractions-view">
    <AppHeader />
    <div class="view-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>数据管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">表单列表</h2>
      </div>
      <div class="toolbar-right">
        <el-button size="small" type="success" @click="goToCreateForm">新增表单</el-button>
        <el-button size="small" @click="goToLabeling">标签管理</el-button>
        <el-button size="small" @click="goToStats">统计分析</el-button>
      </div>
    </div>

    <div class="view-content">
      <FormsCards />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import AppHeader from '../components/common/AppHeader.vue';
import FormsCards from '../components/extractions/FormsCards.vue';

const router = useRouter();

function goToCreateForm() {
  router.push('/forms/create');
}

function goToLabeling() {
  router.push('/labeling');
}

function goToStats() {
  router.push('/stats');
}
</script>

<style scoped>
.extractions-view {
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--background-color);
  border-bottom: var(--border-width-thin) solid var(--border-color-lighter);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-heading);
}

.view-content {
  padding: 0;
}
</style>