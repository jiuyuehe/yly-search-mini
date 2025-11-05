<template>
  <div class="search-view">
    <AppHeader />
    <div class="search-container">
      <ExportDialog v-model="showExportDialog" :ids="exportIds" />

      <!-- Left sidebar with filters (default hidden) -->
      <div v-if="uiMode === 'search' && searchStore.searchType !== 'qa'" class="filter-sidebar" :class="{ 'collapsed': !showFilters }">
        <filter-sidebar ref="filterSidebarRef" v-if="showFilters" @tag-click="handleTagClick" />
      </div>

      <!-- Right content area -->
      <div class="search-content">
        <!-- Search mode -->
        <div class="search-content-inner" v-if="uiMode === 'search'">
          <search-box :initial-query="searchStore.query" @search="handleSearch" @mode-change="onModeChange" />

          <div class="summary-row">
            <FilterToggleSummary v-if="searchStore.searchType !== 'qa'"
              :show="showFilters"
              @toggle="handleToggleFilters"
              @clear="handleClearFilters"
              @remove="handleRemoveFilter"
            />
            <div class="extra-actions" v-if="searchStore.searchType !== 'qa'">
                      <template v-if="!searchStore.isImageSearch">
                        <el-tooltip :content="showTagCloud ? '显示列表' : '显示标签云'" placement="bottom">
                          <el-button size="small" circle @click.stop="toggleCloud">
                            <el-icon><component :is="showTagCloud ? List : Cloudy" /></el-icon>
                          </el-button>
                        </el-tooltip>
                      </template>
                      <!-- Image mode controls: grid/list toggle and column count -->
                      <template v-if="searchStore.isImageSearch">
                        <el-tooltip content="切换展示: 网格/列表" placement="bottom">
                          <el-button size="small" circle @click.stop="toggleImageDisplay">
                            <el-icon><component :is="imageDisplayMode === 'grid' ? List : Iphone" /></el-icon>
                          </el-button>
                        </el-tooltip>
                        <el-popover placement="bottom" width="80" trigger="click">
                          <div style="padding:8px 12px; display:flex;align-items:center;">
                            <el-slider v-model="imageGridCols" :min="2" :max="6" :step="1" vertical size="small" height="120px" />
                          </div>
                          <template #reference>
                            <el-button size="small" type="text" icon>
                              列数: {{ imageGridCols }}
                            </el-button>
                          </template>
                        </el-popover>
                      </template>
              <!-- selected count badge -->
              <div v-if="hasSelectedItems" class="selected-badge" style="margin-left:12px; display:flex;align-items:center;gap:8px;">
                <div class="badge-count">已选 {{ selectedCount }}</div>
                <el-button size="mini" type="text" @click.stop="clearSelection">清除</el-button>
              </div>
            </div>
          </div>

           <search-result-tabs v-if="!showTagCloud && !searchStore.isImageSearch && searchStore.searchType !== 'qa'"
              :activeTab="activeTab"
              :counts="tabCounts"
              @tab-change="handleTabChange"
            />

          <TagCloud ref="tagCloudRef" v-if="showTagCloud" @tag-click="handleTagClick" />
          <div v-if="tagSearching" class="tag-searching-indicator">按标签搜索中...</div>

      <div class="results-wrapper" style="position:relative; display:flex; flex-direction:column; flex:1; min-height:0;">
        <div v-if="!showTagCloud && searchStore.searchType !== 'qa'" class="search-results" :class="{ 'grid-layout': searchStore.isImageSearch }" :style="gridStyle">
          <search-result-item
            v-for="(item, idx) in searchResults"
            :key="stableKeyFor(item, idx)"
            :item="item"
            :selected="isSelected(stableKeyFor(item, idx))"
            @update:selected="toggleSelected(stableKeyFor(item, idx), item, $event)"
            @tag-click="handleTagClick"
            :search-query="searchStore.query"
            :display-mode="searchStore.isImageSearch ? imageDisplayMode : 'list'"
            :is-image-search="searchStore.isImageSearch"
            @click="navigateToPreview"
          />
          <el-empty v-if="searchResults.length === 0" description="没有结果" />
        </div>
  <!-- Overlay loading so grid layout isn't affected -->
  <div v-if="searchStore.isImageSearch && searchStore.loading" class="results-overlay" style="pointer-events:auto;">
          <div class="image-loading-center full-area">
            <el-icon class="loading-icon spinner"><component :is="Loading" /></el-icon>
            <div class="loading-text">图片识别中，请稍候...</div>
          </div>
        </div>
      </div>

          <div class="search-footer" v-if="!showTagCloud && searchStore.searchType !== 'qa'">
            <div class="selection-actions" v-if="hasSelectedItems" style="width: 280px;">
              <el-button type="primary" @click="downloadSelected">导出文件</el-button>
              <el-button @click="exportSelected">导出结果集</el-button>
            </div>
            <div class="footer-main">
              <search-pagination
                v-model:currentPage="currentPage"
                :total="total"
                :pageSize="pageSize"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
              <div class="footer-right" v-if="searchStore.searchTime">
                响应时间: {{ (searchStore.searchTime/1000).toFixed(2) }}s
              </div>
            </div>
          </div>
        </div>

        <!-- QA/chat mode -->
        <div v-else class="chat-area" style="width:100%;height:100%;padding:0;">
          <FileChatPanel
            ref="chatPanelRef"
            :defaultUseContext="true"
            :sessionchat="true"
            :showReturn="true"
              chatType="qa"
              @return-to-search="handleReturnToSearch"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, onActivated } from 'vue';
