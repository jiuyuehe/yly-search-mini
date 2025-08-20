import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api', // Update with your actual API base URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  config => {
    // You can add auth token here if needed
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error('API Error:', error.response.data);
      
      if (error.response.status === 401) {
        // Handle unauthorized access
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;