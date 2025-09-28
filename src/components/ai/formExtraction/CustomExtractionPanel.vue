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
          <div v-if="selectedForm.structure_result" class="structure-preview">
            <div class="structure-header">字段结构模板</div>
            <pre class="structure-json">{{ prettyStructureResult }}</pre>
          </div>
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
                :template-structure="selectedForm.structure_result"
                :result-data="entry.raw"
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
import { useFormsStore } from '../../../stores/forms';
import { useExtractionsStore } from '../../../stores/extractions';
import { formsService } from '../../../services/formsService';
import ExtractionResultForm from './ExtractionResultForm.vue';
import FormsManager from '../../forms/FormsManager.vue';
import { resolveEsId } from '../../../utils/esid';

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

// 将 structure_result 进行美化显示
const prettyStructureResult = computed(() => {
  const sf = selectedForm.value;
  if (!sf || !sf.structure_result) return '';
  try {
    if (typeof sf.structure_result === 'string') {
      return JSON.stringify(JSON.parse(sf.structure_result), null, 2);
    }
    return JSON.stringify(sf.structure_result, null, 2);
  } catch {
    return typeof sf.structure_result === 'string' ? sf.structure_result : JSON.stringify(sf.structure_result);
  }
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
    const extr_resp = await formsService.extractTextByForm({
      esId,
      formId: selectedFormId.value,
      timeout: 180000
    });
    // 兼容多种后端响应包装
    const payload = extr_resp?.data?.data || extr_resp?.data || extr_resp;
    if(!payload) {
      console.warn('[extractInfo] 后端返回空 payload', extr_resp);
    }
  // debug logs removed

    rawExtractionPayload.value = payload;
    const formResult = payload?.formResult;
    let candidateEntries = [];

    if (Array.isArray(formResult) && formResult.length) {
      formResult.forEach((item, i) => {
        let parsed = null;
        let originalString = null;
        if (typeof item === 'string') {
          originalString = item;
          try { parsed = JSON.parse(item); }
          catch (e1) {
            try {
              const cleaned = item.replace(/\n/g,' ').trim();
              parsed = JSON.parse(cleaned);
              originalString = cleaned; // 使用清洗后的字符串
            } catch (e2) {
              console.warn(`[extractInfo] formResult[${i}] 解析失败`, e1, e2, item);
              parsed = null;
            }
          }
        } else if (item && typeof item === 'object') {
          parsed = item;
          try { originalString = JSON.stringify(item); } catch { originalString = null; }
        }
        if (parsed && typeof parsed === 'object') {
          candidateEntries.push({ raw: parsed, originalString, editable: false, saving: false, mode: 'structured' });
        }
      });
    } else if (Array.isArray(payload?.fields)) {
      // 旧格式：fields 数组
      const flatObj = {};
      payload.fields.forEach(f=>{ if(f?.name) flatObj[f.name] = f.value ?? ''; });
      candidateEntries.push({ raw: flatObj, editable: false, saving: false, mode: 'legacy' });
    } else if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      // 兜底：直接使用 payload
      let originalString = null; try { originalString = JSON.stringify(payload); } catch {}
      candidateEntries.push({ raw: payload, originalString, editable: false, saving: false, mode: 'structured' });
    }

    if (!candidateEntries.length) {
      console.warn('[extractInfo] 未生成任何候选结果 candidateEntries 为空, formResult 内容:', formResult);
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
  if (!newData) {
    if (index === undefined || index === null) { extractionResult.value = null; return; }
    if (Array.isArray(extractionResult.value)) extractionResult.value[index] = null;
    return;
  }
  const entry = { raw: newData, editable: true, saving: false };
  if (index === undefined || index === null) {
    extractionResult.value = [entry];
  } else {
    if (!Array.isArray(extractionResult.value)) extractionResult.value = [];
    extractionResult.value[index] = entry;
  }
}

async function confirmResult(index) {
  // confirm single entry by index or the first entry if index not provided
  if (!extractionResult.value) return;
  const entry = (index === undefined || index === null) ? (Array.isArray(extractionResult.value) ? extractionResult.value[0] : extractionResult.value) : extractionResult.value[index];
  if (!entry || !entry.raw || typeof entry.raw !== 'object') return;
  entry.saving = true; saving.value = true;
  try {
    const esId = resolveEsId(props.file, props.fileId);
    const formId = selectedFormId.value;
    let fieldsPayload = '';
    if (entry.mode === 'structured') {
      // 结构化模式：需要把当前最新编辑后的对象完整序列化为字符串（保留数组结构）
      // 不再单纯依赖 originalString，避免用户编辑后内容不同步
      try { fieldsPayload = JSON.stringify(entry.raw); } catch { fieldsPayload = entry.originalString || ''; }
    } else if (entry.mode === 'legacy') {
      // 旧格式：entry.raw 是平面或嵌套对象，仍然整体序列化
      try { fieldsPayload = JSON.stringify(entry.raw); } catch { fieldsPayload = ''; }
    } else {
      try { fieldsPayload = JSON.stringify(entry.raw); } catch { fieldsPayload = ''; }
    }

    const saveReq = { esId, formId, fields: fieldsPayload };
  // debug log removed
    const saveResp = await formsService.saveExtractionHistory(saveReq);
    const respPayload = saveResp?.data?.data || saveResp?.data || saveResp;
    const code = saveResp?.data?.code ?? respPayload?.code;
    if (code && code !== 0) {
      const msg = saveResp?.data?.msg || '保存失败 (code=' + code + ')';
      ElMessage.error(msg);
    } else {
      ElMessage.success('抽取结果已保存');
      entry.editable = false;
      // refresh history
      try { extractionsStore.setPagination(1, extractionsStore.pagination.pageSize); await extractionsStore.loadExtractions({ form_id: formId, document_id: esId }); } catch (err) { console.warn('Failed to reload extraction history after save', err); }
    }
  } catch (error) { 
    console.error('[confirmResult] 保存异常', error);
    ElMessage.error('保存失败: ' + (error?.msg || error?.message || error));
  }
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
