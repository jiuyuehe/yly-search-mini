<template>
  <div class="data-labeling-view">
    <AppHeader />
    <div class="view-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>数据标签分类管理</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="view-content">
      <div class="content-container">
        <!-- Left: Theme Tree -->
        <div class="tree-panel">
          <div class="panel-header">
            <h3>主题分类</h3>
            <el-button type="primary" size="small" @click="handleAddTheme">
              <el-icon><Plus /></el-icon>
              新增主题
            </el-button>
          </div>
          <div class="tree-content" v-loading="loadingThemes">
            <el-tree
              :data="themeTreeData"
              :props="treeProps"
              node-key="id"
              :expand-on-click-node="false"
              :highlight-current="true"
              @node-click="handleNodeClick"
              default-expand-all
              class="theme-tree"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <span class="node-label">{{ data.name }}</span>
                  <span class="node-actions">
                    <el-button
                      type="primary"
                      size="small"
                      text
                      @click.stop="handleEdit(data)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      text
                      @click.stop="handleDelete(data)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </span>
                </div>
              </template>
            </el-tree>
          </div>
        </div>

        <!-- Right: Theme Detail -->
        <div class="detail-panel">
          <div class="panel-header">
            <h3>{{ selectedTheme ? '主题详情' : '选择主题查看详情' }}</h3>
          </div>
          <div class="detail-content" v-if="selectedTheme">
            <el-form :model="themeForm" label-width="100px" class="theme-form">
              <el-form-item label="主题名称">
                <el-input v-model="themeForm.name" placeholder="请输入主题名称" />
              </el-form-item>
              <el-form-item label="主题描述">
                <el-input
                  v-model="themeForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入主题描述"
                />
              </el-form-item>
              <el-form-item label="标签管理">
                <div class="labels-section">
                  <div class="labels-header">
                    <el-button type="primary" size="small" @click="handleAddLabel">
                      <el-icon><Plus /></el-icon>
                      添加标签
                    </el-button>
                  </div>
                  <div class="labels-list">
                    <div
                      v-for="label in themeForm.labels"
                      :key="label.id"
                      class="label-item"
                    >
                      <div class="label-content">
                        <el-tag
                          :type="label.enabled ? 'primary' : 'info'"
                          closable
                          @close="handleRemoveLabel(label)"
                        >
                          {{ label.name }}
                        </el-tag>
                        <span v-if="label.synonyms" class="synonyms">
                          同义词: {{ label.synonyms }}
                        </span>
                      </div>
                      <div class="label-actions">
                        <el-switch
                          v-model="label.enabled"
                          active-text="启用"
                          inactive-text="禁用"
                          size="small"
                        />
                        <el-button
                          type="primary"
                          size="small"
                          text
                          @click="handleEditLabel(label)"
                        >
                          编辑
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSaveTheme">保存</el-button>
                <el-button @click="handleCancelEdit">取消</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-empty v-else description="请从左侧选择一个主题" />
        </div>
      </div>
    </div>

    <!-- Add/Edit Theme Dialog -->
    <el-dialog
      v-model="themeDialogVisible"
      :title="editingThemeId ? '编辑主题' : '新增主题'"
      width="500px"
    >
      <el-form :model="themeDialogForm" label-width="100px">
        <el-form-item label="主题名称" required>
          <el-input v-model="themeDialogForm.name" placeholder="请输入主题名称" />
        </el-form-item>
        <el-form-item label="主题描述">
          <el-input
            v-model="themeDialogForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入主题描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="themeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmTheme">确定</el-button>
      </template>
    </el-dialog>

    <!-- Add/Edit Label Dialog -->
    <el-dialog
      v-model="labelDialogVisible"
      :title="editingLabelId ? '编辑标签' : '新增标签'"
      width="500px"
    >
      <el-form :model="labelDialogForm" label-width="100px">
        <el-form-item label="标签名称" required>
          <el-input v-model="labelDialogForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="同义词">
          <el-input
            v-model="labelDialogForm.synonyms"
            placeholder="请输入同义词，用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="labelDialogForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="labelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmLabel">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import AppHeader from '../components/common/AppHeader.vue';
import { aiService } from '../services/aiService';

// State
const loadingThemes = ref(false);
const themes = ref([]);
const selectedTheme = ref(null);
const themeDialogVisible = ref(false);
const labelDialogVisible = ref(false);
const editingThemeId = ref(null);
const editingLabelId = ref(null);

// Forms
const themeForm = reactive({
  name: '',
  description: '',
  labels: []
});

const themeDialogForm = reactive({
  name: '',
  description: ''
});

const labelDialogForm = reactive({
  name: '',
  synonyms: '',
  enabled: true
});

// Tree props
const treeProps = {
  children: 'children',
  label: 'name'
};

// Computed
const themeTreeData = computed(() => {
  return themes.value.map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    labels: theme.labels || theme.tags || []
  }));
});

// Methods
async function loadThemes() {
  loadingThemes.value = true;
  try {
    const res = await aiService.listThemesPage({ pageNo: 1, pageSize: 1000 });
    if (res.code === 200 && res.data) {
      themes.value = res.data.list || [];
    }
  } catch (error) {
    console.error('Failed to load themes:', error);
    ElMessage.error('加载主题失败');
  } finally {
    loadingThemes.value = false;
  }
}

function handleNodeClick(data) {
  selectedTheme.value = data;
  Object.assign(themeForm, {
    name: data.name,
    description: data.description || '',
    labels: data.labels || []
  });
}

function handleAddTheme() {
  editingThemeId.value = null;
  themeDialogForm.name = '';
  themeDialogForm.description = '';
  themeDialogVisible.value = true;
}

