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
  background-color: #f5f7fa;
}

.view-header {
  padding: 20px;
  background-color: white;
  border-bottom: 1px solid #ebeef5;
}

.view-content {
  padding: 0;
}
</style>