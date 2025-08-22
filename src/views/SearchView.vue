<template>
  <div class="search-view">
    <AppHeader />
    <div class="search-container">
    <!-- Left sidebar with filters -->
    <div class="filter-sidebar" :class="{ 'collapsed': !showFilters }">
      <filter-sidebar ref="filterSidebarRef" v-if="showFilters" />
      <!-- <div class="sidebar-toggle" @click="toggleFilters">
        <span>{{ showFilters ? '◀' : '▶' }}</span>
      </div> -->
    </div>

    <!-- Right content area -->
    <div class="search-content">
      <div class="search-content-inner">
       
        <search-box @search="handleSearch" />

         <FilterToggleSummary
          :show="showFilters"
          @toggle="handleToggleFilters"
          @clear="handleClearFilters"
          @remove="handleRemoveFilter"
        />
        
        <!-- Search result tabs -->
        <search-result-tabs 
          :activeTab="activeTab" 
          :counts="tabCounts" 
          @tab-change="handleTabChange" 
        />
        
        <!-- Search results -->
        <div class="search-results">
          <search-result-item 
            v-for="(item, index) in searchResults" 
            :key="item.id" 
            :item="item"
            v-model:selected="selectedItems[item.id]"
            :search-query="searchStore.query"
            @click="navigateToPreview(item)"
          />
          
          <el-empty v-if="searchResults.length === 0" description="No results found" />
        </div>
        
        <!-- Pagination and action buttons -->
        <div class="search-footer">
          <div class="selection-actions" v-if="hasSelectedItems">
            <el-button type="primary" @click="downloadSelected">Download Selected</el-button>
            <el-button @click="exportSelected">Export Results</el-button>
          </div>
          <search-pagination 
            v-model:currentPage="currentPage"
            :total="total" 
            :pageSize="pageSize"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSearchStore } from '../stores/search';
import AppHeader from '../components/common/AppHeader.vue';
import FilterSidebar from '../components/search/FilterSidebar.vue';
import SearchBox from '../components/search/SearchBox.vue';
import SearchResultTabs from '../components/search/SearchResultTabs.vue';
import SearchResultItem from '../components/search/SearchResultItem.vue';
import SearchPagination from '../components/search/SearchPagination.vue';
import FilterToggleSummary from '../components/search/FilterToggleSummary.vue';
import { toPreviewLite, normalizeFile } from '../constants/fileModel';

const router = useRouter();
const searchStore = useSearchStore();

// UI state
const showFilters = ref(true);
const activeTab = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const selectedItems = ref({});

// 新增：侧栏 ref
const filterSidebarRef = ref(null);

// Computed properties
const searchResults = computed(() => searchStore.getFilteredResults(activeTab.value));
const total = computed(() => searchStore.getTotalCount);
const tabCounts = computed(() => searchStore.getTabCounts);
const hasSelectedItems = computed(() => Object.values(selectedItems.value).some(item => item));

// Methods
function handleSearch(query, searchType, imageFile) {
  // 这里衔接：收到子组件事件后调用 Pinia 中的 search 动作
  // imageFile 在图片搜索模式下会被传递到 service 形成 multipart/form-data
  searchStore.search(query, searchType, imageFile);
  currentPage.value = 1;
}

function handleToggleFilters(show) {
  showFilters.value = show;
}

function handleClearFilters() {
  try { filterSidebarRef.value?.resetFilters?.(); } catch { /* ignore reset error */ }
  // 重置 store
  searchStore.resetFilters();
}

function handleRemoveFilter(tag) {
  const f = { ...searchStore.filters };
  if (Array.isArray(f[tag.key])) {
    f[tag.key] = f[tag.key].filter(v => v !== tag.value);
  } else if (tag.key === 'timeRange') {
    f.timeRange = 'all';
  } else if (tag.key === 'versions') {
    if (Array.isArray(f.versions)) {
      f.versions = f.versions.filter(v => v !== tag.value);
      if (!f.versions.length) f.versions = ['latest'];
    }
  }
  searchStore.updateFilters(f);
}

function navigateToPreview(file) {
  if (!file) return;
  const norm = normalizeFile(file);
  const fc = norm.fileCategory;
  const id = norm.fileId;
  const fileLite = toPreviewLite(norm);
  const encodeObj = (obj) => { try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); } catch { return ''; } };
  const fEncoded = encodeObj(fileLite);
  router.push({
    name: 'preview',
    params: { fc, id },
    query: { retureBtn: true, f: fEncoded },
    state: { file: fileLite }
  }).catch(()=>{});
}

function handleSizeChange(size) {
  pageSize.value = size;
  searchStore.updatePageSize(size);
}

function handleCurrentChange(page) {
  currentPage.value = page;
  searchStore.updateCurrentPage(page);
}

function downloadSelected() {
  const ids = getSelectedIds();
  searchStore.downloadFiles(ids);
}

function exportSelected() {
  const ids = getSelectedIds();
  searchStore.exportResults(ids);
}

function getSelectedIds() {
  return Object.keys(selectedItems.value).filter(id => selectedItems.value[id]);
}

function handleTabChange(tab) {
  activeTab.value = tab;
  searchStore.setActiveTab(tab);
  currentPage.value = 1;
}

onMounted(() => {
  searchStore.loadInitialData();
});
</script>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.search-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.filter-sidebar {
  background-color: #f5f7fa;
  transition: width 0.3s;
  position: relative;
  overflow-y: auto;
  border-right: 1px solid #dcdfe6;
}

.filter-sidebar.collapsed {
  width: 30px;
}

.sidebar-toggle {
  position: absolute;
  top: 20px;
  right: 10px;
  cursor: pointer;
  background-color: #ffffff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 0 0 0; /* 去除左右 padding 让内层真正居中 */
}

.search-content-inner {
  width: 900px;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0 20px; /* 内部左右留出内容呼吸区 */
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.search-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 4px;
  border-top: 1px solid #ebeef5;
}
</style>