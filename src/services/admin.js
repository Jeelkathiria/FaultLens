import api from './api';

export const adminService = {
  getUsers() {
    return api.get('/admin/users');
  },

  toggleUserStatus(id) {
    return api.patch(`/admin/users/${id}/status`);
  },

  getWebsites() {
    return api.get('/admin/websites');
  },

  getIncidents() {
    return api.get('/admin/incidents');
  },

  getSystemHealth() {
    return api.get('/admin/system-health');
  },

  getDashboardSummary() {
    return api.get('/dashboard/summary');
  }
};
