import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentic_ats_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  login: async (email, password) => (await apiClient.post('/api/auth/login', { email, password })).data,
  register: async (email, password, full_name) => (await apiClient.post('/api/auth/register', { email, password, full_name })).data,
  getMe: async () => (await apiClient.get('/api/auth/me')).data,
  getThreads: async () => (await apiClient.get('/api/threads')).data,
  createThread: async (title = 'New Resume Audit', language = 'en') =>
    (await apiClient.post('/api/threads', null, { params: { title, language } })).data,
  deleteThread: async (threadId) => (await apiClient.delete(`/api/threads/${threadId}`)).data,
  getSampleCatalog: async () => (await apiClient.get('/api/threads/samples/catalog')).data,
  uploadResume: async (formData) =>
    (await apiClient.post('/api/audit/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  confirmParsing: async (threadId, verifiedText, language = 'en', parsedAst = null) =>
    (await apiClient.post('/api/audit/confirm-parsing', {
      thread_id: threadId,
      verified_text: verifiedText,
      language,
      parsed_ast: parsedAst,
    })).data,
  matchJob: async (threadId, jobDescription, targetRole = '') =>
    (await apiClient.post('/api/audit/match-job', { thread_id: threadId, job_description: jobDescription, target_role: targetRole })).data,
  matchJobStream: async (threadId, jobDescription, targetRole = '', onEvent) => {
    const token = localStorage.getItem('agentic_ats_token');
    const response = await fetch(`${API_BASE_URL}/api/audit/match-job/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ thread_id: threadId, job_description: jobDescription, target_role: targetRole }),
    });
    if (!response.ok) throw new Error((await response.text()) || 'Unable to stream the workflow.');
    if (!response.body) throw new Error('Streaming is not supported by this browser.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalEvent;
    const consume = (chunk) => {
      buffer += decoder.decode(chunk, { stream: true });
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || '';
      messages.forEach((message) => {
        const line = message.split('\n').find((value) => value.startsWith('data:'));
        if (!line) return;
        const event = JSON.parse(line.slice(5).trim());
        onEvent?.(event);
        if (['complete', 'hitl', 'error'].includes(event.type)) finalEvent = event;
      });
    };
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      consume(value);
    }
    if (buffer) consume(new Uint8Array());
    if (finalEvent?.type === 'error') throw new Error(finalEvent.message);
    return finalEvent?.result || finalEvent;
  },
  resumeHITL: async (threadId, skill, decision, notes = '') =>
    (await apiClient.post(`/api/audit/resume/${threadId}`, { skill, decision, notes })).data,
  getAuditResult: async (threadId) => (await apiClient.get(`/api/audit/result/${threadId}`)).data,
  exportPdf: async (markdownContent) =>
    (await apiClient.post('/api/audit/export/pdf', { markdown_content: markdownContent }, { responseType: 'blob' })).data,
};
