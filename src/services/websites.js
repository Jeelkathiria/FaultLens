import api from './api';

export const websiteService = {
  getWebsites() {
    return api.get('/websites');
  },

  getWebsiteById(id) {
    return api.get(`/websites/${id}`);
  },

  createWebsite(data) {
    return api.post('/websites', data);
  },

  updateWebsite(id, data) {
    return api.patch(`/websites/${id}`, data);
  },

  deleteWebsite(id) {
    return api.delete(`/websites/${id}`);
  },

  // API sub-resources
  getApisByWebsite(websiteId) {
    return api.get(`/websites/${websiteId}/apis`);
  },

  createApi(websiteId, apiData) {
    return api.post(`/websites/${websiteId}/apis`, apiData);
  },

  getApiById(apiId) {
    return api.get(`/apis/${apiId}`);
  },

  updateApi(apiId, apiData) {
    return api.patch(`/apis/${apiId}`, apiData);
  },

  deleteApi(apiId) {
    return api.delete(`/apis/${apiId}`);
  },

  checkApiNow(apiId) {
    return api.post(`/apis/${apiId}/check`);
  },

  getSubEndpoints(apiId, timeRange = '24h') {
    return api.get(`/apis/${apiId}/sub-endpoints?timeRange=${timeRange}`);
  }
};
