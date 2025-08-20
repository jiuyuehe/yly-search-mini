<template>
  <div class="filter-sidebar">
    <div class="filter-header">
      <h3>筛选条件</h3>
      <el-button text type="primary" @click="resetFilters" size="small">
        重置
      </el-button>
    </div>
    
    <div class="filter-sections">
      <!-- 文件空间 -->
      <div class="filter-section">
        <div class="section-title" @click="toggleSection('fileSpace')">
          <span>文件空间</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.fileSpace }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.fileSpace" class="section-content">
          <el-checkbox-group v-model="filters.fileSpace" class="checkbox-group">
            <el-checkbox 
              v-for="space in filterOptions.fileSpaces" 
              :key="space.value" 
              :label="space.value"
              class="filter-checkbox"
            >
              {{ space.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 创建者 -->
      <div class="filter-section">
        <div class="section-title" @click="toggleSection('creators')">
          <span>创建者</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.creators }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.creators" class="section-content">
          <el-checkbox-group v-model="filters.creators" class="checkbox-group">
            <el-checkbox 
              v-for="creator in filterOptions.creators" 
              :key="creator.value" 
              :label="creator.value"
              class="filter-checkbox"
            >
              {{ creator.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 时间范围 -->
      <div class="filter-section">
        <div class="section-title" @click="toggleSection('timeRange')">
          <span>时间范围</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.timeRange }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.timeRange" class="section-content">
          <div class="time-filter">
            <el-radio-group v-model="filters.timeRange" size="small" class="time-radio-group">
              <el-radio label="all">全部时间</el-radio>
              <el-radio label="today">今天</el-radio>
              <el-radio label="week">本周</el-radio>
              <el-radio label="month">本月</el-radio>
              <el-radio label="year">本年</el-radio>
              <el-radio label="custom">自定义</el-radio>
            </el-radio-group>
            <div v-if="filters.timeRange === 'custom'" class="custom-time">
              <el-date-picker
                v-model="filters.customTimeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                class="date-picker"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 文件大小 -->
      <div class="filter-section">
        <div class="section-title" @click="toggleSection('fileSize')">
          <span>文件大小</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.fileSize }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.fileSize" class="section-content">
          <el-checkbox-group v-model="filters.fileSize" class="checkbox-group">
            <el-checkbox label="small" class="filter-checkbox">小于 1MB</el-checkbox>
            <el-checkbox label="medium" class="filter-checkbox">1MB - 10MB</el-checkbox>
            <el-checkbox label="large" class="filter-checkbox">10MB - 100MB</el-checkbox>
            <el-checkbox label="xlarge" class="filter-checkbox">大于 100MB</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 历史版本 -->
      <div class="filter-section">
        <div class="section-title" @click="toggleSection('versions')">
          <span>历史版本</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.versions }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.versions" class="section-content">
          <el-checkbox-group v-model="filters.versions" class="checkbox-group">
            <el-checkbox label="latest" class="filter-checkbox">仅最新版本</el-checkbox>
            <el-checkbox label="all" class="filter-checkbox">包含历史版本</el-checkbox>
            <el-checkbox label="archived" class="filter-checkbox">已归档版本</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 标签 -->
      <div class="filter-section">
        <div class="section-title" @click="toggleSection('tags')">
          <span>标签</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.tags }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.tags" class="section-content">
          <el-checkbox-group v-model="filters.tags" class="checkbox-group">
            <el-checkbox 
              v-for="tag in filterOptions.tags" 
              :key="tag.value" 
              :label="tag.value"
              class="filter-checkbox"
            >
              {{ tag.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 文件格式 -->
      <div class="filter-section">
        <div class="section-title" @click="toggleSection('formats')">
          <span>文件格式</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.formats }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.formats" class="section-content">
          <el-checkbox-group v-model="filters.formats" class="checkbox-group">
            <el-checkbox 
              v-for="format in filterOptions.formats" 
              :key="format.value" 
              :label="format.value"
              class="filter-checkbox"
            >
              {{ format.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { useSearchStore } from '../../stores/search';

const searchStore = useSearchStore();

const expandedSections = reactive({
  fileSpace: true,
  creators: false,
  timeRange: false,
  fileSize: false,
  versions: false,
  tags: false,
  formats: true
});

const filters = reactive({
  fileSpace: [],
  creators: [],
  timeRange: 'all',
  customTimeRange: null,
  fileSize: [],
  versions: ['latest'],
  tags: [],
  formats: []
});

const filterOptions = reactive({
  fileSpaces: [
    { label: '个人空间', value: 'personal' },
    { label: '团队空间', value: 'team' },
    { label: '公共空间', value: 'public' }
  ],
  creators: [
    { label: 'Alice Smith', value: 'alice' },
    { label: 'Bob Johnson', value: 'bob' },
    { label: 'Carol Wilson', value: 'carol' }
  ],
  tags: [
    { label: '重要', value: 'important' },
    { label: '待审核', value: 'pending' },
    { label: '已完成', value: 'completed' }
  ],
  formats: [
    { label: 'PDF', value: 'pdf' },
    { label: 'Word', value: 'docx' },
    { label: 'Excel', value: 'xlsx' },
    { label: 'PowerPoint', value: 'pptx' },
    { label: '图片', value: 'image' },
    { label: '视频', value: 'video' }
  ]
});

function toggleSection(section) {
  expandedSections[section] = !expandedSections[section];
}

function resetFilters() {
  Object.assign(filters, {
    fileSpace: [],
    creators: [],
    timeRange: 'all',
    customTimeRange: null,
    fileSize: [],
    versions: ['latest'],
    tags: [],
    formats: []
  });
}

// Watch filters and apply to store
watch(filters, (newFilters) => {
  searchStore.updateFilters(newFilters);
}, { deep: true });
</script>

<style scoped>
.filter-sidebar {
  width: 280px;
  background-color: var(--background-color);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color-light);
  background-color: var(--background-color-light);
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.filter-sections {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.filter-section {
  border-bottom: 1px solid var(--border-color-light);
}

.filter-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  font-weight: 500;
  color: var(--text-color-primary);
  background-color: var(--background-color);
  transition: background-color 0.2s ease;
}

.section-title:hover {
  background-color: var(--background-color-light);
}

.toggle-icon {
  transition: transform 0.2s ease;
  color: var(--text-color-secondary);
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.section-content {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--background-color);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.filter-checkbox {
  margin: 0;
  padding: var(--spacing-xs) 0;
}

:deep(.filter-checkbox .el-checkbox__label) {
  font-size: 14px;
  color: var(--text-color-secondary);
  padding-left: var(--spacing-sm);
}

:deep(.filter-checkbox .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.time-filter {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.time-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

:deep(.time-radio-group .el-radio) {
  margin: 0;
  padding: var(--spacing-xs) 0;
}

:deep(.time-radio-group .el-radio__label) {
  font-size: 14px;
  color: var(--text-color-secondary);
  padding-left: var(--spacing-sm);
}

:deep(.time-radio-group .el-radio__input.is-checked .el-radio__inner) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.custom-time {
  margin-top: var(--spacing-sm);
}

.date-picker {
  width: 100%;
}

:deep(.date-picker .el-input__wrapper) {
  border-radius: var(--border-radius-sm);
  border-color: var(--border-color);
}
</style>
     