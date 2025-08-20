export class StreamingService {
  constructor() {
    this.controller = null;
  }
  
  async fetchStream(url, options = {}, onChunk) {
    // Cancel any previous request
    if (this.controller) {
      this.controller.abort();
    }
    
    // Create a new abort controller for this request
    this.controller = new AbortController();
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: this.controller.signal,
        headers: {
          ...options.headers,
          Accept: 'text/event-stream'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    } finally {
      this.controller = null;
    }
  }
  
  cancelStream() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}

export const streamingService = new StreamingService();