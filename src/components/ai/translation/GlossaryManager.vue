<template>
  <!-- 独立的术语库管理组件：不在界面占位，只渲染弹窗 -->
  <div class="glossary-manager-host" v-if="mounted">
    <!-- 主管理弹窗 -->
    <el-dialog v-model="showManager" title="术语库管理" width="800px" @open="onOpen">
      <div class="terminology-manager">
        <div class="terminology-toolbar">
          <el-button type="primary" size="small" @click="openAddDialog">
            <el-icon><Plus/></el-icon>
            添加术语
          </el-button>
          <el-button size="small" @click="refreshGlossary" :loading="pagination.loading">
            <el-icon><Refresh/></el-icon>
            刷新
          </el-button>
          <el-select v-model="pagination.typeFilter" size="small" placeholder="类型" style="width:110px" @change="onFilterChange" clearable>
            <el-option label="术语" value="terminology"/>
            <el-option label="记忆" value="memory"/>
            <el-option label="语料" value="corpus"/>
          </el-select>
          <el-input v-model="pagination.keyword" size="small" placeholder="关键词 (原文)" style="width:180px" clearable @keyup.enter="onFilterChange">
            <template #suffix>
              <el-icon style="cursor:pointer" @click="onFilterChange"><Search/></el-icon>
            </template>
          </el-input>
          <el-button size="small" @click="onFilterChange">查询</el-button>
          <el-dropdown trigger="click" @command="onExportCommand">
            <el-button size="small">
              <el-icon><Download/></el-icon>
              导出
              <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="json">导出 JSON</el-dropdown-item>
                <el-dropdown-item command="csv">导出 CSV</el-dropdown-item>
                <el-dropdown-item divided command="exportAll">导出全部（CSV）</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="small" @click="importTerminology">
            <el-icon><Upload/></el-icon>
            导入
          </el-button>
        </div>
        <el-table :data="terminologyList" v-loading="pagination.loading" height="400" style="width:100%">
          <el-table-column prop="type" label="类型" width="80">
            <template #default="scope">
              <el-tag :type="getTermTypeTagType(scope.row.type)" size="small">{{ getTermTypeLabel(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="originalText" label="原文内容" width="200"/>
          <el-table-column prop="translatedText" label="译文内容" width="200"/>
          <el-table-column prop="language" label="语种" width="100">
            <template #default="scope">{{ getLanguageLabel(scope.row.language) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center" class-name="operation-col">
            <template #default="scope">
              <div class="op-btns">
                <el-button size="small" link type="primary" @click="editTerminology(scope.row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="deleteTerminology(scope.row.id)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="glossary-pagination">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            :page-size="pagination.pageSize"
            :current-page="pagination.pageNo"
            :page-sizes="[10,20,30,50]"
            @size-change="onSizeChange"
            @current-change="onPageChange"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="close">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog v-model="showImportDialog" title="导入术语库" width="560px">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <el-button size="small" @click="downloadImportTemplate">下载导入模板</el-button>
        </div>
        <div>请选择要导入的文件（支持 .csv / .xlsx）：</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input ref="importFileInput" type="file" accept=".json,.csv,.xlsx" style="display:none" @change="onImportFileChange"/>
          <el-input v-model="importFileName" placeholder="未选择文件" readonly style="flex:1"/>
          <el-button size="small" type="primary" @click="triggerFileSelect">选择文件</el-button>
        </div>
        <div style="color:#909399;font-size:12px">导入将调用后台接口并更新/新增条目，建议先下载模板并按模板填写。</div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button type="primary" :loading="importUploading" @click="uploadImportConfirm">上传并导入</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加/编辑术语弹窗 -->
    <el-dialog v-model="showAddDialog" :title="editingTerm ? '编辑术语' : '添加术语'" width="500px">
      <el-form :model="terminologyForm" label-width="100px">
        <el-form-item label="类型">
          <el-select v-model="terminologyForm.type" placeholder="选择类型">
            <el-option label="术语" value="terminology"/>
            <el-option label="记忆" value="memory"/>
            <el-option label="语料" value="corpus"/>
          </el-select>
        </el-form-item>
        <el-form-item label="原文内容">
          <el-input v-model="terminologyForm.originalText" type="textarea" :rows="3" placeholder="输入原文内容"/>
        </el-form-item>
        <el-form-item label="译文内容">
          <el-input v-model="terminologyForm.translatedText" type="textarea" :rows="3" placeholder="输入译文内容"/>
        </el-form-item>
        <el-form-item label="译文语种">
          <el-select v-model="terminologyForm.language" placeholder="选择语种">
            <el-option label="中文" value="zh"/>
            <el-option label="English" value="en"/>
            <el-option label="Français" value="fr"/>
            <el-option label="Español" value="es"/>
            <el-option label="Deutsch" value="de"/>
            <el-option label="日本語" value="ja"/>
            <el-option label="Русский" value="ru"/>
            <el-option label="Italiano" value="it"/>
            <el-option label="한국어" value="ko"/>
            <el-option label="Português" value="pt"/>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeAddDialog">取消</el-button>
          <el-button type="primary" @click="saveTerminology">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, nextTick, onMounted} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {Plus, Refresh, Search, Download, Upload} from '@element-plus/icons-vue';
import {aiService} from '../../../services/aiService';
import api from '../../../services/api';

// 可选：当术语库发生变化时通知父组件
const emit = defineEmits(['changed']);

const showManager = ref(false);
const mounted = ref(false);
const terminologyList = ref([]);
const pagination = reactive({pageNo:1,pageSize:20,total:0,loading:false,typeFilter:'',keyword:''});

// 导入相关
const showImportDialog = ref(false);
const importFileName = ref('');
const importUploading = ref(false);
const importFileInput = ref(null);
const selectedImportFile = ref(null);

// 添加/编辑
const showAddDialog = ref(false);
const editingTerm = ref(null);
const terminologyForm = reactive({type:'terminology',originalText:'',translatedText:'',language:'zh'});

function open(){ showManager.value = true; }
function close(){ showManager.value = false; }
function onOpen(){ loadGlossary(); }
function openAddDialog(){ editingTerm.value=null; showAddDialog.value = true; }
function closeAddDialog(){ showAddDialog.value = false; resetForm(); }

function resetForm(){
  terminologyForm.type='terminology';
  terminologyForm.originalText='';
  terminologyForm.translatedText='';
  terminologyForm.language='zh';
  editingTerm.value=null;
}

async function loadGlossary(){
  try {
    pagination.loading = true;
    const {list,total} = await aiService.getGlossaryPage({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      type: pagination.typeFilter,
      originalText: pagination.keyword,
      language: 'zh'
    });
    terminologyList.value = list.map(it => ({
      id: it.id,
      type: it.type || 'terminology',
      originalText: it.originalText || it.source || '',
      translatedText: it.translatedText || it.target || '',
      language: it.language || 'zh',
      status: it.status
    }));
    pagination.total = total;
  } catch (e){
    console.warn('loadGlossary failed', e);
  } finally { pagination.loading = false; }
}

function editTerminology(term){
  editingTerm.value = term;
  terminologyForm.type = term.type || 'terminology';
  terminologyForm.originalText = term.originalText || '';
  terminologyForm.translatedText = term.translatedText || '';
  terminologyForm.language = term.language || 'zh';
  showAddDialog.value = true;
}

async function deleteTerminology(id){
  try {
    await ElMessageBox.confirm('确认删除该术语？','提示',{type:'warning',confirmButtonText:'删除',cancelButtonText:'取消'});
    const res = await aiService.deleteGlossaryEntry(id);
    if(res && res.success){
      ElMessage.success('删除成功');
      await loadGlossary();
      emit('changed');
    } else {
      ElMessage.error(res?.message || '删除失败');
    }
  } catch(e){
    if(e !== 'cancel') ElMessage.error('删除失败');
  }
}

async function saveTerminology(){
  if(!terminologyForm.originalText || !terminologyForm.translatedText){
    ElMessage.error('请填写完整信息');
    return;
  }
  try {
    if(editingTerm.value){
      const res = await aiService.updateGlossaryEntry({
        id: editingTerm.value.id,
        type: terminologyForm.type,
        originalText: terminologyForm.originalText,
        translatedText: terminologyForm.translatedText,
        language: terminologyForm.language,
        status:1
      });
      if(res && res.success){
        ElMessage.success('更新成功');
        await loadGlossary();
        emit('changed');
      } else {
        ElMessage.error('更新失败');
      }
    } else {
      const res = await aiService.createGlossaryEntry({
        type: terminologyForm.type,
        originalText: terminologyForm.originalText,
        translatedText: terminologyForm.translatedText,
        language: terminologyForm.language,
        status:1
      });
      if(res && res.success){
        ElMessage.success('创建成功');
        await loadGlossary();
        emit('changed');
      } else {
        ElMessage.error('创建失败');
      }
    }
  } catch(e){
    ElMessage.error('保存失败');
  } finally {
    resetForm();
    showAddDialog.value = false;
  }
}

function refreshGlossary(){ loadGlossary(); }
function onFilterChange(){ pagination.pageNo = 1; loadGlossary(); }
function onPageChange(p){ pagination.pageNo = p; loadGlossary(); }
function onSizeChange(s){ pagination.pageSize = s; pagination.pageNo = 1; loadGlossary(); }

function onExportCommand(fmt){ if(fmt==='exportAll') return exportAll(); return exportTerminology(fmt); }

function exportTerminology(format='json'){
  try {
    if(format==='csv'){
      const header=['type','originalText','translatedText','language'];
      const rows = terminologyList.value.map(r=> header.map(h=>{ const v=r[h]; return v==null?'':String(v).replace(/"/g,'""'); }));
      const csv=[header.join(',')].concat(rows.map(cols=> cols.map(c=>`"${c}"`).join(','))).join('\n');
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
      const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`terminology_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
      ElMessage.success('术语库已导出为 CSV');
      return;
    }
    const data=JSON.stringify(terminologyList.value,null,2);
    const blob=new Blob([data],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`terminology_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
    ElMessage.success('术语库已导出为 JSON');
  } catch(e){
    console.error('exportTerminology failed', e);
    ElMessage.error('导出失败');
  }
}

async function exportAll(){
  try {
    const path = '/admin-api/rag/ai/translate/glossary/export-all?format=csv';
    const resp = await api.get(path,{responseType:'blob', timeout:120000});
    const blob = resp instanceof Blob ? resp : (resp.data || resp);
    const url=window.URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`terminology_all_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    ElMessage.success('已开始导出全部数据');
  } catch(e){
    console.error('exportAll failed', e); ElMessage.error('导出全部失败');
  }
}

function importTerminology(){ importFileName.value=''; showImportDialog.value=true; }
function downloadImportTemplate(){ const path='/admin-api/rag/ai/translate/glossary/import-template?format=csv'; const resolved=aiService._resolveApiPath(path); window.open(resolved,'_blank'); }
function triggerFileSelect(){ nextTick(()=>{ const el=importFileInput.value; if(!el) return; try{ el.value=''; }catch{} selectedImportFile.value=null; el.click();}); }
function onImportFileChange(e){ const file=(e.target.files && e.target.files[0])||null; if(!file){ importFileName.value=''; selectedImportFile.value=null; return;} importFileName.value=file.name; selectedImportFile.value=file; }
async function uploadImportConfirm(){ const file=selectedImportFile.value; if(!file){ ElMessage.error('请先选择要导入的文件'); return;} importUploading.value=true; try{ const form=new FormData(); form.append('file', file); const fmt=file.name.split('.').pop(); if(fmt) form.append('format', fmt); const path='/admin-api/rag/ai/translate/glossary/import-file'; const res=await api.post(path, form, {headers:{'Content-Type':'multipart/form-data'}, timeout:120000}); if(res && (res.code===0 || res.status==='ok' || res==='ok' || res.data==='ok' || !res.code)){ ElMessage.success('文件上传并导入成功'); showImportDialog.value=false; await loadGlossary(); emit('changed'); } else { ElMessage.error(res?.msg || '导入接口返回失败'); } } catch(err){ console.error('uploadImportConfirm failed', err); ElMessage.error(err?.message || '上传失败'); } finally { importUploading.value=false; } }

function getTermTypeLabel(type){ return {terminology:'术语',memory:'记忆',corpus:'语料'}[type]||type; }
function getTermTypeTagType(type){ return {terminology:'primary',memory:'success',corpus:'warning'}[type]||'info'; }
function getLanguageLabel(lang){ return {zh:'中文',en:'English',fr:'Français',es:'Español',de:'Deutsch',ja:'日本語',ru:'Русский',it:'Italiano',ko:'한국어',pt:'Português'}[lang]||lang; }

onMounted(()=>{ mounted.value = true; });

// 暴露 open/close 给父组件
defineExpose({ open, close });
</script>

<style scoped>
.terminology-toolbar { display:flex; gap:8px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #e5e7eb; flex-wrap:wrap; }
.op-btns { display:flex; align-items:center; justify-content:center; gap:4px; }
.op-btns .el-button { padding:0 4px; margin:0 !important; line-height:1; }
.operation-col .cell { padding:0 4px !important; }
.glossary-pagination { margin-top:12px; display:flex; justify-content:flex-end; }
</style>
