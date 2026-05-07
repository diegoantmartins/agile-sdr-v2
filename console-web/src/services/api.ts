import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AgentConfig {
  companyName: string;
  primaryCTA: string;
  tone: string;
  customPrompt: string;
  businessNiche: string;
  maxReplyChars: number;
  autoReplyEnabled: boolean;
  qualificationQuestions: string[];
  systemPromptTemplate?: string;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers['x-admin-token'] = token;
  }
  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('tenant_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface DashboardStats {
  totalContacts: number;
  totalBudgets: number;
  totalOpportunities: number;
  hotOpportunities: number;
  metrics: {
    messagesToday: number;
    agentResponses: number;
    chatwootSyncs: number;
    pendingHandoffs: number;
  };
  pipeline: { stage: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  intentDistribution: { intent: string; count: number }[];
  recentActivity: {
    id: string;
    content: string;
    leadName: string;
    createdAt: string;
    isAiGenerated: boolean;
  }[];
}

export interface Opportunity {
  id: string;
  contactId: string;
  stage: string;
  temperature: string;
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  budget?: {
    id: string;
    amount: number;
  };
}

export interface Lead {
  id: string;
  tenantId: string;
  phone: string;
  name: string;
  email?: string;
  company?: string;
  source?: string;
  status: string;
  score: number;
  temperature: string;
  intentClassified?: string;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  leadId: string;
  tenantId: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  channel?: string;
  isAiGenerated: boolean;
  intentDetected?: string;
  createdAt: string;
}

export const dashboardService = {
  getStats: () => api.get<DashboardStats>('/api/dashboard/stats').then((r) => r.data),
};

export const leadsService = {
  getAll: () => api.get<Lead[]>('/api/leads').then((r) => r.data),
  getByPhone: (phone: string) => api.get<Lead>(`/api/leads/${phone}`).then((r) => r.data),
  create: (data: { phone: string; name: string; email?: string; company?: string; source?: string }) =>
    api.post<Lead>('/api/leads', data).then((r) => r.data),
  update: (phone: string, data: Partial<Lead>) =>
    api.put<Lead>(`/api/leads/${phone}`, data).then((r) => r.data),
  getHot: () => api.get<Lead[]>('/api/leads/hot').then((r) => r.data),
};

export const opportunitiesService = {
  getAll: (stage?: string, limit = 50) =>
    api.get<Opportunity[]>('/api/opportunities', { params: { stage, limit } }).then((r) => r.data),
};

export const agentConfigService = {
  get: () => api.get<AgentConfig>('/api/admin/agent-config').then((r) => r.data),
  update: (config: Partial<AgentConfig>) =>
    api.put<AgentConfig>('/api/admin/agent-config', config).then((r) => r.data),
};

export const integrationsService = {
  getProviders: () => api.get('/api/integrations/providers').then((r) => r.data),
};

export const commercialService = {
  getTemplates: () => api.get('/api/commercial/templates').then((r) => r.data),
  getNextAction: (data: { niche: string; leadStage: string; intent: string; score: number }) =>
    api.post('/api/commercial/next-action', data).then((r) => r.data),
};

export const messagesService = {
  getRecent: (limit = 20) => api.get<Message[]>('/api/messages/recent', { params: { limit } }).then((r) => r.data),
};

export const logsService = {
  get: () => api.get<{ logs: any[], timestamp: string }>('/api/admin/logs').then((r) => r.data),
};