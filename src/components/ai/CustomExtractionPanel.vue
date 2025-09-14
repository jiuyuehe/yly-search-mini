<template>
  <div class="custom-extraction-panel">
    <div class="panel-header">
      <h3>自定义提取</h3>
    </div>
    
    <div class="extraction-content">
      <!-- Form Selection Section -->
      <div class="form-selection">
        <div class="form-selection-header">
          <h4>选择抽取表单</h4>
          <div class="form-selection-actions">
            <el-button size="small" type="primary" @click="manageFormsDialog = true">管理表单</el-button>
          </div>
        </div>
        <el-select 
          v-model="selectedFormId" 
          placeholder="请选择表单"
          @change="onFormChange"
          style="width: 100%"
          :loading="formsStore.loading.list"
        >
          <el-option 
            v-for="form in formsStore.formOptions" 
            :key="form.value" 
            :label="form.label" 
            :value="form.value"
          />
        </el-select>
        
        <div v-if="selectedForm" class="form-info">
          <el-alert
            :title="`已选择: ${selectedForm.name}${selectedForm.description ? ' - ' + selectedForm.description : ''}`"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <!-- AI Model Selection -->
    <!-- Extraction Button -->
    <div v-if="selectedForm" class="extraction-action">
        <el-button 
          type="primary" 
          @click="extractInfo" 
          :loading="extracting"
      :disabled="!selectedForm"
        >
          开始抽取
        </el-button>
      </div>
      
      <!-- Extraction Result (support multiple candidates) -->
      <div v-if="Array.isArray(extractionResult) && extractionResult.length" class="extraction-results">
        <h4>抽取结果（候选：{{ extractionResult.length }}）</h4>
        <div class="candidates-list">
          <div v-for="(entry, idx) in extractionResult" :key="idx" class="extraction-result">
            <div class="result-header">
              <h5>候选 {{ idx + 1 }}</h5>
              <div class="result-actions">
                <div class="left-actions">
                  <el-button size="small" @click="editResult(idx)">编辑</el-button>
                  <el-button size="small" @click="clearResult(idx)">清除</el-button>
                </div>
                <div class="right-actions">
                  <el-button size="small" type="primary" @click="confirmResult(idx)" :loading="entry.saving || saving">
                    确认保存
                  </el-button>
                </div>
              </div>
            </div>

            <div class="result-content">
              <ExtractionResultForm
                v-if="selectedForm && entry"
                :form-structure="selectedForm.structure"
                :extracted-data="entry"
                :editable="!!entry.editable"
                @update="(d) => updateResult(d, idx)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Forms Management Dialog (reverted to original manager component) -->
    <el-dialog
      v-model="manageFormsDialog"
      title="表单管理"
      width="70%"
      :before-close="closeFormsDialog"
    >
  <FormsManager :selectable="true" @form-selected="onFormSelected" />
      <template #footer>
        <el-button size="small" @click="closeFormsDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useFormsStore } from '../../stores/forms';
import { useExtractionsStore } from '../../stores/extractions';
import { formsService } from '../../services/formsService';
import ExtractionResultForm from './ExtractionResultForm.vue';
import FormsManager from '../forms/FormsManager.vue';
import { resolveEsId } from '../../utils/esid';

const props = defineProps({
  fileId: { type: [String, Number], required: true },
  file: { type: Object, default: null }
});

const formsStore = useFormsStore();
const extractionsStore = useExtractionsStore();

const selectedFormId = ref(null);
// extractionResult: null or array of entries { fields:[], editable:boolean, saving:boolean }
const extractionResult = ref(null);
// 保留原始后端返回结构(包含 meta)
const rawExtractionPayload = ref(null);
const extracting = ref(false);
const saving = ref(false);
const resultEditable = ref(false);
const manageFormsDialog = ref(false);
// removed model selection & refresh logic

const selectedForm = computed(() => {
  return selectedFormId.value ? formsStore.formById(selectedFormId.value) : null;
});

