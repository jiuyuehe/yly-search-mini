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