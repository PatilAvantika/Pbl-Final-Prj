import { AiService } from './ai.service';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
import { TasksService } from '../tasks/tasks.service';
export declare class AiController {
    private readonly aiService;
    private readonly decision;
    private readonly tasksService;
    constructor(aiService: AiService, decision: DecisionIntelligenceService, tasksService: TasksService);
    reliability(req: any, workerId: string): Promise<import("./ai.service").AiReliabilityResponse>;
    taskSuggestions(req: any, taskId: string): Promise<import("./ai.service").AiTaskSuggestionsResponse>;
}
