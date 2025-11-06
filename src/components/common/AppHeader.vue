<template>
  <div class="app-header">
    <div class="header-content">
      <div class="logo">
        <router-link to="/" class="logo-link">
          <h2>YLY Search</h2>
        </router-link>
      </div>
      
      <nav class="nav-menu">
        <el-menu
          mode="horizontal"
          :default-active="activeIndex"
          @select="handleMenuSelect"
          :ellipsis="false"
          router
        >
          <el-menu-item index="/">
            <el-icon><Search /></el-icon>
            <span>文档搜索</span>
          </el-menu-item>
          
          <el-menu-item index="/forms">
            <el-icon><Document /></el-icon>
            <span>表单管理</span>
          </el-menu-item>
          
          <el-menu-item index="/extractions">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据管理</span>
          </el-menu-item>

          <el-menu-item index="/stats">
            <el-icon><TrendCharts /></el-icon>
            <span>统计分析</span>
          </el-menu-item>

          <el-menu-item index="/labeling">
            <el-icon><CollectionTag /></el-icon>
            <span>标签管理</span>
          </el-menu-item>

          <el-menu-item index="/diff">
            <el-icon><DocumentCopy /></el-icon>
            <span>文件对比</span>
          </el-menu-item>
        </el-menu>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Search, Document, DataAnalysis, TrendCharts, CollectionTag, DocumentCopy } from '@element-plus/icons-vue';

const route = useRoute();

const activeIndex = computed(() => {
  const path = route.path;
  if (path.startsWith('/forms')) return '/forms';
  if (path.startsWith('/extractions')) return '/extractions';
  if (path.startsWith('/stats')) return '/stats';
  if (path.startsWith('/labeling')) return '/labeling';
  if (path.startsWith('/diff')) return '/diff';
  return '/';
});

function handleMenuSelect(index) {
  // Navigation is handled by router
}
</script>

<style scoped>
.app-header {
  background-color: white;
  border-bottom: var(--border-width-thin) solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
  color: inherit;
}

.logo h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: var(--font-size-display);
  font-weight: 600;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.el-menu {
  border-bottom: none;
}

.el-menu--horizontal .el-menu-item {
  height: 60px;
  line-height: 60px;
}
</style>