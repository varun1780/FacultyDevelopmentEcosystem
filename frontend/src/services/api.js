import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const AI_API_BASE = import.meta.env.VITE_AI_API || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const aiAxios = axios.create({
  baseURL: AI_API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT token to all requests
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('fdphub_user');
  if (stored) {
    const user = JSON.parse(stored);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fdphub_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
};

// FDP APIs
export const fdpAPI = {
  getAll: (collegeId, category) => {
    let url = '/fdp/all';
    const params = new URLSearchParams();
    if (collegeId) params.append('collegeId', collegeId);
    if (category) params.append('category', category);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
  getById: (id) => api.get(`/fdp/${id}`),
  create: (data) => api.post('/fdp/create', data),
  update: (id, data) => api.put(`/admin/fdp/update/${id}`, data),
  delete: (id) => api.delete(`/admin/fdp/delete/${id}`),
  generateContent: (id) => api.post(`/fdp/${id}/generate-content`),
  generateQuiz: (id, count = 5) => api.post(`/fdp/${id}/generate-quiz?count=${count}`),
  getEnrolledFaculty: (id) => api.get(`/fdp/${id}/enrolled-faculty`),
  suggestVideo: (topic) => api.get(`/admin/fdp/suggest-video?topic=${encodeURIComponent(topic)}`),
  uploadVideo: (formData) => api.post('/upload/video', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadPdf: (formData) => api.post('/upload/pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  generateModuleNotes: (title, fdpTitle) => api.post('/admin/fdp/generate-module-notes', { title, fdpTitle }),
  getCategories: () => api.get('/categories'),
};

// Enrollment APIs
export const enrollmentAPI = {
  enroll: (fdpId, userId) => api.post(`/fdp/enroll/${fdpId}`, { userId }),
  getMyEnrollments: (userId) => api.get(`/enrollments/my?userId=${userId}`),
  updateProgress: (id, data) => api.post(`/enrollments/${id}/complete-module`, data),
  completeModule: (id, data) => api.post(`/enrollments/${id}/complete-module`, data),
  submitQuiz: (enrollmentId, data) => api.post('/quiz/submit', { enrollmentId, ...data }),
  submitAssignment: (enrollmentId, data) => api.post('/assignment/submit', { enrollmentId, ...data }),
};

// AI APIs
export const aiAPI = {
  generateContent: (data) => aiAxios.post('/generate-content', data),
  generateQuiz: (data) => aiAxios.post('/generate-quiz', data),
  generateSummary: (data) => aiAxios.post('/generate-summary', data),
  generateNotes: (data) => aiAxios.post('/generate-notes', data),
  evaluate: (data) => api.post('/ai/evaluate', data),
  recommend: (data) => api.post('/ai/recommend', data || {}),
  skillGap: (data) => api.post('/ai/skill-gap', data || {}),
  chat: (messages, courseContext) => aiAxios.post('/api/ai-mentor/chat', { messages, courseContext }),
};

// Certificate APIs
export const certificateAPI = {
  issue: (userId, fdpId) => api.post('/certificate/issue', { userId, fdpId }),
  generate: (userId, fdpId) => api.post('/certificate/generate', { userId, fdpId }),
  verify: (certificateId) => api.get(`/certificate/verify/${certificateId}`),
  updateBlockchain: (certId, txHash) => api.post(`/certificate/${certId}/blockchain`, { txHash }),
  getMyCertificates: (userId) => api.get(`/certificate/my?userId=${userId}`),
  getActiveTemplate: () => api.get('/certificate-templates/active'),
  updateActiveTemplate: (data) => api.put('/admin/certificate-templates/active', data),
  getTemplateByFdpId: (fdpId) => api.get(`/fdp/${fdpId}/certificate-template`),
  saveTemplate: (fdpId, data) => api.put(`/fdp/${fdpId}/certificate-template`, data),
};

// Analytics APIs
export const analyticsAPI = {
  getAdminAnalytics: () => api.get('/analytics/admin'),
  getFacultyAnalytics: (userId) => api.get(`/analytics/faculty?userId=${userId}`),
};

// Faculty APIs
export const facultyAPI = {
  getAll: () => api.get('/faculty/all'),
  getById: (id) => api.get(`/faculty/${id}`),
  update: (id, data) => api.put(`/faculty/${id}`, data),
  changePassword: (id, data) => api.post(`/faculty/${id}/change-password`, data),
};

// Admin Users APIs
export const adminUsersAPI = {
  getAll: () => api.get('/admin/users'),
  getById: (id) => api.get(`/admin/users/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

// Admin Reports APIs
export const adminReportsAPI = {
  getSummary: () => api.get('/admin/reports/summary'),
  getFdpEnrollments: () => api.get('/admin/reports/fdp-enrollments'),
  getFacultyPerformance: () => api.get('/admin/reports/faculty-performance'),
  getCertificates: () => api.get('/admin/reports/certificates'),
};

// Skill Analysis APIs (real, database-driven)
export const skillAnalysisAPI = {
  getAnalysis: (userId) => api.get(`/skill-analysis?userId=${userId}`),
  getRecommendations: (userId) => api.get(`/recommendations?userId=${userId}`),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/read/${id}`),
  markAllAsRead: () => api.put('/notifications/read/all'),
  create: (data) => api.post('/notifications', data),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications/all'),
};

// College APIs
export const collegeAPI = {
  getAll: () => api.get('/colleges'),
  getById: (id) => api.get(`/colleges/${id}`),
  create: (data) => api.post('/colleges', data),
  update: (id, data) => api.put(`/colleges/${id}`, data),
};

export default api;
