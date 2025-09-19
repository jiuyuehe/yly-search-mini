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
        <div class="section-title" @click="toggleSection('fileCategory')">
          <span>文件空间</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.fileCategory }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.fileCategory" class="section-content">
          <el-checkbox-group v-model="filters.fileCategory" class="checkbox-group">
            <el-checkbox 
              v-for="space in filterOptions.fileCategory" 
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
        <el-select
          v-model="filters.creator"
          filterable
          remote
          reserve-keyword
          :remote-method="querySearchCreators"
          :loading="loadingCreators"
          placeholder="搜索创建者并选择"
          class="full-width-select"
          size="small"
        >
          <el-option
            v-for="item in creatorOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="chosen-tags" v-if="filters.creator">
          <el-tag closable size="small" @close="clearCreator">{{ findCreatorLabel(filters.creator) }}</el-tag>
        </div>
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
              <el-radio label="">全部时间</el-radio>
              <el-radio label="now-1d/d">今天</el-radio>
              <el-radio label="now-1w/d">本周</el-radio>
              <el-radio label="now-1M/d">本月</el-radio>
              <el-radio label="now-6M/d">半年</el-radio>
              <el-radio label="now-1y/d">本年</el-radio>
              <el-radio label="custom">自定义</el-radio>
            </el-radio-group>
            <div v-if="filters.timeRange === 'custom'" class="custom-time">
              <el-date-picker
              style="width: -webkit-fill-available;"
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
          <el-radio-group v-model="filters.fileSize" class="file-size-group">
            <el-radio label="0-10M" class="filter-radio">小于 10MB</el-radio>
            <el-radio label="10-100M" class="filter-radio">10MB - 100MB</el-radio>
            <el-radio label="100-1G" class="filter-radio">100MB - 1GB</el-radio>
            <el-radio label="1G-" class="filter-radio">大于 1GB</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 历史版本 -->
      <div class="filter-section" v-if="false">
        <div class="section-title" @click="toggleSection('versions')">
          <span>文件夹与版本</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.versions }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.versions" class="section-content">
          <div class="checkbox-group">
            <el-checkbox v-model="filters.folder" class="filter-checkbox">包含文件夹</el-checkbox>
            <el-checkbox v-model="filters.hasHistory" class="filter-checkbox">包含历史版本</el-checkbox>
          </div>
        </div>
      </div>

      <!-- 标签 -->
      <div class="filter-section">
        <div class="section-title" @click="toggleSection('tags')" v-if="searchStore.precisionMode === 3">
          <span>标签</span>
          <el-icon class="toggle-icon" :class="{ expanded: expandedSections.tags }">
            <ArrowDown />
          </el-icon>
        </div>
        <div v-show="expandedSections.tags" class="section-content">
          <template v-if="searchStore.precisionMode === 3">
          <el-select
            v-model="filters.tag"
            filterable
            remote
            reserve-keyword
            :remote-method="querySearchTags"
            :loading="loadingTags"
            placeholder="搜索标签并选择"
            class="full-width-select"
            size="small"
            ref="tagSelectRef"
            @visible-change="onTagDropdownVisibleChange"
            @change="onTagsChange"
          >
            <el-option v-for="item in tagOptions" :key="item.value" :label="item.label" :value="item.value" />
            <!-- footer as a disabled el-option that contains a button to load more -->
            <el-option v-if="tagTotal > (tagOptions.length || 0)" :key="'__load_more_footer'" :label="'加载更多'" :value="'__load_more_footer'" disabled>
              <template #default>
                <div class="select-footer">
                  <el-button type="text" @click.stop.prevent="handleLoadMoreClick" class="load-more-btn">加载更多</el-button>
                </div>
              </template>
            </el-option>
          </el-select>
          <div class="chosen-tags" v-if="filters.tag">
            <el-tag closable size="small" @close="() => { filters.tag = ''; tagPage.value = 1; querySearchTags(''); }">{{ findTagLabel(filters.tag) }}</el-tag>
          </div>
          </template>
          <template v-else>
            <!-- 当非精准模式时隐藏并重置标签相关状态 -->
            <div v-if="false"></div>
          </template>
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
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { useSearchStore } from '../../stores/search';
import { searchService } from '../../services/search';

const searchStore = useSearchStore();

