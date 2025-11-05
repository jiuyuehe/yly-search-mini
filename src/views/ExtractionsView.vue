<template>
  <div class="extractions-view">
    <AppHeader />
    <div class="view-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>数据管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="view-content">
      <ExtractionsManager />
    </div>
  </div>
</template>

<script setup>
import AppHeader from '../components/common/AppHeader.vue';
import ExtractionsManager from '../components/extractions/ExtractionsManager.vue';
</script>

<style scoped>
.extractions-view {
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