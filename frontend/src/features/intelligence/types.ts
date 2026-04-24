export type ReliabilityCategory = 'reliable' | 'average' | 'at_risk';

export type WorkerReliabilityResponse = {
  worker_id: string;
  reliability_score: number;
  category: ReliabilityCategory;
  attendance_rate: number;
  task_completion_rate: number;
  report_approval_rate: number;
  present_days: number;
  assigned_days: number;
  completed_tasks: number;
  assigned_tasks: number;
  approved_reports: number;
  total_reports: number;
  badge: string;
};

export type AtRiskWorkerRow = {
  worker_id: string;
  worker_name: string;
  reliability_score: number;
  category: ReliabilityCategory;
  at_risk: true;
  reasons: string[];
};

export type WorkerSuggestion = {
  worker_id: string;
  worker_name: string;
  score: number;
  reliability_score: number;
  distance_score: number;
  workload_score: number;
  badge: string;
};

export type TaskRiskAlert = {
  worker_id: string;
  worker_name: string;
  task_id: string;
  task_title: string;
  status: 'ABSENT';
  task_start_time: string;
  replacement_suggestions: WorkerSuggestion[];
};

export type ChatbotQueryResponse = {
  reply: string;
  data?: Record<string, unknown>;
  actions?: string[];
  source?: 'ai' | 'rule';
};

export type AiReliabilityCategory = 'low' | 'medium' | 'high';

export type AiReliabilityResponse = {
  worker_id: string;
  ai_score: number;
  category: AiReliabilityCategory;
  source: 'ai' | 'fallback';
};

export type AiTaskSuggestionsResponse = {
  task_id: string;
  suggestions: WorkerSuggestion[];
  source: 'ai' | 'fallback';
};

export type ChatbotAiResponse = ChatbotQueryResponse & {
  source?: 'ai' | 'fallback';
};
