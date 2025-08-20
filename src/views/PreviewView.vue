<template>
  <div class="preview-container">
    <!-- Header with file info and controls -->
    <preview-header 
      :file="fileData" 
      :activePanels="activePanels"
      @toggle-panel="togglePanel"
      @download="downloadFile"
      @locate="locateFile"
    />

    <!-- Content area with panels -->
    <div class="preview-content">
      <!-- Panel 1: File Preview + AI Tools -->
      <div v-if="activePanels.filePreview" class="preview-panel">
        <file-preview 
          :fileId="fileId" 
          :fileType="fileData.fileType" 
        />
        
        <ai-toolbar 
          v-if="activePanels.aiTools" 
          :activeAITool="activeAITool"
          @tool-change="setActiveAITool"
        />
        
        <component 
          v-if="activePanels.aiTools && activeAITool !== 'translation'" 
          :is="currentAIComponent" 
          :fileId="fileId"
        />
      </div>

      <!-- Panel 2: Text Extraction + Translation -->
      <div v-if="activePanels.textExtraction || activePanels.translation" class="text-panel">
        <div class="panel-columns">
          <text-extractor 
            v-if="activePanels.textExtraction" 
            :fileId="fileId" 
            :content="extractedText"
          />
          
          <translation-panel 
            v-if="activePanels.translation" 
            :sourceText="extractedText"
            v-model:targetText="translatedText"
          />
        </div>
      </div>
    </div>

    <!-- Access request modal -->
    <el-dialog
      v-model="accessDialog.visible"
      title="Request Access"
      width="500px"
    >
      <el-form :model="accessDialog.form" label-width="120px">
        <el-form-item label="Request Type">
          <el-select v-model="accessDialog.form.requestType" placeholder="Select request type">
            <el-option 
              v-for="type in accessDialog.options" 
              :key="type.value" 
              :label="type.label" 
              :value="type.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Reason">
          <el-input 
            v-model="accessDialog.form.reason" 
            type="textarea" 
            :rows="4" 
            placeholder="Please enter your reason" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accessDialog.visible = false">Cancel</el-button>
        <el-button type="primary" @click="submitAccessRequest">Submit Request</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFilePreviewStore } from '../stores/filePreview';
import { useAiToolsStore } from '../stores/aiTools';
import PreviewHeader from '../components/preview/PreviewHeader.vue';
import FilePreview from '../components/preview/FilePreview.vue';
import AIToolbar from '../components/ai/AIToolbar.vue';
import TextExtractor from '../components/preview/TextExtractor.vue';
import TranslationPanel from '../components/preview/TranslationPanel.vue';
import SummaryPanel from '../components/ai/SummaryPanel.vue';
import TagsPanel from '../components/ai/TagsPanel.vue';
import NERPanel from '../components/ai/NERPanel.vue';
import CustomExtractionPanel from '../components/ai/CustomExtractionPanel.vue';
import DocumentQA from '../components/ai/DocumentQA.vue';
import TranslationTool from '../components/ai/TranslationTool.vue';

const route = useRoute();
const router = useRouter();
const filePreviewStore = useFilePreviewStore();
const aiToolsStore = useAiToolsStore();

// Get file ID from route params
const fileId = computed(() => route.params.id);

// State
const fileData = ref({});
const activeAITool = ref('summary');
const extractedText = ref('');
const translatedText = ref('');
const accessDialog = ref({
  visible: false,
  form: {
    requestType: '',
    reason: ''
  },
  options: [
    { value: 'view', label: 'View Permission' },
    { value: 'download', label: 'Download Permission' },
    { value: 'edit', label: 'Edit Permission' }
  ]
});

const activePanels = ref({
  filePreview: true,
  aiTools: true,
  textExtraction: false,
  translation: false
});

// Computed
const currentAIComponent = computed(() => {
  switch (activeAITool.value) {
    case 'summary': return SummaryPanel;
    case 'tags': return TagsPanel;
    case 'ner': return NERPanel;
    case 'customExtraction': return CustomExtractionPanel;
    case 'qa': return DocumentQA;
    case 'translation': return TranslationTool;
    default: return SummaryPanel;
  }
});

// Methods
function togglePanel(panel) {
  activePanels.value[panel] = !activePanels.value[panel];
  
  // If translation tool is activated, switch to text+translation panel
  if (panel === 'aiTools' && activeAITool.value === 'translation') {
    activePanels.value.textExtraction = true;
    activePanels.value.translation = true;
  }
}

function setActiveAITool(tool) {
  activeAITool.value = tool;
  
  // If translation is selected, activate text extraction and translation panels
  if (tool === 'translation') {
    activePanels.value.textExtraction = true;
    activePanels.value.translation = true;
  }
}

function downloadFile() {
  filePreviewStore.downloadFile(fileId.value);
}

function locateFile() {
  router.push({
    name: 'search',
    query: { locate: fileId.value }
  });
}

function showAccessRequestDialog() {
  accessDialog.value.visible = true;
}

function submitAccessRequest() {
  filePreviewStore.requestAccess(
    fileId.value, 
    accessDialog.value.form.requestType,
    accessDialog.value.form.reason
  );
  accessDialog.value.visible = false;
}

// Lifecycle
onMounted(async () => {
  try {
    fileData.value = await filePreviewStore.loadFile(fileId.value);
    extractedText.value = await aiToolsStore.extractText(fileId.value);
  } catch (error) {
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
      showAccessRequestDialog();
    }
  }
});

// Watch for changes to route params
watch(() => route.params.id, async (newId) => {
  if (newId && newId !== fileId.value) {
    fileData.value = await filePreviewStore.loadFile(newId);
    extractedText.value = await aiToolsStore.extractText(newId);
  }
});
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-panel {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.text-panel {
  height: 100%;
  overflow: hidden;
}

.panel-columns {
  display: flex;
  height: 100%;
}

.panel-columns > * {
  flex: 1;
  overflow: auto;
  padding: 15px;
  border-right: 1px solid #dcdfe6;
}

.panel-columns > *:last-child {
  border-right: none;
}
</style>