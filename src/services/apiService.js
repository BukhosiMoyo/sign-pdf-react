import API_CONFIG from '../config/api.js';

// API Service for Compress PDF React App
class ApiService {
  // Generic fetch wrapper with error handling
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Sign API
  async createDocument({ ownerId, title, pdfBase64 }) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.CREATE_DOCUMENT);
    return this.fetchWithErrorHandling(url, { method: 'POST', body: JSON.stringify({ ownerId, title, pdfBase64 }) });
  }

  async setFields(documentId, fields) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SET_FIELDS(documentId));
    return this.fetchWithErrorHandling(url, { method: 'POST', body: JSON.stringify({ fields }) });
  }

  async setSigners(documentId, signers) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SET_SIGNERS(documentId));
    return this.fetchWithErrorHandling(url, { method: 'POST', body: JSON.stringify({ signers }) });
  }

  async getDocument(documentId) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.GET_DOCUMENT(documentId));
    return this.fetchWithErrorHandling(url);
  }

  async upsertUser({ email, name }) {
    const url = API_CONFIG.getUrl('/api/users');
    return this.fetchWithErrorHandling(url, { method: 'POST', body: JSON.stringify({ email, name }) });
  }

  async resolveSign(token) {
    const url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.RESOLVE_SIGN(token));
    return this.fetchWithErrorHandling(url);
  }

  async getSettings() {
    const url = API_CONFIG.getUrl('/api/settings');
    return this.fetchWithErrorHandling(url);
  }

  async updateSettings(payload) {
    const url = API_CONFIG.getUrl('/api/settings');
    return this.fetchWithErrorHandling(url, { method: 'POST', body: JSON.stringify(payload) });
  }

  async listOwnerDocuments(ownerId) {
    const url = API_CONFIG.getUrl(`/api/owners/${ownerId}/documents`);
    return this.fetchWithErrorHandling(url);
  }

  async getEvents(documentId) {
    const url = API_CONFIG.getUrl(`/api/documents/${documentId}/events`);
    return this.fetchWithErrorHandling(url);
  }

  async revokeSigner(id) { return this.fetchWithErrorHandling(API_CONFIG.getUrl(`/api/signers/${id}/revoke`), { method:'POST' }); }
  async regenerateSigner(id) { return this.fetchWithErrorHandling(API_CONFIG.getUrl(`/api/signers/${id}/regenerate`), { method:'POST' }); }
  async extendSigner(id, days=30) { return this.fetchWithErrorHandling(API_CONFIG.getUrl(`/api/signers/${id}/extend`), { method:'POST', body: JSON.stringify({ days }) }); }

  async createPreviewLink(documentId) {
    return this.fetchWithErrorHandling(API_CONFIG.getUrl(`/api/documents/${documentId}/preview-link`), { method:'POST' });
  }
}

// Export singleton instance
export default new ApiService();
