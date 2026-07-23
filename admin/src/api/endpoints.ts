import api from './client';

// Auth
export const authApi = {
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  loginWithGoogle: () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`;
  },
};

// Users
export const usersApi = {
  getPending: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/users/pending', { params }),
  getApproved: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/users/approved', { params }),
  getRejected: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/users/rejected', { params }),
  approve: (id: string) => api.patch(`/users/${id}/approve`),
  reject: (id: string) => api.patch(`/users/${id}/reject`),
};

// Incidents
export const incidentsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/incidents', { params }),
  getOne: (id: string) => api.get(`/incidents/${id}`),
  create: (data: { title: string; description: string; severity: string }) =>
    api.post('/incidents', data),
  close: (id: string) => api.patch(`/incidents/${id}/close`),
};

// Notifications
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/notifications', { params }),
  getOne: (id: string) => api.get(`/notifications/${id}`),
};

// Audit Logs
export const auditLogsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/audit-logs', { params }),
};

// Telegram
export const telegramApi = {
  getConnectLink: () => api.get('/telegram/connect'),
};
