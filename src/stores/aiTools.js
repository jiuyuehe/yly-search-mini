import { defineStore } from 'pinia';
import { aiService } from '../services/aiService';

export const useAiToolsStore = defineStore('aiTools', {
  state: () => ({
    summary: '',
    tags: [],
    nerEntities: [],
    customExtractionResults: null,
    qaHistory: [],
    translatedText: '',
    extractedText: '',
    classificationResults: [],
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
    },
    error: null
  }),
  
  actions: {
    async getSummary(fileId, targetLanguage='中文', length=200) {
      this.loading.summary = true;
      this.streaming = true;
      this.summary = '';
      try {
        await aiService.getSummary(fileId, targetLanguage, length, (chunk) => {
          this.summary = chunk; // 已在 service 累计，这里直接替换最新片段
        });
        return this.summary;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading.summary = false;
        this.streaming = false;
      }
    },
    
    async getTags(fileId) {
      this.loading.tags = true;
      
      try {
        const tags = await aiService.getTags(fileId);
        this.tags = tags;
        return tags;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading.tags = false;
      }
    },
    
    async getNEREntities(fileId) {
      this.loading.ner = true;
      
      try {
        const entities = await aiService.getNEREntities(fileId);
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