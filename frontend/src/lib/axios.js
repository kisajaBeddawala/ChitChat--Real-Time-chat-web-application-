import axios from 'axios';

// Set base URL for all requests
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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