import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
export declare class AlertsController {
    private readonly decision;
    constructor(decision: DecisionIntelligenceService);
    taskRisk(req: any): Promise<{
        worker_id: string;
        worker_name: string;
        task_id: string;
        task_title: string;
        status: "ABSENT";
        task_start_time: string;
        replacement_suggestions: import("../analytics/decision-intelligence.service").WorkerSuggestion[];
    }[]>;
}
