import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dashboardService,
  leadsService,
  opportunitiesService,
  agentConfigService,
  messagesService,
  knowledgeService,
  Knowledge,
  api,
} from '../services/api';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  leads: ['leads'] as const,
  leadsHot: ['leads', 'hot'] as const,
  opportunities: ['opportunities'] as const,
  messages: ['messages'] as const,
  agentConfig: ['agentConfig'] as const,
  knowledge: ['knowledge'] as const,
};

export function useKnowledge() {
  return useQuery({
    queryKey: queryKeys.knowledge,
    queryFn: knowledgeService.getAll,
  });
}

export function useCreateKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: knowledgeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge });
    },
  });
}

export function useUpdateKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Knowledge> }) =>
      knowledgeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge });
    },
  });
}

export function useDeleteKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: knowledgeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge });
    },
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardService.getStats,
    refetchInterval: 30000,
  });
}

export function useLeads() {
  return useQuery({
    queryKey: queryKeys.leads,
    queryFn: leadsService.getAll,
    refetchInterval: 15000,
  });
}

export function useLeadByPhone(phone: string) {
  return useQuery({
    queryKey: [...queryKeys.leads, phone],
    queryFn: () => leadsService.getByPhone(phone),
    enabled: !!phone,
  });
}

export function useHotLeads() {
  return useQuery({
    queryKey: queryKeys.leadsHot,
    queryFn: leadsService.getHot,
  });
}

export function useOpportunities(stage?: string) {
  return useQuery({
    queryKey: [...queryKeys.opportunities, stage],
    queryFn: () => opportunitiesService.getAll(stage),
  });
}

export function useMessages() {
  return useQuery({
    queryKey: queryKeys.messages,
    queryFn: () => messagesService.getRecent(),
  });
}

export function useAgentConfig() {
  return useQuery({
    queryKey: queryKeys.agentConfig,
    queryFn: agentConfigService.get,
  });
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agentConfigService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agentConfig });
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ phone, data }: { phone: string; data: Record<string, unknown> }) =>
      leadsService.update(phone, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
    },
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then((r) => r.data),
    refetchInterval: 10000,
  });
}