import { useRoute } from 'vue-router';
import { List, Cloudy, Iphone, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
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
import FileChatPanel from '../components/ai/chat/FileChatPanel.vue';
import { normalizeFile } from '../constants/fileModel';
import { navigateToPreview as goPreview } from '../services/navigation';

const searchStore = useSearchStore();

// UI state
    const showExportDialog = ref(false);
    const exportIds = ref([]);
const showFilters = ref(false); // 默认隐藏
const showTagCloud = ref(true); // 默认显示标签云（无搜索条件）
const activeTab = ref('all');
const uiMode = ref('search'); // 'search' | 'qa'
const chatPanelRef = ref(null);
// local pagination mirrors store.pagination so state survives route changes
const currentPage = ref(searchStore.pagination.currentPage || 1);
const pageSize = ref(searchStore.pagination.pageSize || 10);

// 新增：侧栏 ref
const filterSidebarRef = ref(null);
const tagCloudRef = ref(null);
const tagSearching = ref(false);

// Helper to determine if filters object actually contains active criteria
function filtersHaveActive(filters) {
  if (!filters) return false;
  try {
    return Object.entries(filters).some(([k, v]) => {
      if (k === 'timeRange') return v && v !== 'all';
      if (Array.isArray(v)) return v.length > 0;
      return !!v;
    });
  } catch (e) { return false; }
}

// Image display controls
const imageDisplayMode = ref('grid'); // 'grid' or 'list'
const imageGridCols = ref(5); // 5 or 6

function toggleImageDisplay(){ imageDisplayMode.value = imageDisplayMode.value === 'grid' ? 'list' : 'grid'; }
function setImageCols(n){ imageGridCols.value = n; }

// Computed properties
const searchResults = computed(() => {
  const results = searchStore.getFilteredResults(activeTab.value) || [];
  return results;
});

const gridStyle = computed(() => {
  if (!searchStore.isImageSearch || imageDisplayMode.value !== 'grid') return {};
  const cols = imageGridCols.value || 5;
  return { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px' };
});
const total = computed(() => searchStore.getTotalCount);
const tabCounts = computed(() => searchStore.getTabCounts);
// use store's selectedMap as source of truth for counts
const selectedStoredCount = computed(() => searchStore.getSelectedCount);
const hasSelectedItems = computed(() => Number(selectedStoredCount.value) > 0);
const selectedCount = computed(() => selectedStoredCount.value);

// Methods
function handleSearch(query, searchType, imageFile, options) {
  // options 现在可能包含 precisionMode
  if (searchType === 'qa') {
    // switch to QA mode and forward the question to chat panel
    uiMode.value = 'qa';
  // ensure chat panel mounted before sending question
  waitForChatRef(2000).then(() => { try { chatPanelRef.value?.askQuestion?.(query); } catch { /* ignore */ } }).catch(()=>{});
    return;
  }
  // If image search is requested, clear previous UI artifacts before issuing request
  if (searchType === 'image' || imageFile) {
  // clear selected items and hide tag cloud to avoid showing prior list remnants
  searchStore.clearSelected();
    showTagCloud.value = false;
    // reset pagination so visual list doesn't show stale totals
    currentPage.value = 1;
    pageSize.value = searchStore.pagination.pageSize || pageSize.value;
  }
  // hide tag cloud when an explicit search is triggered
  showTagCloud.value = false;
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
  const clearAiTag = () => { f.fileAiTag = ''; if (Array.isArray(f.tags)) f.tags = []; };
  if (Array.isArray(f[tag.key])) {
    f[tag.key] = f[tag.key].filter(v => v !== tag.value);
  } else if (tag.key === 'timeRange') {
    f.timeRange = 'all';
  } else if (tag.key === 'versions') {
    if (Array.isArray(f.versions)) {
      f.versions = f.versions.filter(v => v !== tag.value);
      if (!f.versions.length) f.versions = ['latest'];
    }
  } else if (tag.key === 'fileAiTag' || tag.key === 'tag' || tag.key === 'aiTag') {
    // 移除 AI 标签筛选：同时清空 fileAiTag 与系统 tags
    clearAiTag();
  try { filterSidebarRef.value?.clearTagSelection?.(); } catch {}
  } else if (tag.key === 'tags') {
    // 从系统标签数组移除对应项，若无项则同步清空 fileAiTag
    if (Array.isArray(f.tags)) f.tags = f.tags.filter(v => v !== tag.value);
    if (!f.tags || f.tags.length === 0) f.fileAiTag = '';
  if (!f.fileAiTag) { try { filterSidebarRef.value?.clearTagSelection?.(); } catch {} }
  }
  searchStore.updateFilters(f);
}

function navigateToPreview(file, evt) {
  if (!file) return;
  const norm = normalizeFile(file);
  const newTab = evt && (evt.ctrlKey || evt.metaKey || evt.button === 1);
  // indicate navigation origin so preview can show a back button
  try {
    const state = {
      showTagCloud: showTagCloud.value,
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      activeTab: activeTab.value,
      showFilters: showFilters.value,
      query: searchStore.query,
      filters: searchStore.filters
    };
    sessionStorage.setItem('search_view_state', JSON.stringify(state));
  } catch (e) { /* ignore storage errors */ }
  goPreview(norm, { newTab, retureBtn: true });
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
  // Use store.selectedMap as authoritative source to include selections across pages
  const map = searchStore.selectedMap || {};
  let rows = Object.keys(map).map(k => map[k]).filter(Boolean);
  // fallback: if no persisted selections, try to collect selected keys from current page via stableKey matching
  if (!rows || rows.length === 0) {
    const src = Array.isArray(searchResults.value) ? searchResults.value : [];
    rows = src.map((it, i) => {
      const k = stableKeyFor(it, i);
      if (searchStore.selectedMap && searchStore.selectedMap[k]) return searchStore.selectedMap[k];
      return null;
    }).filter(Boolean);
  }
  if (!rows || !rows.length) { ElMessage.warning('请先选择文件'); return; }
  searchStore.downloadFiles(rows);
}

function clearSelection() {
  searchStore.clearSelected();
}

function exportSelected() {
  // Resolve objects to export similarly to downloadSelected
  const map = searchStore.selectedMap || {};
  let rows = Object.keys(map).map(k => map[k]).filter(Boolean);
  if (!rows || rows.length === 0) {
    const src = Array.isArray(searchResults.value) ? searchResults.value : [];
    rows = src.map((it, i) => {
      const k = stableKeyFor(it, i);
      if (searchStore.selectedMap && searchStore.selectedMap[k]) return searchStore.selectedMap[k];
      return null;
    }).filter(Boolean);
  }
  if (!rows || !rows.length) { ElMessage.warning('请先选择文件'); return; }
  searchStore.exportResults(rows);
}

function getSelectedIds() {
  // Return array of stable keys for selected items (from store.selectedMap)
  try { return Object.keys(searchStore.selectedMap || {}); } catch { return []; }
}

function handleTabChange(tab) {
  activeTab.value = tab;
  searchStore.setActiveTab(tab);
  currentPage.value = 1;
}



function stableKeyFor(item, idx) {
  if (!item) return String(idx || 0);
  // prefer nas identification fields
  if (item.fileCategory === 'nas' || item.nasId || item.nasFilePath || item.nasCode || item.subPath) {
    const nasId = item.nasId || item.nasCode || '';
    const path = item.nasFilePath || item.subPath || '';
    return `nas::${nasId}::${path}`;
  }
  // fallback to composite of category + id
  const id = item.id != null ? item.id : (item.fileId != null ? item.fileId : String(idx || ''));
  const cat = item.fileCategory || item.fc || 'unk';
  return `${cat}::${id}`;
}

function toggleCloud(){ showTagCloud.value = !showTagCloud.value; }

// Check if a stable key is currently selected (based on store.selectedMap)
function isSelected(key) {
  try { return !!(searchStore.selectedMap && searchStore.selectedMap[key]); } catch { return false; }
}

// Toggle selection for an item (key). When selecting, persist full object to store.selectedMap.
function toggleSelected(key, item, val) {
  try {
    const on = !!val;
    if (on) {
      // prefer provided item, fallback to current page or itemsById
      let obj = item || (Array.isArray(searchResults.value) ? searchResults.value.find((it, i) => stableKeyFor(it, i) === key) : null);
      if (!obj) {
        try { const idPart = key.split('::').pop(); obj = searchStore.itemsById[idPart]; } catch(e){}
      }
      if (obj) searchStore.addSelected(key, obj);
    } else {
      searchStore.removeSelected(key);
    }
    // keep local selectedItems UI in sync for current page
    // local UI state is derived from store; no need to update separate local map
  } catch (e) { /* ignore */ }
}

function onModeChange(mode){ uiMode.value = mode === 'qa' ? 'qa' : 'search'; }

function handleReturnToSearch(){
  uiMode.value = 'search';
  try { window.dispatchEvent(new CustomEvent('set-search-type', { detail: searchStore.searchType || 'fullText' })); } catch { /* ignore in non-browser env */ }
}

// wait up to timeoutMs for chatPanelRef to be available
function waitForChatRef(timeoutMs = 2000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (chatPanelRef.value && typeof chatPanelRef.value.askQuestion === 'function') return resolve(true);
      if (Date.now() - start > timeoutMs) return reject(new Error('timeout'));
      setTimeout(tick, 80);
    };
    tick();
  });
}

