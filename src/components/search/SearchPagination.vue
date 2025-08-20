<template>
  <div class="search-pagination">
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      small
      background
      class="compact-pagination"
    />
  </div>
</template>

<script setup>
defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  total: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'size-change', 'current-change']);

function handleSizeChange(size) {
  emit('size-change', size);
}

function handleCurrentChange(page) {
  emit('current-change', page);
}
</script>

<style scoped>
.search-pagination {
  display: flex;
  justify-content: center;
  padding: var(--spacing-md) 0;
  margin-top: auto;
}

.compact-pagination {
  border-radius: var(--border-radius-md);
}

:deep(.compact-pagination .el-pagination__total) {
  color: var(--text-color-secondary);
  font-size: 13px;
}

:deep(.compact-pagination .el-pagination__sizes .el-select .el-input__wrapper) {
  border-radius: var(--border-radius-sm);
  height: 28px;
}

:deep(.compact-pagination .el-pager li) {
  border-radius: var(--border-radius-sm);
  margin: 0 2px;
  height: 28px;
  line-height: 28px;
  min-width: 28px;
}

:deep(.compact-pagination .el-pager li.is-active) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.compact-pagination .btn-prev),
:deep(.compact-pagination .btn-next) {
  border-radius: var(--border-radius-sm);
  height: 28px;
  line-height: 28px;
  margin: 0 2px;
}

:deep(.compact-pagination .btn-prev:hover),
:deep(.compact-pagination .btn-next:hover) {
  color: var(--primary-color);
}
</style>
