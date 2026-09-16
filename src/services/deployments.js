import api from './api';

export const deploymentService = {
  getDeployments(filters = {}) {
    return api.get('/deployments', filters);
  },

  getDeploymentById(id) {
    return api.get(`/deployments/${id}`);
  },

  createDeployment(data) {
    return api.post('/deployments', data);
  }
};