const route = useRoute();

// Apply URL query params (e.g. ?key=...&fc=...) to prefill filters and trigger a search
function applyUrlParamsIfAny(){
  try{
    const params = route.query || {};
  const rawKey = params.key || params.q || params.query || '';
  const rawFc = params.fc || params.fileSpace || params.space || '';
    const key = rawKey ? String(rawKey).trim() : '';
    const fc = rawFc ? String(rawFc).trim() : '';
    if(!key && !fc) return false;
    // set query first so updateFilters will use it
    if(key) searchStore.query = key;
    // map fc into fileCategory filter (comma-separated allowed) so UI shows correct space filters
    if(fc){
      const arr = fc.split(',').map(s=>s.trim()).filter(Boolean);
      if(arr.length) {
        searchStore.updateFilters({ fileCategory: arr });
      }
    }
    // if only key provided (no filters), run search explicitly
    if(key && !fc){
      searchStore.search(key, 'fullText');
    }
    // hide tag cloud when params drive the search
    showTagCloud.value = false;
    return true;
  }catch(e){ console.warn('applyUrlParamsIfAny failed', e); return false; }
}

async function restoreUIFromSession() {
  try {
  const raw = sessionStorage.getItem('search_view_state');
    if (raw) {
      const s = JSON.parse(raw);
      if (s) {
        // restore pagination and UI flags
        currentPage.value = s.currentPage || currentPage.value;
        pageSize.value = s.pageSize || pageSize.value;
        activeTab.value = s.activeTab || activeTab.value;
        showFilters.value = !!s.showFilters;
        // restore filters and query into store but do not overwrite other store state
        if (s.filters) searchStore.updateFilters(s.filters);
        if (s.query) searchStore.query = s.query;
        // if previously in list view, hide tag cloud. Only trigger a network search
        // if the saved state contains an explicit query or non-empty filters.
        if (!s.showTagCloud) {
          showTagCloud.value = false;
          const hasSavedQuery = !!(s.query && String(s.query).trim());
          const hasSavedFilter = !!s.filters && Object.values(s.filters).some(v => Array.isArray(v) ? v.length > 0 : !!v);
          // restored saved state indicates previous view
          if (hasSavedQuery || hasSavedFilter) {
            // trigger a search to repopulate results with restored query/filters
            setTimeout(() => {
              try { searchStore.search(s.query || '', searchStore.searchType || 'fullText'); } catch (e) {}
            }, 60);
          }
        }
        // clear saved state after restore so subsequent fresh visits are clean
        sessionStorage.removeItem('search_view_state');
        return; // restored from explicit session state, skip further checks
      }
    }
  } catch (e) {
    // ignore parse/storage errors and continue to other restore paths
  }

  // fallback: apply URL params if any
  try { if (applyUrlParamsIfAny()) return; } catch (e) { /* ignore */ }

  // If there are explicit user-driven search conditions, switch to list view.
  // Do NOT hide the tag cloud just because background data (e.g. initial load) populated results.
  try {
    const hasQuery = !!(searchStore.query && String(searchStore.query).trim());
  const hasFilter = filtersHaveActive(searchStore.filters);
  // post-restore checks
    // Only switch to list when there's an actual query or active filters (user intent).
    if (hasQuery || hasFilter) {
      showTagCloud.value = false;
      // If we have conditions but no results yet, trigger a search to repopulate
      const hasResults = Array.isArray(searchStore.results) && searchStore.results.length > 0;
      if (!hasResults) {
        setTimeout(() => {
          try { searchStore.search(searchStore.query || '', searchStore.searchType || 'fullText'); } catch (e) { /* ignore */ }
        }, 60);
      }
    }
  } catch (e) { /* ignore */ }
}
// Register lifecycle hooks synchronously during setup
onActivated(() => { try { restoreUIFromSession(); } catch(e){} });
// watch route changes to catch navigation back into this view (non-keep-alive cases)
watch(() => route.fullPath, (v, old) => { try { restoreUIFromSession(); } catch(e){} });

