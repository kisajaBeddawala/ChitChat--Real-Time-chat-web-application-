import axios from 'axios';

// Automatically detect backend URL based on current hostname
const getBackendURL = () => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    
    console.log('🌐 Current hostname:', hostname);
    
    // If accessing via localhost, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const url = import.meta.env.VITE_LOCALHOST_BACKEND_URL || 'http://localhost:5001';
      console.log('🏠 Using localhost backend URL:', url);
      return url;
    }
    
    // If accessing via ngrok URL, use ngrok backend
    if (hostname.includes('ngrok') || hostname.includes('tunnels.dev')) {
      const ngrokUrl = import.meta.env.VITE_NGROK_BACKEND_URL;
      if (ngrokUrl) {
        console.log('🌍 Using ngrok backend URL:', ngrokUrl);
        return ngrokUrl;
      }
      console.warn('⚠️ Accessing via ngrok but VITE_NGROK_BACKEND_URL not set!');
    }
    
    // For network access, try ngrok first, then network URL
    const ngrokUrl = import.meta.env.VITE_NGROK_BACKEND_URL;
    if (ngrokUrl) {
      console.log('🌍 Using ngrok backend URL for network access:', ngrokUrl);
      return ngrokUrl;
    }
    
    // Fallback to network backend URL
    const networkUrl = import.meta.env.VITE_NETWORK_BACKEND_URL || `http://${hostname.replace(/:\d+$/, '')}:5001`;
    console.log('🌐 Using network backend URL:', networkUrl);
    return networkUrl;
  }
  
  // Final fallback
  const fallbackUrl = import.meta.env.VITE_LOCALHOST_BACKEND_URL || 'http://localhost:5001';
  console.log('🔄 Using fallback backend URL:', fallbackUrl);
  return fallbackUrl;
};

// Set base URL for all requests
axios.defaults.baseURL = getBackendURL();

// Log the backend URL being used
console.log('🚀 Using backend URL:', getBackendURL());

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.token = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect on specific 401 errors, not all
      const errorMessage = error.response?.data?.message;
      if (errorMessage === 'Token expired' || errorMessage === 'Invalid token' || !localStorage.getItem('token')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;