onMounted(async () => {
  await formsStore.loadForms();
});

function onFormChange() {
  extractionResult.value = null;
  resultEditable.value = false;
}

async function extractInfo() {
  if (!selectedForm.value) {
    ElMessage.warning('请先选择表单');
    return;
  }

  const esId = resolveEsId(props.file, props.fileId);
  if(!esId){
    ElMessage.error('缺少文件标识 (esId)，无法执行抽取');
    return;
  }

  // 清空旧结果
  if (extractionResult.value) {
    extractionResult.value = null;
    resultEditable.value = false;
  }

  extracting.value = true;
  try {
    const result = await formsService.extractTextByForm({
      esId,
      formId: selectedFormId.value,
      timeout: 180000
    });
    console.log('Extraction result:', result);
    rawExtractionPayload.value = result;
    // 规范化为组件需要的 { fields:[{ name,value,confidence,notFound,snippet,offset }] }
    let candidateEntries = [];
    // Priority 1: direct fields array (newer API)
    if (Array.isArray(result?.fields)) {
      candidateEntries = [ { fields: result.fields.map(f => ({ name: f.name, value: f.value ?? '', confidence: f.confidence, notFound: f.notFound, snippet: f.snippet, offset: f.offset })) } ];
    } else if (Array.isArray(result?.data?.fields)) {
      candidateEntries = [ { fields: result.data.fields.map(f => ({ name: f.name, value: f.value ?? '', confidence: f.confidence, notFound: f.notFound, snippet: f.snippet, offset: f.offset })) } ];
    } else if (Array.isArray(result?.formResult) && result.formResult.length && selectedForm.value && Array.isArray(selectedForm.value.structure?.fields)) {
      // Parse each entry in formResult as candidate
      result.formResult.forEach(item => {
        let parsed = null;
        if (typeof item === 'string') {
          try { parsed = JSON.parse(item); } catch (e) {
            try { const cleaned = item.replace(/\n/g,' ').trim(); parsed = JSON.parse(cleaned); } catch { parsed = null; }
          }
        } else if (item && typeof item === 'object') parsed = item;
        if (parsed && typeof parsed === 'object') {
          const fields = selectedForm.value.structure.fields.map(f => ({
            name: f.name,
            value: parsed.hasOwnProperty(f.name) ? parsed[f.name] : '',
            confidence: null,
            notFound: parsed[f.name] === undefined || parsed[f.name] === null || String(parsed[f.name]).trim() === '',
            snippet: '',
            offset: 0
          }));
          candidateEntries.push({ fields, editable: false, saving: false });
        }
      });
    } else {
      const alt = Array.isArray(result?.data) ? result.data : result;
      if (Array.isArray(alt?.fields)) candidateEntries = [ { fields: alt.fields.map(f => ({ name: f.name, value: f.value ?? '', confidence: f.confidence, notFound: f.notFound, snippet: f.snippet, offset: f.offset })) } ];
    }

    extractionResult.value = candidateEntries.length ? candidateEntries : null;
    resultEditable.value = false;
    ElMessage.success('数据抽取完成');
  } catch (error) {
    ElMessage.error('抽取失败: ' + (error.message||error));
    console.error('Extraction failed:', error);
  } finally {
    extracting.value = false;
  }
}

function editResult(index) {
  if (index === undefined || index === null) {
    // backward-compatible: set global editable
    resultEditable.value = true;
    if (Array.isArray(extractionResult.value)) extractionResult.value.forEach(e=> e.editable = true);
    return;
  }
  if (!Array.isArray(extractionResult.value)) return;
  extractionResult.value[index].editable = true;
}

