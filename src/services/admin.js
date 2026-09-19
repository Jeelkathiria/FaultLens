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

  getInfrastructure() {
    return api.get('/admin/infrastructure');
  },

  getQueueJobs(name) {
    return api.get(`/admin/infrastructure/queues/${encodeURIComponent(name)}/jobs`);
  },

  getDashboardSummary() {
    return api.get('/dashboard/summary');
  }
};
