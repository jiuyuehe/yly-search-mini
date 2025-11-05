<template>
  <div class="stats-view">
    <AppHeader />
    <div class="view-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>数据抽取统计分析</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="view-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="stat-card">
          <div class="card-icon" style="background: #3B82F6;">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-label">总抽取次数</div>
            <div class="card-value">{{ stats.summary.totalExtractions }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-icon" style="background: #10B981;">
            <el-icon><Check /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-label">成功率</div>
            <div class="card-value">{{ stats.summary.successRate }}%</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-icon" style="background: #F59E0B;">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-label">平均处理时间</div>
            <div class="card-value">{{ stats.summary.avgProcessingTime }}s</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="card-icon" style="background: #8B5CF6;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-label">今日抽取</div>
            <div class="card-value">{{ stats.summary.todayExtractions }}</div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-card">
          <div class="chart-header">
            <h3>抽取趋势</h3>
          </div>
          <div ref="lineChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3>表单类型分布</h3>
          </div>
          <div ref="pieChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <h3>处理状态</h3>
          </div>
          <div ref="statusChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- Recent Extractions Table -->
      <div class="table-section">
        <div class="section-header">
          <h3>最近抽取记录</h3>
          <el-button size="small" @click="refreshTable">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <el-table
          :data="recentExtractions"
          stripe
          v-loading="tableLoading"
          class="extraction-table"
        >
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="formName" label="表单名称" min-width="120" />
          <el-table-column prop="fileName" label="文件名" min-width="180" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                size="small"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fields" label="字段数" width="80" />
          <el-table-column prop="processingTime" label="处理时间(s)" width="110">
            <template #default="{ row }">
              {{ row.processingTime > 0 ? row.processingTime : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'success'"
                type="primary"
                size="small"
                text
                @click="viewDetail(row)"
              >
                查看
              </el-button>
              <el-button
                v-if="row.status === 'failed'"
                type="danger"
                size="small"
                text
                @click="viewError(row)"
              >
                错误
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
  DataAnalysis,
  Check,
  Timer,
  TrendCharts,
  Refresh
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import AppHeader from '../components/common/AppHeader.vue';
import { statsService } from '../services/statsService';

// State
const stats = reactive({
  summary: {
    totalExtractions: 0,
    successRate: 0,
    avgProcessingTime: 0,
    todayExtractions: 0
  },
  timeSeriesData: [],
  formTypeDistribution: [],
  statusDistribution: []
});

const recentExtractions = ref([]);
const tableLoading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

// Chart refs
const lineChartRef = ref(null);
const pieChartRef = ref(null);
const statusChartRef = ref(null);

let lineChart = null;
let pieChart = null;
let statusChart = null;

// Methods
function getStatusType(status) {
  const types = {
    success: 'success',
    failed: 'danger',
    processing: 'warning'
  };
  return types[status] || 'info';
}

function getStatusText(status) {
  const texts = {
    success: '成功',
    failed: '失败',
    processing: '处理中'
  };
  return texts[status] || status;
}

async function loadStats() {
  try {
    const res = await statsService.getStats();
    if (res.code === 200 && res.data) {
      Object.assign(stats.summary, res.data.summary);
      stats.timeSeriesData = res.data.timeSeriesData;
      stats.formTypeDistribution = res.data.formTypeDistribution;
      stats.statusDistribution = res.data.statusDistribution;
      
      await nextTick();
      initCharts();
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
    ElMessage.error('加载统计数据失败');
  }
}

async function loadRecentExtractions() {
  tableLoading.value = true;
  try {
    const res = await statsService.getRecentExtractions(
      pagination.page,
      pagination.pageSize
    );
    if (res.code === 200 && res.data) {
      recentExtractions.value = res.data.list;
      pagination.total = res.data.total;
    }
  } catch (error) {
    console.error('Failed to load recent extractions:', error);
    ElMessage.error('加载数据失败');
  } finally {
    tableLoading.value = false;
  }
}

function initCharts() {
  initLineChart();
  initPieChart();
  initStatusChart();
}

function initLineChart() {
  if (!lineChartRef.value) return;
  
  if (lineChart) {
    lineChart.dispose();
  }
  
  lineChart = echarts.init(lineChartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['成功', '失败'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: stats.timeSeriesData.map(item => item.date.slice(5)),
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280'
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6'
        }
      }
    },
    series: [
      {
        name: '成功',
        type: 'bar',
        stack: 'total',
        data: stats.timeSeriesData.map(item => item.success),
        itemStyle: {
          color: '#3B82F6'
        }
      },
      {
        name: '失败',
        type: 'bar',
        stack: 'total',
        data: stats.timeSeriesData.map(item => item.failed),
        itemStyle: {
          color: '#EF4444'
        }
      }
    ]
  };
  
  lineChart.setOption(option);
}

function initPieChart() {
  if (!pieChartRef.value) return;
  
  if (pieChart) {
    pieChart.dispose();
  }
  
  pieChart = echarts.init(pieChartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: '#6B7280'
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: stats.formTypeDistribution,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
      }
    ]
  };
  
  pieChart.setOption(option);
}

function initStatusChart() {
  if (!statusChartRef.value) return;
  
  if (statusChart) {
    statusChart.dispose();
  }
  
  statusChart = echarts.init(statusChartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: '70%',
        center: ['50%', '50%'],
        data: stats.statusDistribution,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          formatter: '{b}\n{d}%',
          color: '#374151'
        },
        color: ['#10B981', '#EF4444', '#F59E0B']
      }
    ]
  };
  
  statusChart.setOption(option);
}

function handleResize() {
  lineChart?.resize();
  pieChart?.resize();
  statusChart?.resize();
}

function refreshTable() {
  loadRecentExtractions();
}

function handleSizeChange(size) {
  pagination.pageSize = size;
  loadRecentExtractions();
}

function handleCurrentChange(page) {
  pagination.page = page;
  loadRecentExtractions();
}

function viewDetail(row) {
  ElMessage.info(`查看详情: ${row.formName}`);
  // TODO: Navigate to detail page
}

function viewError(row) {
  ElMessage.warning(`查看错误信息: ${row.fileName}`);
  // TODO: Show error dialog
}

// Lifecycle
onMounted(() => {
  loadStats();
  loadRecentExtractions();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  lineChart?.dispose();
  pieChart?.dispose();
  statusChart?.dispose();
});
</script>

<style scoped>
.stats-view {
  min-height: 100vh;
  background-color: var(--background-page);
}

.view-header {
  padding: 20px 24px;
  background-color: var(--background-color);
  border-bottom: 1px solid var(--border-color);
}

.view-content {
  padding: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color-primary);
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.chart-container {
  width: 100%;
  height: 300px;
}

.table-section {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.extraction-table {
  margin-bottom: 16px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table) {
  --el-table-border-color: var(--border-color-light);
  --el-table-header-bg-color: var(--background-color-light);
  --el-table-header-text-color: var(--text-color-primary);
  --el-table-row-hover-bg-color: var(--primary-color-lighter);
}

:deep(.el-pagination) {
  --el-pagination-button-color: var(--text-color-secondary);
  --el-pagination-hover-color: var(--primary-color);
}
</style>
