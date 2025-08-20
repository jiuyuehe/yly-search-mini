<template>
  <div class="ner-panel">
    <div class="panel-header">
      <h3>实体识别</h3>
      <el-button size="small" @click="recognizeEntities">识别实体</el-button>
    </div>
    
    <div class="entities-content">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="entities && Object.keys(entities).length" class="entities-list">
        <div v-if="entities.persons?.length" class="entity-group">
          <h4>人员</h4>
          <el-tag v-for="person in entities.persons" :key="person" type="success">{{ person }}</el-tag>
        </div>
        <div v-if="entities.organizations?.length" class="entity-group">
          <h4>组织</h4>
          <el-tag v-for="org in entities.organizations" :key="org" type="warning">{{ org }}</el-tag>
        </div>
        <div v-if="entities.locations?.length" class="entity-group">
          <h4>地点</h4>
          <el-tag v-for="loc in entities.locations" :key="loc" type="danger">{{ loc }}</el-tag>
        </div>
        <div v-if="entities.dates?.length" class="entity-group">
          <h4>日期</h4>
          <el-tag v-for="date in entities.dates" :key="date" type="info">{{ date }}</el-tag>
        </div>
      </div>
      <el-empty v-else description="点击识别实体按钮开始" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAiToolsStore } from '../../stores/aiTools';

const props = defineProps({
  fileId: {
    type: String,
    required: true
  }
});

const aiToolsStore = useAiToolsStore();
const entities = ref({});
const loading = ref(false);

async function recognizeEntities() {
  loading.value = true;
  try {
    entities.value = await aiToolsStore.getNEREntities(props.fileId);
  } catch (error) {
    console.error('Failed to recognize entities:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ner-panel {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.entities-content {
  flex: 1;
  overflow-y: auto;
}

.entity-group {
  margin-bottom: 15px;
}

.entity-group h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.entity-group .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.entity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
