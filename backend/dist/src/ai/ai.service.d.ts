import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
export type AiReliabilityCategory = 'low' | 'medium' | 'high';
export type AiReliabilityResponse = {
    worker_id: string;
    ai_score: number;
    category: AiReliabilityCategory;
    source: 'ai' | 'fallback';
};
export type AiTaskSuggestionsResponse = {
    task_id: string;
    suggestions: import('../analytics/decision-intelligence.service').WorkerSuggestion[];
    source: 'ai' | 'fallback';
};
export declare class AiService {
    private readonly decision;
    private readonly logger;
    private readonly aiBaseUrl;
    constructor(decision: DecisionIntelligenceService);
    predictReliability(workerId: string, organizationId: string): Promise<AiReliabilityResponse>;
    predictTaskSuggestions(taskId: string, organizationId: string): Promise<AiTaskSuggestionsResponse>;
}