onMounted(async () => {
  // Sync local UI from store so when returning from preview we keep previous state
  currentPage.value = searchStore.pagination.currentPage || currentPage.value;
  pageSize.value = searchStore.pagination.pageSize || pageSize.value;
  activeTab.value = searchStore.activeTab || activeTab.value;
  showFilters.value = !!searchStore.filters && Object.values(searchStore.filters).some(v => Array.isArray(v)? v.length>0 : !!v);

  

  // Only load initial data when we don't already have results cached in the store
  // Always avoid running an automatic initial search here. If URL/session require a search,
  // restoreUIFromSession() / applyUrlParamsIfAny() will trigger it explicitly.
  if (!Array.isArray(searchStore.results) || searchStore.results.length === 0) {
  // Decide initial view: if URL provides search params, show tag cloud; otherwise show list
  const params = route.query || {};
  const rawKey = params.key || params.q || params.query || '';
  const rawFc = params.fc || params.fileSpace || params.space || '';
  const urlHasSearch = !!(rawKey || rawFc);
  // If URL has search params we should show the list; otherwise default to tag cloud
  showTagCloud.value = !urlHasSearch;
  await searchStore.loadInitialData(false);
  }

  // Ensure tag cloud available but avoid forcing refresh if already present
  if (!Array.isArray(searchStore.tagCloud) || searchStore.tagCloud.length === 0) {
    searchStore.fetchTagCloud(true).catch(()=>{});
  }

  // after initial load and tag cloud fetch attempt to apply URL params / restore from session
  await restoreUIFromSession();
});