function handleEdit(data) {
  editingThemeId.value = data.id;
  themeDialogForm.name = data.name;
  themeDialogForm.description = data.description || '';
  themeDialogVisible.value = true;
}

async function handleDelete(data) {
  try {
    await ElMessageBox.confirm('确定要删除此主题吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const res = await aiService.deleteTheme(data.id);
    if (res.code === 200) {
      ElMessage.success('删除成功');
      await loadThemes();
      if (selectedTheme.value?.id === data.id) {
        selectedTheme.value = null;
      }
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete theme error:', error);
      ElMessage.error('删除失败');
    }
  }
}

async function handleConfirmTheme() {
  if (!themeDialogForm.name.trim()) {
    ElMessage.warning('请输入主题名称');
    return;
  }

  try {
    const payload = {
      name: themeDialogForm.name,
      description: themeDialogForm.description || ''
    };

    let res;
    if (editingThemeId.value) {
      res = await aiService.updateTheme({ id: editingThemeId.value, ...payload });
    } else {
      res = await aiService.createTheme(payload);
    }

    if (res.code === 200) {
      ElMessage.success(editingThemeId.value ? '更新成功' : '创建成功');
      themeDialogVisible.value = false;
      await loadThemes();
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (error) {
    console.error('Save theme error:', error);
    ElMessage.error('操作失败');
  }
}

function handleAddLabel() {
  if (!selectedTheme.value) {
    ElMessage.warning('请先选择一个主题');
    return;
  }
  editingLabelId.value = null;
  labelDialogForm.name = '';
  labelDialogForm.synonyms = '';
  labelDialogForm.enabled = true;
  labelDialogVisible.value = true;
}

function handleEditLabel(label) {
  editingLabelId.value = label.id;
  labelDialogForm.name = label.name;
  labelDialogForm.synonyms = label.synonyms || '';
  labelDialogForm.enabled = label.enabled !== false;
  labelDialogVisible.value = true;
}

async function handleConfirmLabel() {
  if (!labelDialogForm.name.trim()) {
    ElMessage.warning('请输入标签名称');
    return;
  }

  try {
    const payload = {
      themeId: selectedTheme.value.id,
      name: labelDialogForm.name,
      description: labelDialogForm.synonyms || '',
      enabled: labelDialogForm.enabled
    };

    let res;
    if (editingLabelId.value) {
      res = await aiService.updateThemeLabel({ id: editingLabelId.value, ...payload });
    } else {
      res = await aiService.createThemeLabel(payload);
    }

    if (res.code === 200) {
      ElMessage.success(editingLabelId.value ? '更新成功' : '添加成功');
      labelDialogVisible.value = false;
      await loadThemes();
      // Refresh selected theme
      const updated = themes.value.find(t => t.id === selectedTheme.value.id);
      if (updated) {
        handleNodeClick(updated);
      }
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (error) {
    console.error('Save label error:', error);
    ElMessage.error('操作失败');
  }
}

async function handleRemoveLabel(label) {
  try {
    await ElMessageBox.confirm('确定要删除此标签吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const res = await aiService.deleteThemeLabel(label.id);
    if (res.code === 200) {
      ElMessage.success('删除成功');
      await loadThemes();
      const updated = themes.value.find(t => t.id === selectedTheme.value.id);
      if (updated) {
        handleNodeClick(updated);
      }
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Remove label error:', error);
      ElMessage.error('删除失败');
    }
  }
}

async function handleSaveTheme() {
  if (!selectedTheme.value) return;

  try {
    const payload = {
      id: selectedTheme.value.id,
      name: themeForm.name,
      description: themeForm.description || ''
    };

    const res = await aiService.updateTheme(payload);
    if (res.code === 200) {
      ElMessage.success('保存成功');
      await loadThemes();
    } else {
      ElMessage.error(res.message || '保存失败');
    }
  } catch (error) {
    console.error('Save theme error:', error);
    ElMessage.error('保存失败');
  }
}

function handleCancelEdit() {
  if (selectedTheme.value) {
    handleNodeClick(selectedTheme.value);
  }
}

// Lifecycle
onMounted(() => {
  loadThemes();
});
</script>

<style scoped>
.data-labeling-view {
  min-height: 100vh;
  background-color: var(--background-page);
}

.view-header {
  padding: 20px 24px;
  background-color: var(--background-color);
  border-bottom: var(--border-width-thin) solid var(--border-color);
}

.view-content {
  padding: 24px;
}

.content-container {
  display: flex;
  gap: 24px;
  height: calc(100vh - 160px);
}

.tree-panel {
  flex: 0 0 320px;
  background: var(--background-color);
  border: var(--border-width-thin) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

.detail-panel {
  flex: 1;
  background: var(--background-color);
  border: var(--border-width-thin) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: var(--border-width-thin) solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-color-primary);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.theme-tree {
  background: transparent;
}

:deep(.el-tree-node__content) {
  height: 36px;
  border-radius: var(--border-radius-md);
  margin-bottom: 4px;
}

:deep(.el-tree-node__content:hover) {
  background-color: var(--primary-color-lighter);
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
}

.tree-node {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 8px;
}

.node-label {
  flex: 1;
  font-size: var(--font-size-md);
}

.node-actions {
  display: none;
}

.tree-node:hover .node-actions {
  display: flex;
  gap: 4px;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.theme-form {
  max-width: 800px;
}

.labels-section {
  width: 100%;
}

.labels-header {
  margin-bottom: 16px;
}

.labels-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--background-color-light);
  border: var(--border-width-thin) solid var(--border-color-light);
  border-radius: var(--border-radius-md);
}

.label-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.synonyms {
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
}

.label-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
