import { defineStore } from 'pinia';
import { aiService } from '../services/aiService';

export const useAiToolsStore = defineStore('aiTools', {
  state: () => ({
    summary: '',
    tags: [],
  tagObjects: [],
    nerEntities: [],
    customExtractionResults: null,
    qaHistory: [],
    translatedText: '',
    extractedText: '',
    classificationResults: [],
  themes: [],
  themesTotal: 0,
  themesPageNo: 1,
  themesPageSize: 10,
  themeLabels: {}, // themeId -> labels array
  themeClassification: { themeId: null, results: [] },
    classificationForms: [],
    streaming: false,
    loading: {
      summary: false,
      tags: false,
      ner: false,
      customExtraction: false,
      qa: false,
      translation: false,
      extraction: false,
      classification: false,
      classificationForms: false
  , themes: false, themeLabels: false, themeClassify: false
    },
    error: null
  }),
  
  actions: {
  async getSummary(fileId, targetLanguage='中文', length=200, fileData) {
      this.loading.summary = true;
      this.streaming = true;
      this.summary = '';
      try {
  await aiService.getSummary(fileId, targetLanguage, length, (chunk) => {
          this.summary = chunk; // 已在 service 累计，这里直接替换最新片段
  }, fileData);
        return this.summary;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading.summary = false;
        this.streaming = false;
      }
    },
    
  async getTags(fileId, fileData) {
      this.loading.tags = true;
      
      try {
  const tagObjs = await aiService.getTags(fileId, fileData);
        if (Array.isArray(tagObjs) && tagObjs.length && typeof tagObjs[0] === 'object') {
          this.tagObjects = tagObjs;
          this.tags = tagObjs.map(t=>t.tag).filter(Boolean);
        } else {
          this.tagObjects = [];
          this.tags = Array.isArray(tagObjs)? tagObjs : [];
        }
        return this.tagObjects.length? this.tagObjects : this.tags;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading.tags = false;
      }
    },
    
  async getNEREntities(fileId, fileData) {
      this.loading.ner = true;
      
      try {
  const entities = await aiService.getNEREntities(fileId, fileData);
        this.nerEntities = entities;
        return entities;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading.ner = false;
      }
    },
    
    async extractCustomInfo(fileId, template) {
      this.loading.customExtraction = true;
      
      try {
        const results = await aiService.extractCustomInfo(fileId, template);
        this.customExtractionResults = results;
        return results;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading.customExtraction = false;
      }
    },
    
    async askQuestion(fileId, question) {
      this.loading.qa = true;
      this.streaming = true;
      let answer = '';
      
      try {
        await aiService.askQuestion(fileId, question, (chunk) => {
          answer = chunk;
        });
        
        this.qaHistory.push({ question, answer });
        return answer;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading.qa = false;
        this.streaming = false;
      }
    },
    
    async translateText(text, targetLanguage) {
      this.loading.translation = true;
      this.streaming = true;
      this.translatedText='';

      try {
        await aiService.translateText(text, targetLanguage, (chunk)=>{ this.translatedText = chunk; });
        return this.translatedText;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading.translation = false;
        this.streaming = false;
      }
    },
    
    async extractText(fileId) {
      this.loading.extraction = true;
      
      try {
        const text = await aiService.extractText(fileId);
        this.extractedText = text;
        return text;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.extraction = false;
      }
    },
    
    async classifyDocument(fileId) {
      this.loading.classification = true;
      
      try {
        const res = await aiService.classifyDocument(fileId);
        this.classificationResults = res;
        return res;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading.classification = false;
      }
    },
    
    async loadClassificationForms() {
      this.loading.classificationForms = true;
      
      try {
        this.classificationForms = await aiService.getClassificationForms();
        return this.classificationForms;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading.classificationForms = false;
      }
    },
    // ===== Theme & Labels =====
    async loadThemes(){
      this.loading.themes = true;
      try { this.themes = await aiService.listThemes(); return this.themes; }
      catch(e){ this.error=e.message; return []; }
      finally { this.loading.themes=false; }
    },
    async loadThemesPage(pageNo=this.themesPageNo, pageSize=this.themesPageSize){
      this.loading.themes = true;
      try {
        const { list, total } = await aiService.listThemesPage({ pageNo, pageSize });
        this.themes = list;
        this.themesTotal = total;
        this.themesPageNo = pageNo;
        this.themesPageSize = pageSize;
        // flatten labels into themeLabels map
        const map={};
        list.forEach(t=>{ if(Array.isArray(t.labels)) map[t.id]=t.labels; });
        this.themeLabels = { ...this.themeLabels, ...map };
        return { list, total };
      } catch(e){ this.error=e.message; return { list:[], total:0 }; }
      finally { this.loading.themes=false; }
    },
  async createTheme(payload){ const res = await aiService.createTheme(payload); await this.loadThemesPage(this.themesPageNo,this.themesPageSize); return res; },
  async updateTheme(p){ const res = await aiService.updateTheme(p); await this.loadThemesPage(this.themesPageNo,this.themesPageSize); return res; },
  async deleteTheme(id){ const res = await aiService.deleteTheme(id); await this.loadThemesPage(this.themesPageNo,this.themesPageSize); return res; },
    async loadThemeLabels(themeId){ if(!themeId) return []; this.loading.themeLabels=true; try { const labels = await aiService.listThemeLabels(themeId); this.themeLabels[themeId]=labels; return labels; } catch(e){ this.error=e.message; return []; } finally { this.loading.themeLabels=false; } },
    async createThemeLabel(p){ const res= await aiService.createThemeLabel(p); await this.loadThemeLabels(p.themeId); return res; },
    async updateThemeLabel(p){ const res= await aiService.updateThemeLabel(p); await this.loadThemeLabels(p.themeId); return res; },
    async deleteThemeLabel(id, themeId){ const res= await aiService.deleteThemeLabel(id); await this.loadThemeLabels(themeId); return res; },
  async classifyTheme({ esId, themeId, text }){ this.loading.themeClassify=true; try { const results = await aiService.classifyByTheme({ esId, themeId, text }); this.themeClassification = { themeId: themeId||null, results }; return results; } catch(e){ this.error=e.message; return []; } finally { this.loading.themeClassify=false; } },
    
    async addClassificationForm(name) {
      const created = await aiService.createClassificationForm(name);
      await this.loadClassificationForms();
      return created;
    },
    
    async updateClassificationForm(id, patch) {
      const updated = await aiService.updateClassificationForm(id, patch);
      await this.loadClassificationForms();
      return updated;
    },
    
    async deleteClassificationForm(id) {
      await aiService.deleteClassificationForm(id);
      await this.loadClassificationForms();
      return true;
    },
    
    clearAll() {
      this.summary = '';
      this.tags = [];
      this.nerEntities = [];
      this.customExtractionResults = null;
      this.qaHistory = [];
      this.translatedText = '';
      this.extractedText = '';
      this.classificationResults = [];
    }
  }
});