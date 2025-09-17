// API Configuration for Sign PDF React App
const API_CONFIG = {
  // Base URL for the API (env override for dev)
  BASE_URL: (import.meta?.env?.VITE_API_BASE) || 'http://127.0.0.1:4000',
  
  // API Endpoints
  ENDPOINTS: {
    // Health check
    HEALTH: '/health',
    
    // Sign API endpoints
    CREATE_DOCUMENT: '/api/documents',
    GET_DOCUMENT: (id) => `/api/documents/${id}`,
    SET_FIELDS: (id) => `/api/documents/${id}/fields`,
    SET_SIGNERS: (id) => `/api/documents/${id}/signers`,
    STREAM_FILE: (id) => `/api/documents/${id}/file`,
    RESOLVE_SIGN: (token) => `/api/sign/${token}`,
    SAVE_SIGN: (token) => `/api/sign/${token}/save`,
    FINISH_SIGN: (token) => `/api/sign/${token}/finish`,
  },
  
  // Get full URL for an endpoint
  getUrl: (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
