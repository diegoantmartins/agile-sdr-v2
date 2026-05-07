export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  status: LeadStatus;
  score: number;
  temperature: 'cold' | 'warm' | 'hot';
  source: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export type LeadStatus = 'new' | 'in_progress' | 'qualified' | 'meeting' | 'lost' | 'archived';

export interface Message {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  isAiGenerated: boolean;
  createdAt: string;
  intentDetected?: string;
}

export interface Conversation {
  id: string;
  lead: Lead;
  messages: Message[];
  lastMessageAt: string;
  ownerType: 'agent' | 'human';
  tags: string[];
}

export interface DashboardMetrics {
  leadsToday: number;
  leadsYesterday: number;
  activeConversations: number;
  responseRate: number;
  responseRateChange: number;
  qualificationRate: number;
  meetingsGenerated: number;
  revenue?: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  objective: string;
  tone: 'consultivo' | 'vendedor' | 'técnico';
  targetAudience: string;
  prompt: string;
  autoRespond: boolean;
  responseDelay: number;
  maxMessages: number;
  escalateToHuman: string[];
  followUps: FollowUpConfig[];
}

export interface FollowUpConfig {
  id: string;
  delayMinutes: number;
  message: string;
  enabled: boolean;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  config?: Record<string, string>;
}