function handleTagClick(tag){
  // show UI indicator and call TagCloud handler programmatically (suppress emit)
  try {
  // switch to list view when a tag is clicked (user intentionally searching)
  showTagCloud.value = false;
    tagSearching.value = true;
    // call TagCloud's exposed method if available
    if (tagCloudRef.value && typeof tagCloudRef.value.handleClick === 'function') {
      try { tagCloudRef.value.handleClick(tag, { suppressEmit: true }); }
      catch { /* ignore */ }
    }
    // fall back to store-driven tag search if TagCloud handler didn't run
    try { searchStore.searchFilesByTags([tag]); } catch (e) { /* ignore */ }
  } finally {
    // hide indicator after short delay to cover async search duration
    setTimeout(() => { tagSearching.value = false; }, 600);
  }
}

// selection UI is driven directly from store.selectedMap; no local selectedItems required

// Keep local pagination refs in sync with store and ensure UI page is valid
watch(() => searchStore.pagination.currentPage, (p) => {
  if (typeof p === 'number' && p !== currentPage.value) currentPage.value = p;
});

// When filters change (user interacted with sidebar), switch to list view automatically
watch(() => searchStore.filters, (f) => {
  try {
    const hasFilter = !!f && Object.values(f).some(v => Array.isArray(v) ? v.length > 0 : !!v);
    if (hasFilter) showTagCloud.value = false;
  } catch (e) { /* ignore */ }
}, { deep: true });
watch(() => searchStore.pagination.pageSize, (s) => {
  if (typeof s === 'number' && s !== pageSize.value) pageSize.value = s;
});

