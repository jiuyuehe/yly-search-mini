import { defineStore } from 'pinia';
import { fileService } from '../services/file';

export const useFilePreviewStore = defineStore('filePreview', {
  state: () => ({
    currentFile: null,
    loading: false,
    error: null
  }),
  
  actions: {
    async loadFile(fileId) {
      this.loading = true;
      
      try {
        const file = await fileService.getFilePreview(fileId);
  // debug removed
        this.currentFile = file;
        this.error = null;
        return file;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async downloadFile(fileId) {
      try {
        await fileService.downloadFile(fileId);
      } catch (error) {
        this.error = error.message;
      }
    },
    
    async requestAccess(fileId, requestType, reason) {
      try {
        await fileService.requestAccess(fileId, requestType, reason);
      } catch (error) {
        this.error = error.message;
      }
    }
  }
});