import api from './api';

export const incidentService = {
  getIncidents(filters = {}) {
    return api.get('/incidents', filters);
  },

  getIncidentById(id) {
    return api.get(`/incidents/${id}`);
  },

  updateStatus(id, status) {
    return api.patch(`/incidents/${id}/status`, { status });
  },

  acknowledge(id) {
    return api.post(`/incidents/${id}/acknowledge`);
  },

  resolve(id) {
    return api.post(`/incidents/${id}/resolve`);
  },

  simulateIncident(data) {
    return api.post('/incidents/simulate', data);
  }
};
