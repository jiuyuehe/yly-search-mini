<template>
  <div class="search-view">
    <AppHeader />
    <div class="search-container">
  <ExportDialog v-model="showExportDialog" :ids="exportIds" />
    <!-- Left sidebar with filters (default hidden) -->
    <div class="filter-sidebar" :class="{ 'collapsed': !showFilters }">
      <filter-sidebar ref="filterSidebarRef" v-if="showFilters" />
    </div>

    <!-- Right content area -->
    <div class="search-content">
      <div class="search-content-inner">
       
        <search-box @search="handleSearch" />

        <div class="summary-row">
          <FilterToggleSummary
            :show="showFilters"
            @toggle="handleToggleFilters"
            @clear="handleClearFilters"
            @remove="handleRemoveFilter"
          />
          <div class="extra-actions">
            <el-tooltip :content="showTagCloud ? '显示列表' : '显示标签云'" placement="bottom">
              <el-button size="small" circle @click.stop="toggleCloud">
                <el-icon><component :is="showTagCloud ? List : Cloudy" /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        
        <!-- Search result tabs (hidden for image search) -->
        <search-result-tabs 
          v-if="!searchStore.isImageSearch"
          :activeTab="activeTab" 
          :counts="tabCounts" 
          @tab-change="handleTabChange" 
        />
        
  <!-- view-bar removed; actions moved into FilterToggleSummary slot -->
        <TagCloud v-if="showTagCloud" @tag-click="handleTagClick" />
        <div v-if="!showTagCloud" class="search-results" :class="{ 'grid-layout': searchStore.isImageSearch }">
          <search-result-item
            v-for="item in searchResults"
            :key="item.id"
            :item="item"
            v-model:selected="selectedItems[item.id]"
            :search-query="searchStore.query"
            :display-mode="searchStore.isImageSearch ? 'grid' : 'list'"
            @click="navigateToPreview(item, $event)"
          />
          <el-empty v-if="searchResults.length === 0" description="No results found" />
        </div>
        
        <!-- Pagination and action buttons -->
  <div class="search-footer" v-if="!showTagCloud">
          <div class="selection-actions" v-if="hasSelectedItems">
            <el-button type="primary" @click="downloadSelected">导出选中文件</el-button>
            <el-button @click="exportSelected">导出结果集</el-button>
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
import { List, Cloudy } from '@element-plus/icons-vue';
import { useSearchStore } from '../stores/search';
import AppHeader from '../components/common/AppHeader.vue';
import FilterSidebar from '../components/search/FilterSidebar.vue';
    import ExportDialog from '../components/search/ExportDialog.vue';
import SearchBox from '../components/search/SearchBox.vue';
import SearchResultTabs from '../components/search/SearchResultTabs.vue';
import TagCloud from '../components/search/TagCloud.vue';
import SearchResultItem from '../components/search/SearchResultItem.vue';
import SearchPagination from '../components/search/SearchPagination.vue';
import FilterToggleSummary from '../components/search/FilterToggleSummary.vue';
import { normalizeFile } from '../constants/fileModel';
import { navigateToPreview as goPreview } from '../services/navigation';

const searchStore = useSearchStore();

// UI state
    const showExportDialog = ref(false);
    const exportIds = ref([]);
const showFilters = ref(false); // 默认隐藏
const showTagCloud = ref(false); // 默认显示标签云（无搜索条件）
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
function handleSearch(query, searchType, imageFile, options) {
  // options 现在可能包含 precisionMode
  searchStore.search(query, searchType, imageFile, options || null);
  currentPage.value = 1;
  // if(query && query.trim()) { showTagCloud.value=false; } else if(!searchStore.tagSearchActive) { showTagCloud.value=true; }
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

function navigateToPreview(file, evt) {
  if (!file) return;
  const norm = normalizeFile(file);
  const newTab = evt && (evt.ctrlKey || evt.metaKey || evt.button === 1);
  goPreview(norm, { newTab });
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
  exportIds.value = ids;
  showExportDialog.value = true;
}

function getSelectedIds() {
  return Object.keys(selectedItems.value).filter(id => selectedItems.value[id]);
}

function handleTabChange(tab) {
  activeTab.value = tab;
  searchStore.setActiveTab(tab);
  currentPage.value = 1;
}

function handleTagClick(tag){
  showTagCloud.value=false;
  searchStore.pagination.currentPage=1;
  searchStore.searchFilesByTags([tag]);
}

function toggleCloud(){ showTagCloud.value = !showTagCloud.value; }

onMounted(async () => {
  await searchStore.loadInitialData();
  // 加载标签云（首次）
  searchStore.fetchTagCloud(true);
});
</script>

<style scoped>
.search-view { display: flex; flex-direction: column; height: 100vh; }
.search-container { display: flex; flex: 1; overflow: hidden; }
.filter-sidebar { background-color: #f5f7fa; transition: width 0.3s; position: relative; overflow-y: auto; border-right: 1px solid #dcdfe6; }
.filter-sidebar.collapsed { width: 30px; }
.sidebar-toggle { position: absolute; top: 20px; right: 10px; cursor: pointer; background-color: #ffffff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
.search-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 20px 0 0 0; }
.search-content-inner { width: 900px; max-width: 100%; margin: 0 auto; display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 0 20px; }
.search-results { flex: 1; overflow-y: auto; padding: 10px 0; }
.search-results.grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.search-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1px solid #ebeef5; }
.summary-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px;flex-wrap:wrap;}
.extra-actions{display:flex;align-items:center;gap:8px;}
</style>