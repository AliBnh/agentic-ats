import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentic_ats_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await apiClient.post('/api/auth/login', { email, password });
    return res.data;
  },
  register: async (email, password, full_name) => {
    const res = await apiClient.post('/api/auth/register', { email, password, full_name });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/api/auth/me');
    return res.data;
  },

  // Threads & Sessions
  getThreads: async () => {
    const res = await apiClient.get('/api/threads');
    return res.data;
  },
  createThread: async (title = 'New Resume Audit', language = 'en') => {
    const res = await apiClient.post('/api/threads', null, { params: { title, language } });
    return res.data;
  },
  deleteThread: async (threadId) => {
    const res = await apiClient.delete(`/api/threads/${threadId}`);
    return res.data;
  },
  getSampleCatalog: async () => {
    const res = await apiClient.get('/api/threads/samples/catalog');
    return res.data;
  },

  // Audit & Optimization
  uploadResume: async (formData) => {
    const res = await apiClient.post('/api/audit/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  confirmParsing: async (threadId, verifiedText, language = 'en') => {
    const res = await apiClient.post('/api/audit/confirm-parsing', {
      thread_id: threadId,
      verified_text: verifiedText,
      language: language,
    });
    return res.data;
  },
  matchJob: async (threadId, jobDescription, targetRole = '') => {
    const res = await apiClient.post('/api/audit/match-job', {
      thread_id: threadId,
      job_description: jobDescription,
      target_role: targetRole,
    });
    return res.data;
  },
  resumeHITL: async (threadId, skill, decision, notes = '') => {
    const res = await apiClient.post(`/api/audit/resume/${threadId}`, {
      skill,
      decision,
      notes,
    });
    return res.data;
  },
  getAuditResult: async (threadId) => {
    const res = await apiClient.get(`/api/audit/result/${threadId}`);
    return res.data;
  },
  exportPdf: async (markdownContent) => {
    const res = await apiClient.post(
      '/api/audit/export/pdf',
      { markdown_content: markdownContent },
      { responseType: 'blob' }
    );
    return res.data;
  },
};