// Sync selectedItems -> selectedMap: when an item is selected store its full object, when deselected remove it
// toggleSelected() explicitly updates store; no deep watch needed
// When total changes, ensure currentPage is within valid range; if not, move to last page
watch(() => searchStore.pagination.total, (total) => {
  const sz = pageSize.value || searchStore.pagination.pageSize || 10;
  const tot = Number(total) || 0;
  const maxPage = Math.max(1, Math.ceil(tot / sz));
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
    // propagate to store which will trigger a new search for the corrected page
    try {
      searchStore.updateCurrentPage(maxPage);
    } catch (e) {
      // fallback: directly set store value
      searchStore.pagination.currentPage = maxPage;
    }
  }
});
</script>

<style scoped>
.search-view { 
  display: flex; 
  flex-direction: column; 
  height: 100vh;
  background: #F7F8FA;
}

.search-container { 
  display: flex; 
  flex: 1; 
  overflow: hidden;
  background: #F7F8FA;
}

.filter-sidebar { 
  background-color: #FFFFFF; 
  transition: width 0.3s; 
  position: relative; 
  overflow-y: auto; 
  border-right: 1px solid #E5E7EB;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}

.filter-sidebar.collapsed { 
  width: 30px; 
}

.sidebar-toggle { 
  position: absolute; 
  top: 20px; 
  right: 10px; 
  cursor: pointer; 
  background-color: #FFFFFF; 
  border-radius: 50%; 
  width: 24px; 
  height: 24px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); 
}

.search-content { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden;
}

.search-content-inner { 
  width: 900px; 
  max-width: 100%; 
  margin: 20px auto; 
  display: flex; 
  flex-direction: column; 
  flex: 1; 
  min-height: 0; 
  padding: 0 24px; 
}

.search-results { 
  flex: 1 1 auto; 
  overflow-y: auto; 
  padding: 12px 0; 
  min-height: 0; 
}

.search-results.grid-layout { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 20px; 
  align-items: start; 
}

.search-footer { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 16px 0;
  border-top: 1px solid #E5E7EB;
  background: #FFFFFF;
  margin: 0 -24px;
  padding-left: 24px;
  padding-right: 24px;
}

.summary-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:8px;
  flex-wrap:wrap;
}

.extra-actions{
  display:flex;
  align-items:center;
  gap:8px;
}

.summary-row:empty { 
  display: none; 
}

.image-loading-center{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 10px;width:100%;}
.image-loading-center .loading-icon{font-size:48px;color:var(--primary-color);}
.image-loading-center .loading-text{margin-top:8px;color:var(--text-color-secondary);}
.image-loading-center.full-area{min-height:320px;height:320px;display:flex;align-items:center;justify-content:center;}
.spinner{animation:spin 1s linear infinite;}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

/* Overlay that covers the results area without affecting its layout */
.results-wrapper{position:relative;}
.results-overlay{position:absolute;left:0;top:0;right:0;bottom:60px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.72);z-index:40;border-radius:8px;pointer-events:none;}

/* Tabs row: tabs on left, response time on right. Wrap on small screens. */
.tabs-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; margin-bottom:6px; }
.tabs-row > search-result-tabs{ flex: 1 1 auto; }
.tabs-response-time{ flex: 0 0 auto; color:var(--el-text-color-secondary,#909399); font-size:12px; padding-left:8px; white-space:nowrap; }

@media (max-width: 720px){
  .tabs-row{ flex-direction:column; align-items:flex-start; gap:6px; }
  .tabs-response-time{ padding-left:0; }
}

/* Footer layout: pagination left, response time right */
.footer-main{ display:flex; align-items:center; gap:12px; width:100%; justify-content:space-between; }
.footer-main > search-pagination{ flex: 1 1 auto; }
.footer-right{ flex: 0 0 auto; color:var(--el-text-color-secondary,#909399); font-size:12px; white-space:nowrap; margin-left:8px; }

@media (max-width:720px){
  .footer-main{ flex-direction:row; align-items:center; }
  .footer-right{ margin-left:auto; }
}
</style>