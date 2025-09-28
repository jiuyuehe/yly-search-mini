<template>
  <div class="extraction-detail">
    <div class="detail-header">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="info-item">
            <span class="label">抽取ID:</span>
            <span class="value">{{ extraction.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">文档ID:</span>
            <el-link type="primary" @click="viewDocument">{{ extraction.document_id }}</el-link>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <span class="label">状态:</span>
            <el-tag :type="getStatusType(extraction.status)">
              {{ getStatusText(extraction.status) }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
      

    </div>

    <div class="detail-content">
      <h4>抽取数据</h4>

            <div class="action-buttons" v-if="!editable">
        <!-- 1. 默认展示 JSON，并把切换按钮放第一个 -->
        <el-button @click="toggleJsonView">{{ showJson ? '关闭JSON' : '查看JSON' }}</el-button>
        <!-- 2. 第二个按钮：表单查看（切换为表单视图） -->
        <el-button @click="switchToForm">表单查看</el-button>
        <!-- 表单视图时，出现“编辑表单”按钮，点击进入编辑模式（由父组件处理 editable） -->
        <el-button v-if="!showJson" type="primary" @click="$emit('edit')">编辑表单</el-button>
        <el-button @click="exportData">导出数据</el-button>
      </div>
      
      <div class="action-buttons" v-else>
        <!-- 编辑态也保持按钮顺序：先 JSON 切换，再表单查看，后操作按钮 -->
        <el-button @click="toggleJsonView">{{ showJson ? '关闭JSON' : '查看JSON' }}</el-button>
        <el-button @click="switchToForm">表单查看</el-button>
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" @click="save">保存修改</el-button>
      </div>
      <!-- 无论是否有模板，都渲染结构化编辑器；模板为空时组件会基于数据自动推断 schema -->
      <div v-if="!showJson">
        <ExtractionResultForm
          :extracted-data="localData"
          :editable="editable"
          @update="updateData"
        />
      </div>
      <div v-else class="json-view">
        <pre class="json-display">{{ prettyJson }}</pre>
      </div>
    </div>

    <div class="detail-footer">
      <div class="timestamps">
        <div class="timestamp-item">
          <span class="label">创建时间:</span>
          <span class="value">{{ formatDate(extraction.created_at) }}</span>
        </div>
        <div class="timestamp-item">
          <span class="label">更新时间:</span>
          <span class="value">{{ formatDate(extraction.updated_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { useFormsStore } from '../../stores/forms';
import { useExtractionsStore } from '../../stores/extractions';
import ExtractionResultForm from '../ai/formExtraction/ExtractionResultForm.vue';

const props = defineProps({
  extraction: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update', 'edit', 'save', 'cancel']);

const router = useRouter();
const formsStore = useFormsStore();
const extractionsStore = useExtractionsStore();

const localData = ref({}); // 展示与编辑用的结构化对象（合并解析后的结果）
const rawDataText = ref('');
const showJson = ref(true); // 默认展示 JSON 视图

// 计算用于 JSON 视图展示的字符串
const prettyJson = computed(() => {
  try { return JSON.stringify(localData.value || {}, null, 2); } catch { return '{}'; }
});

// 表单结构：后端或 store 可能存储在 form.structure 或 form.structure_result
const formStructure = computed(() => {
  // 兼容后端不同命名：form_id / formId
  const fid = props.extraction.form_id || props.extraction.formId;
  if (!fid) return null;
  const form = formsStore.formById(fid);
  if (!form) return null;
  return form.structure || form.structure_result || form.structureResult || null;
});

onMounted(() => {
  initializeData();
});

watch(() => props.extraction.fields, () => { initializeData(); }, { deep: true });
watch(() => props.extraction.extracted_data, () => { initializeData(); }, { deep: true });

function initializeData() {
  // 初始化优先级：
  // 1. 新格式：fields 为 JSON 字符串数组（合并）
  // 2. 旧格式：_fields 数组（name/value）
  // 3. 旧格式：fields 数组（name/value 对象）
  // 4. extracted_data 原始对象
  // 新保存格式：extraction.fields 是字符串数组，每个元素为一段 JSON 字符串，需解析合并
  try { /* debug removed */ } catch {}

  // 统一解析 fields：支持 string | object | (string|object)[]
  const fld = props.extraction.fields;
  if (fld && (typeof fld === 'string' || Array.isArray(fld) || typeof fld === 'object')) {
    const merged = {};
    const arr = Array.isArray(fld) ? fld : [fld];
    let parsedAny = false;
    arr.forEach((item, idx) => {
      if (typeof item === 'string') {
        try {
          const obj = JSON.parse(item);
          if (obj && typeof obj === 'object') {
            Object.assign(merged, obj);
            parsedAny = true;
          }
        } catch (e) {
          console.warn('[ExtractionDetail] 第 ' + idx + ' 条 fields(JSON字符串) 解析失败', e, item);
        }
      } else if (item && typeof item === 'object') {
        Object.assign(merged, item);
        parsedAny = true;
      }
    });
    if (parsedAny) {
      localData.value = merged;
      rawDataText.value = JSON.stringify(merged, null, 2);
      return;
    }
  }
  // 兼容旧格式：_fields 或 fields 为 name/value 数组
  if (Array.isArray(props.extraction._fields) && props.extraction._fields.length > 0) {
    const flat = {};
    props.extraction._fields.forEach(f => { if (f && f.name) flat[f.name] = f.value; });
    localData.value = { ...flat };
    rawDataText.value = JSON.stringify(flat, null, 2);
    return;
  }
  if (Array.isArray(props.extraction.fields) && props.extraction.fields.length > 0 && typeof props.extraction.fields[0] === 'object') {
    const flat = {};
    props.extraction.fields.forEach(f => { if (f && f.name) flat[f.name] = f.value; });
    localData.value = { ...flat };
    rawDataText.value = JSON.stringify(flat, null, 2);
    return;
  }
  // 兜底使用 extracted_data
  localData.value = { ...(props.extraction.extracted_data || {}) };
  rawDataText.value = JSON.stringify(localData.value, null, 2);
}

function updateData(newData) {
  // 递归表单回传的整体对象结构
  localData.value = { ...(newData || {}) };
  rawDataText.value = JSON.stringify(localData.value, null, 2);
  emit('update', localData.value);
}

function save() {
  let dataToSave;
  
  if (formStructure.value) {
    dataToSave = localData.value; // 结构化对象
  } else {
    try { dataToSave = JSON.parse(rawDataText.value); }
    catch { ElMessage.error('JSON格式错误，请检查数据格式'); return; }
  }
  
  emit('save', dataToSave);
}

function viewDocument() {
  router.push(`/preview/doc/${props.extraction.document_id}`);
}

function toggleJsonView() {
  showJson.value = !showJson.value;
}

function switchToForm() {
  showJson.value = false;
}

async function exportData() {
  try {
    await extractionsStore.exportExtractions([props.extraction.id], 'json');
    ElMessage.success('导出成功');
  } catch {
    ElMessage.error('导出失败');
  }
}

function getStatusType(status) {
  const types = {
    completed: 'success',
    pending: 'warning', 
    error: 'danger'
  };
  return types[status] || 'info';
}

function getStatusText(status) {
  const texts = {
    completed: '已完成',
    pending: '处理中',
    error: '失败'
  };
  return texts[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}
</script>

<style scoped>
.extraction-detail {
  padding: 20px;
}

.detail-header {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-item .label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
  margin-right: 10px;
}

.info-item .value {
  color: #303133;
}

.action-buttons {
  margin-top: 20px;
  text-align: right;
}

.detail-content {
  margin-bottom: 30px;
}

.detail-content h4 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.raw-data {
  margin-top: 20px;
}

.raw-data h5 {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 14px;
}

.json-display {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-footer {
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.timestamps {
  display: flex;
  gap: 30px;
}

.timestamp-item {
  display: flex;
  align-items: center;
}

.timestamp-item .label {
  font-weight: 600;
  color: #909399;
  margin-right: 10px;
}

.timestamp-item .value {
  color: #606266;
  font-size: 14px;
}
</style>