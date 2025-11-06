<template>
  <div class="file-diff-view">
    <AppHeader />
    <div class="view-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>文件对比</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="view-content">
      <div class="toolbar">
        <div class="file-selectors">
          <div class="file-selector">
            <label>文件A:</label>
            <el-input
              v-model="fileAName"
              placeholder="文件A名称"
              size="small"
              style="width: 200px;"
            />
            <el-upload
              :show-file-list="false"
              :before-upload="handleFileAUpload"
              accept=".txt,.js,.ts,.vue,.jsx,.tsx,.json,.xml,.html,.css,.scss,.md"
            >
              <el-button size="small" type="primary">
                <el-icon><Upload /></el-icon>
                选择文件
              </el-button>
            </el-upload>
          </div>
          <div class="file-selector">
            <label>文件B:</label>
            <el-input
              v-model="fileBName"
              placeholder="文件B名称"
              size="small"
              style="width: 200px;"
            />
            <el-upload
              :show-file-list="false"
              :before-upload="handleFileBUpload"
              accept=".txt,.js,.ts,.vue,.jsx,.tsx,.json,.xml,.html,.css,.scss,.md"
            >
              <el-button size="small" type="primary">
                <el-icon><Upload /></el-icon>
                选择文件
              </el-button>
            </el-upload>
          </div>
        </div>
        <div class="toolbar-actions">
          <el-select v-model="outputFormat" size="small" style="width: 120px;" @change="generateDiff">
            <el-option label="并排对比" value="side-by-side" />
            <el-option label="行内对比" value="line-by-line" />
          </el-select>
          <el-button size="small" @click="loadSample">加载示例</el-button>
          <el-button size="small" @click="clearAll">清空</el-button>
        </div>
      </div>

      <div class="diff-container">
        <div v-if="diffHtml" v-html="diffHtml" class="diff-content"></div>
        <el-empty v-else description="请上传文件或加载示例查看对比" />
      </div>

      <div class="diff-stats" v-if="stats.additions > 0 || stats.deletions > 0">
        <el-card>
          <div class="stats-content">
            <div class="stat-item">
              <span class="label">新增:</span>
              <span class="value addition">+{{ stats.additions }}</span>
            </div>
            <div class="stat-item">
              <span class="label">删除:</span>
              <span class="value deletion">-{{ stats.deletions }}</span>
            </div>
            <div class="stat-item">
              <span class="label">修改:</span>
              <span class="value modification">~{{ stats.modifications }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import * as Diff2Html from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import * as Diff from 'diff';
import AppHeader from '../components/common/AppHeader.vue';

// State
const fileAName = ref('');
const fileBName = ref('');
const oldCode = ref('');
const newCode = ref('');
const outputFormat = ref('side-by-side');
const diffHtml = ref('');

const stats = ref({
  additions: 0,
  deletions: 0,
  modifications: 0
});

// Methods
function handleFileAUpload(file) {
  fileAName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    oldCode.value = e.target.result;
    generateDiff();
  };
  reader.readAsText(file);
  return false; // Prevent auto upload
}

function handleFileBUpload(file) {
  fileBName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    newCode.value = e.target.result;
    generateDiff();
  };
  reader.readAsText(file);
  return false; // Prevent auto upload
}

function loadSample() {
  fileAName.value = 'sample-old.js';
  fileBName.value = 'sample-new.js';
  
  oldCode.value = `function hello(name) {
  console.log('Hello, ' + name);
  return name;
}

const user = {
  name: 'John',
  age: 30
};

function processUser(user) {
  if (!user) {
    return null;
  }
  return user.name;
}

// Old implementation
const result = hello('World');
console.log(result);`;

  newCode.value = `function hello(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Greeted: \${name}\`;
}

const user = {
  name: 'John',
  age: 30,
  email: 'john@example.com'
};

function processUser(user) {
  if (!user) {
    throw new Error('User is required');
  }
  return {
    name: user.name,
    age: user.age
  };
}

// New implementation with async
async function greetUser() {
  const result = hello('World');
  console.log(result);
  return result;
}

greetUser();`;

  generateDiff();
  ElMessage.success('已加载示例文件');
}

