import api from './api';

export const logService = {
  getLogs(filters = {}) {
    return api.get('/logs', filters);
  },

  getLogById(id) {
    return api.get(`/logs/${id}`);
  }
};
