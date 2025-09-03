<template>
  <div>
    <el-dialog v-model="visible" title="导出结果集" width="80%" top="5vh" :close-on-click-modal="false">
      <div class="toolbar">
        <span class="count">已选择 {{ rows.length }} 条</span>
        <el-popover trigger="click" placement="bottom-start" width="260">
          <template #reference>
            <el-button size="small">选择列</el-button>
          </template>
          <div class="col-select">
            <el-checkbox-group v-model="selectedColumnKeys">
              <el-checkbox v-for="c in allColumns" :key="c.key" :label="c.key">{{ c.label }}</el-checkbox>
            </el-checkbox-group>
            <div class="col-actions">
              <el-button text size="small" @click="resetColumns">重置</el-button>
              <el-button text size="small" @click="selectAllColumns">全选</el-button>
              <el-button text size="small" @click="invertColumns">反选</el-button>
            </div>
          </div>
        </el-popover>
      </div>
      <el-table :data="pagedRows" border height="55vh" :row-key="rowKey">
        <template v-for="col in visibleColumns" :key="col.key">
          <el-table-column
            v-if="col.key !== 'fileSize' && !col.tooltip"
            :prop="col.key"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
          />
          <el-table-column
            v-else-if="col.key === 'fileSize'"
            :prop="col.key"
            :label="col.label"
            :width="col.width || 100"
          >
            <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
          </el-table-column>
          <el-table-column
            v-else
            :prop="col.key"
            :label="col.label"
            :min-width="col.minWidth || 160"
          >
            <template #default="{ row }">
              <el-tooltip :content="row[col.key]" placement="top">
                <div class="ellipsis-2">{{ row[col.key] }}</div>
              </el-tooltip>
            </template>
          </el-table-column>
        </template>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10,20,50,100]"
          layout="prev, pager, next, sizes, total"
          :total="rows.length"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="emitCancel" :disabled="exporting">取消</el-button>
            <el-button type="primary" :loading="exporting" :disabled="!rows.length" @click="handleExport">导出CSV</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useSearchStore } from '../../stores/search';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ids: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
});
const exporting = ref(false);
const searchStore = useSearchStore();
const rows = computed(()=> props.ids.map(id => searchStore.itemsById[id]).filter(Boolean));

// 分页
const currentPage = ref(1);
const pageSize = ref(20);
const pagedRows = computed(()=>{
  const start = (currentPage.value - 1) * pageSize.value;
  return rows.value.slice(start, start + pageSize.value);
});

// 列定义
const allColumns = [
  { key:'fileName', label:'文件名称', width:220 },
  { key:'fileSize', label:'文件大小', width:100 },
  { key:'filePath', label:'文件路径', width:180 },
  { key:'createrName', label:'创建人', width:120 },
  { key:'createTime', label:'上传时间', width:160 },
  { key:'updateUserName', label:'更新人', width:120 },
  { key:'updateTime', label:'更新时间', width:160 },
  { key:'fileCategory', label:'空间', width:100 },
  { key:'fileSummary', label:'中文摘要', minWidth:200, tooltip:true },
  { key:'fileSummaryTranslate', label:'译文摘要', minWidth:200, tooltip:true },
  { key:'fileAiTag', label:'AI标签', minWidth:180, tooltip:true },
  { key:'fileSysTag', label:'系统标签', minWidth:180, tooltip:true },
  { key:'fileEntities', label:'文件实体', minWidth:200, tooltip:true },
  { key:'fileTranslate', label:'文本翻译', minWidth:220, tooltip:true },
  { key:'userCustomAttributes', label:'属性', minWidth:200, tooltip:true },
  { key:'fileContents', label:'文件内容', minWidth:260, tooltip:true }
];
const selectedColumnKeys = ref(allColumns.map(c=>c.key));
const visibleColumns = computed(()=> allColumns.filter(c => selectedColumnKeys.value.includes(c.key)));

function resetColumns(){ selectedColumnKeys.value = allColumns.map(c=>c.key); }
function selectAllColumns(){ selectedColumnKeys.value = allColumns.map(c=>c.key); }
function invertColumns(){
  const set = new Set(selectedColumnKeys.value);
  selectedColumnKeys.value = allColumns.filter(c=> !set.has(c.key)).map(c=>c.key);
}

function rowKey(row){ return row.id; }
function formatSize(sz){ if (!sz && sz!==0) return ''; const units=['B','KB','MB','GB','TB']; let s=Number(sz); let i=0; while(s>=1024 && i<units.length-1){ s/=1024; i++; } return (s.toFixed( (i?2:0) ))+units[i]; }
function categoryLabel(cat){ return cat || ''; }

function escapeCsv(str){ if(str==null) return ''; const s = String(str).replace(/"/g,'""'); return '"'+s+'"'; }

async function handleExport(){
  if(!rows.value.length) return;
  exporting.value=true;
  try {
    const chosen = visibleColumns.value;
    const headers = chosen.map(c=>c.label);
    let csv = headers.map(h=>escapeCsv(h)).join(',')+'\n';
    rows.value.forEach(r=>{
      const line = chosen.map(c=>{
        const key = c.key;
        let val = r[key];
        if (key === 'fileName') val = r.fileName || r.name || '';
        if (key === 'fileSize') val = formatSize(r.fileSize);
        if (key === 'fileCategory') val = categoryLabel(r.fileCategory);
        return escapeCsv(val||'');
      }).join(',');
      csv += line+'\n';
    });
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '文件导出_'+ new Date().toLocaleDateString() + '.csv';
    document.body.appendChild(link); link.click(); setTimeout(()=>{ URL.revokeObjectURL(link.href); document.body.removeChild(link); }, 120);
  } finally { exporting.value=false; visible.value=false; }
}

function emitCancel(){ visible.value=false; }

</script>
<style scoped>
.toolbar { display:flex; gap:12px; margin-bottom:10px; align-items:center; }
.ellipsis-2 { display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; text-overflow:ellipsis; white-space:normal; }
</style>
