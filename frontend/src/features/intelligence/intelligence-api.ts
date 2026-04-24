import api from '@/lib/api/client';
import type {
  AiReliabilityResponse,
  AiTaskSuggestionsResponse,
  AtRiskWorkerRow,
  ChatbotAiResponse,
  ChatbotQueryResponse,
  TaskRiskAlert,
  WorkerReliabilityResponse,
  WorkerSuggestion,
} from './types';

export async function fetchWorkerReliability(workerId: string): Promise<WorkerReliabilityResponse> {
  const res = await api.get<WorkerReliabilityResponse>(`/analytics/worker-reliability/${workerId}`);
  return res.data;
}

export async function fetchAtRiskWorkers(): Promise<AtRiskWorkerRow[]> {
  const res = await api.get<AtRiskWorkerRow[]>('/analytics/at-risk-workers');
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchTaskSuggestions(taskId: string): Promise<WorkerSuggestion[]> {
  const res = await api.get<WorkerSuggestion[]>(`/tasks/suggestions/${taskId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchTaskRiskAlerts(): Promise<TaskRiskAlert[]> {
  const res = await api.get<TaskRiskAlert[]>('/alerts/task-risk');
  return Array.isArray(res.data) ? res.data : [];
}

export async function sendChatbotQuery(userId: string, message: string): Promise<ChatbotQueryResponse> {
  const res = await api.post<ChatbotQueryResponse>('/chatbot/query', { user_id: userId, message });
  return res.data;
}

export async function fetchAiReliability(workerId: string): Promise<AiReliabilityResponse> {
  const res = await api.get<AiReliabilityResponse>(`/ai/reliability/${workerId}`);
  return res.data;
}

export async function fetchAiTaskSuggestions(taskId: string): Promise<AiTaskSuggestionsResponse> {
  const res = await api.get<AiTaskSuggestionsResponse>(`/ai/task-suggestions/${taskId}`);
  return res.data;
}

export async function sendChatbotAiQuery(userId: string, message: string): Promise<ChatbotAiResponse> {
  const res = await api.post<ChatbotAiResponse>('/chatbot/ai', { user_id: userId, message });
  return res.data;
}