function updateResult(newData, index) {
  // `ExtractionResultForm` emits a flat map of fieldName -> value.
  // Convert it back to the component's expected { fields: [ { name, value, ...meta } ] } shape.
  if (!newData) {
  if (index === undefined || index === null) { extractionResult.value = null; return; }
  if (!Array.isArray(extractionResult.value)) return; extractionResult.value[index] = null; return;
  }

  // If caller already passed the normalized shape, keep it.
  // If caller already passed the normalized shape, keep it.
  if (Array.isArray(newData.fields)) {
    const entry = { fields: newData.fields.map(f=>({ ...f })), editable: false, saving: false };
    if (index === undefined || index === null) { extractionResult.value = [ entry ]; } else { if (!Array.isArray(extractionResult.value)) extractionResult.value = []; extractionResult.value[index] = entry; }
    return;
  }

  // Otherwise assume flat map: { fieldName: value, ... }
  const flat = newData;
  const metaMap = {};
  const rawFields = Array.isArray(rawExtractionPayload.value?.fields) ? rawExtractionPayload.value.fields : Array.isArray(rawExtractionPayload.value?.data?.fields) ? rawExtractionPayload.value.data.fields : [];
  rawFields.forEach(f => { if (f && f.name) metaMap[f.name] = f; });

  const fields = Object.keys(flat).map(name => {
    const meta = metaMap[name] || {};
    return {
      name,
      value: flat[name],
      confidence: meta.confidence,
      notFound: meta.notFound,
      snippet: meta.snippet,
      offset: meta.offset
    };
  });

  const entry = { fields };
  if (index === undefined || index === null) extractionResult.value = { fields };
  else extractionResult.value[index] = entry;
}

async function confirmResult(index) {
  // confirm single entry by index or the first entry if index not provided
  if (!extractionResult.value) return;
  const entry = (index === undefined || index === null) ? (Array.isArray(extractionResult.value) ? extractionResult.value[0] : extractionResult.value) : extractionResult.value[index];
  if (!entry || !Array.isArray(entry.fields)) return;
  entry.saving = true; saving.value = true;
  try {
    const esId = resolveEsId(props.file, props.fileId);
    const formId = selectedFormId.value;
    const fieldsForSave = entry.fields.map(f=>({ name: f.name, value: f.value, confidence: f.confidence, notFound: f.notFound }));
    await formsService.saveExtractionHistory({ esId, formId, fields: fieldsForSave, raw: rawExtractionPayload.value });
    ElMessage.success('抽取结果已保存');
    entry.editable = false;
    // refresh history list so the newly saved record becomes visible
    try { extractionsStore.setPagination(1, extractionsStore.pagination.pageSize); await extractionsStore.loadExtractions({ form_id: formId, document_id: esId }); } catch (err) { console.warn('Failed to reload extraction history after save', err); }
  } catch (error) { ElMessage.error('保存失败: ' + error.message); }
  finally { entry.saving = false; saving.value = false; }
}

function clearResult(index) {
  if (index === undefined || index === null) {
    extractionResult.value = null; rawExtractionPayload.value = null; resultEditable.value = false; return;
  }
  if (!Array.isArray(extractionResult.value)) return; extractionResult.value.splice(index,1);
  if (extractionResult.value.length === 0) { extractionResult.value = null; rawExtractionPayload.value = null; }
}

// refresh removed per latest requirement


function closeFormsDialog() { manageFormsDialog.value = false; }

function onFormSelected(form){
  if(!form) return;
  selectedFormId.value = form.id;
  manageFormsDialog.value = false;
  ElMessage.success('已选择表单: ' + (form.name || form.id));
}
</script>

<style scoped>
.custom-extraction-panel {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
}

.extraction-content {
  flex: 1;
  overflow-y: auto;
}

.extraction-result {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.extraction-result pre {
  margin: 10px 0 0 0;
  font-size: 14px;
}
/* refresh header */
.form-selection-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.form-selection-header h4 { margin:0; font-size:14px; font-weight:600; }
/* Removed inline forms management styles (using FormsManager component) */

/* result actions layout */
.result-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.result-actions .left-actions { display:flex; gap:8px; align-items:center; }
.result-actions .right-actions { display:flex; gap:8px; align-items:center; justify-content:flex-end; }
</style>
