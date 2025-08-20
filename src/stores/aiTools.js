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
    streaming: false,
    loading: {
      summary: false,
      tags: false,
      ner: false,
      customExtraction: false,
      qa: false,
      translation: false,
      extraction: false
    },
    error: null
  }),
  
  actions: {
    async getSummary(fileId) {
      this.loading.summary = true;
      this.streaming = true;
      this.summary = '';
      
      try {
        await aiService.getSummary(fileId, (chunk) => {
          this.summary += chunk;
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
          answer += chunk;
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
      this.translatedText = '';
      
      try {
        await aiService.translateText(text, targetLanguage, (chunk) => {
          this.translatedText += chunk;
        });
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
    
    clearAll() {
      this.summary = '';
      this.tags = [];
      this.nerEntities = [];
      this.customExtractionResults = null;
      this.qaHistory = [];
      this.translatedText = '';
      this.extractedText = '';
    }
  }
});