const expandedSections = reactive({
  fileCategory: true,
  creators: true,
  timeRange: true,
  fileSize: true,
  versions: true,
  tags: true,
  formats: true
});

const filters = reactive({
  fileCategory: [],
  creator: '',
  timeRange: 'all',
  customTimeRange: null,
  fileSize: '',
  hasHistory: false,
  folder: false,
  tag: '',
  formats: []
});

const filterOptions = reactive({
  fileCategory: [
    { label: '个人空间', value: 'personal' },
    { label: '团队空间', value: 'group' },
    { label: '公共空间', value: 'public' },
    { label: 'Nas空间', value: 'nas' }
  ],
  creators: [
    { label: 'Alice Smith', value: '98' },
    { label: 'Bob Johnson', value: '99' },
    { label: 'Carol Wilson', value: '100' }
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

const creatorOptions = ref([]); // 当前搜索到的创建者候选
const tagOptions = ref([]);     // 当前搜索到的标签候选
const loadingCreators = ref(false);
const loadingTags = ref(false);
// tags pagination state
const tagPage = ref(1);
const tagSize = ref(10);
const tagTotal = ref(0);
const tagQuery = ref('');
const tagSelectRef = ref(null);
async function querySearchCreators(query) {
  loadingCreators.value = true;
  const all = await searchService.getCreators();
  // 本地过滤（后端接口无关键字参数）
  const q = (query || '').trim().toLowerCase();
  let filtered = all;
  if (q) filtered = all.filter(u => u.label.toLowerCase().includes(q) || String(u.value).includes(q));
  // 限制最多 50 条避免下拉过长
  creatorOptions.value = filtered.slice(0, 50);
  loadingCreators.value = false;
  // 合并到全局映射方便其他组件展示
  creatorOptions.value.forEach(o => {
    if (!searchStore.filterOptions.creators.find(c => c.value === o.value)) {
      searchStore.filterOptions.creators.push(o);
    }
  });
}

// fetch a page of tags; if append=true append to existing options
async function fetchTagPage(query, page = 1, append = false) {
  loadingTags.value = true;
  try {
    const res = await searchService.getLabels(query || '', page, tagSize.value);
    const items = Array.isArray(res.items) ? res.items.map(i => ({ value: i.value, label: i.label })) : [];
    tagTotal.value = Number(res.total) || (append ? (tagTotal.value || 0) : items.length);
    tagPage.value = Number(res.page) || page;
    if (append) {
      // merge unique
      const existing = new Map(tagOptions.value.map(i => [i.value, i]));
      items.forEach(it => { if (!existing.has(it.value)) existing.set(it.value, it); });
      tagOptions.value = Array.from(existing.values());
    } else {
      tagOptions.value = items;
    }
  // do not inject sentinel here; footer button will handle load more
    // merge to global filterOptions.tags
    tagOptions.value.forEach(o => {
      if (o.value !== '__load_more__' && !searchStore.filterOptions.tags.find(t => t.value === o.value)) {
        searchStore.filterOptions.tags.push(o);
      }
    });
  } catch (e) {
    console.warn('fetchTagPage failed', e);
  } finally {
    loadingTags.value = false;
  }
}

async function querySearchTags(query) {
  tagQuery.value = query || '';
  // start from first page on new query
  tagPage.value = 1;
  await fetchTagPage(tagQuery.value, tagPage.value, false);
}

// handle selection changes for single-select
function onTagsChange(newVal) {
  // when user clears, reset pagination
  if (!newVal) {
    tagPage.value = 1;
    tagQuery.value = '';
    // refresh first page (optional)
    fetchTagPage('', 1, false);
  }
  // otherwise, selection is just a single value; nothing special to do
}

function handleLoadMoreClick() {
  if (loadingTags.value) return;
  const nextPage = (tagPage.value || 1) + 1;
  if (tagTotal.value && tagOptions.value.length >= tagTotal.value) return;
  fetchTagPage(tagQuery.value, nextPage, true);
}

function onTagDropdownVisibleChange(visible) {
  if (visible) {
    // if no options loaded yet, load first page via querySearchTags (resets state)
    if (!tagOptions.value || tagOptions.value.length === 0) {
      querySearchTags('');
    }
  }
}

// no global click handler needed now; we render a footer inside the select dropdown

function findCreatorLabel(val) {
  const item = [...creatorOptions.value, ...(searchStore.filterOptions.creators||[])].find(i => i.value === val);
  return item?.label || val;
}
function findTagLabel(val) {
  const item = [...tagOptions.value, ...(searchStore.filterOptions.tags||[])].find(i => i.value === val);
  return item?.label || val;
}
function clearCreator() { filters.creator = ''; }
function removeTagValue(v) { if (filters.tag === v) { filters.tag = ''; tagPage.value = 1; querySearchTags(''); } }

function toggleSection(section) {
  expandedSections[section] = !expandedSections[section];
}

function resetFilters() {
  Object.assign(filters, {
    fileCategory: [],
  creator: '',
    timeRange: 'all',
    customTimeRange: null,
  fileSize: '',
    hasHistory: false,
    folder: false,
  tag: '',
    formats: []
  });
}
defineExpose({ resetFilters /*, getCurrentFilters: () => ({...filters}) */ });

// Watch filters and apply to store
watch(filters, (newFilters) => {
  const selectedTagName = newFilters.tag ? findTagLabel(newFilters.tag) : '';

  // helper to format Date to 'YYYY-MM-DD HH:mm:ss'
  function fmt(d) {
    if (!d) return d;
    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  }

  let customRangeFormatted = null;
  if (newFilters.timeRange === 'custom' && Array.isArray(newFilters.customTimeRange) && newFilters.customTimeRange.length === 2) {
    try {
      const [s, e] = newFilters.customTimeRange;
      customRangeFormatted = [fmt(new Date(s)), fmt(new Date(e))];
    } catch (err) { customRangeFormatted = null; }
  }

  // normalize fileSize into array; accept the new '1G+' token unchanged
  const standardizedFileSize = newFilters.fileSize ? [newFilters.fileSize] : [];

  const payload = {
    fileCategory: [...newFilters.fileCategory],
    creators: newFilters.creator ? [newFilters.creator] : [],
    timeRange: newFilters.timeRange,
    customTimeRange: customRangeFormatted,
    fileSize: standardizedFileSize,
    hasHistory: newFilters.hasHistory,
    folder: newFilters.folder,
    tags: newFilters.tag ? [newFilters.tag] : [],
    // fileAiTag: 传递选中标签的 labelName，后端期望字段
    fileAiTag: selectedTagName,
    formats: [...newFilters.formats]
  };
  searchStore.updateFilters(payload);
}, { deep: true });

// when precision mode changes away from 3, clear tag-related state
watch(() => searchStore.precisionMode, (m) => {
  if (Number(m) !== 3) {
    // clear selected tag and pagination
    filters.tag = '';
    tagOptions.value = [];
    tagPage.value = 1;
    tagTotal.value = 0;
  }
});

// When switching to custom timeRange, provide a sensible default range (last 7 days)
watch(() => filters.timeRange, (val) => {
  if (val === 'custom') {
    try {
      if (!filters.customTimeRange || !Array.isArray(filters.customTimeRange)) {
        const end = new Date();
        const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); // last 7 days including today
        filters.customTimeRange = [start, end];
      }
    } catch (e) { /* ignore */ }
  }
});
</script>

<style scoped>
.filter-sidebar {
  width: 280px;
  background-color: var(--background-color);
  border: 1px solid var(--border-color-light);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  height:100%;
  display:flex;
  flex-direction:column;
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
  flex:1;
  overflow-y:auto;
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

/* file-size radio specific styling: left align like time radios */
.file-size-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-xs);
}

.filter-radio {
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
  min-width: 0;
}

.time-radio-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  /* allow wrapping inside the sidebar to avoid overflow */
  display: block;
  width: 100%;
  max-width: 100%;
  word-break: break-word;
  overflow: hidden;
}

.date-picker {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

:deep(.date-picker .el-input__wrapper) {
  border-radius: var(--border-radius-sm);
  border-color: var(--border-color);
}

.full-width-select { width: 100%; margin-bottom: 8px; }
.chosen-tags { display:flex; flex-wrap:wrap; gap:6px; }

/* load more option style */
:deep(.load-more-option) {
  color: var(--primary-color);
  font-weight: 600;
}

.select-footer{ padding:8px 12px; text-align:center; border-top:1px solid var(--border-color); }
.load-more-btn{ color:var(--primary-color); font-weight:600; }
</style>