function clearAll() {
  fileAName.value = '';
  fileBName.value = '';
  oldCode.value = '';
  newCode.value = '';
  diffHtml.value = '';
  stats.value = {
    additions: 0,
    deletions: 0,
    modifications: 0
  };
}

function generateDiff() {
  if (!oldCode.value && !newCode.value) {
    diffHtml.value = '';
    stats.value = { additions: 0, deletions: 0, modifications: 0 };
    return;
  }

  try {
    // Create unified diff using diff library
    // Empty strings for oldHeader and newHeader as they're not needed for display
    const diff = Diff.createPatch(
      fileAName.value || 'File A',
      oldCode.value,
      newCode.value,
      '', // oldHeader - not displayed
      '', // newHeader - not displayed
      { context: 3 }
    );

    // Generate HTML from diff
    diffHtml.value = Diff2Html.html(diff, {
      outputFormat: outputFormat.value,
      drawFileList: false,
      matching: 'lines',
      highlight: true
    });

    calculateStats();
  } catch (error) {
    console.error('Failed to generate diff:', error);
    ElMessage.error('生成差异对比失败');
  }
}

function calculateStats() {
  if (!oldCode.value || !newCode.value) {
    stats.value = { additions: 0, deletions: 0, modifications: 0 };
    return;
  }


  const changes = Diff.diffLines(oldCode.value, newCode.value);
  
  let additions = 0;
  let deletions = 0;

  changes.forEach(change => {
    const count = change.value.split('\n').length - 1;
    if (change.added) {
      additions += count;
    } else if (change.removed) {
      deletions += count;
    }
  });

  // Estimate modifications as min of additions and deletions
  // Note: This is a simplified calculation. More accurate diff analysis
  // would require matching changed lines, but this gives a reasonable estimate.
  const modifications = Math.min(additions, deletions);

  stats.value = { additions, deletions, modifications };
}
</script>

<style scoped>
.file-diff-view {
  min-height: 100vh;
  background-color: var(--background-page);
  display: flex;
  flex-direction: column;
}

.view-header {
  padding: 20px 24px;
  background-color: var(--background-color);
  border-bottom: var(--border-width-thin) solid var(--border-color);
}

.view-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  background: var(--background-color);
  border: var(--border-width-thin) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: var(--shadow-sm);
}

.file-selectors {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.file-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-selector label {
  font-weight: 500;
  color: var(--text-color-primary);
  min-width: 50px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.diff-container {
  flex: 1;
  background: var(--background-color);
  border: var(--border-width-thin) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: auto;
  box-shadow: var(--shadow-sm);
  padding: 16px;
}

.diff-content {
  min-height: 100%;
}

:deep(.d2h-wrapper) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: var(--font-size-sm);
}

:deep(.d2h-file-header) {
  background: var(--background-color-light);
  border-color: var(--border-color);
  padding: 8px 12px;
  border-radius: var(--border-radius-md);
  margin-bottom: 8px;
}

:deep(.d2h-code-linenumber) {
  background: var(--background-color-light);
  border-color: var(--border-color-light);
  color: var(--text-color-secondary);
}

:deep(.d2h-code-line) {
  padding: 2px 8px;
}

:deep(.d2h-ins) {
  background-color: var(--status-success-bg);
}

:deep(.d2h-del) {
  background-color: var(--diff-removed-bg);
}

:deep(.d2h-info) {
  background-color: var(--diff-added-bg);
  color: var(--text-color-primary);
}

:deep(.d2h-ins .d2h-code-line-ctn) {
  background-color: var(--status-success-border);
}

:deep(.d2h-del .d2h-code-line-ctn) {
  background-color: var(--background-danger-muted);
}

:deep(.d2h-code-side-linenumber) {
  background: var(--background-color-light);
}

.diff-stats {
  position: sticky;
  bottom: 20px;
  z-index: 10;
}

.stats-content {
  display: flex;
  gap: 32px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item .label {
  font-size: var(--font-size-md);
  color: var(--text-color-secondary);
  font-weight: 500;
}

.stat-item .value {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.value.addition {
  color: var(--status-success-strong);
}

.value.deletion {
  color: var(--status-danger-strong);
}

.value.modification {
  color: var(--status-warning-strong);
}
</style>
