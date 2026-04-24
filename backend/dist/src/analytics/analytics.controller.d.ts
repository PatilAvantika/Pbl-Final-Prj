import { DecisionIntelligenceService } from './decision-intelligence.service';
export declare class AnalyticsController {
    private readonly decision;
    constructor(decision: DecisionIntelligenceService);
    workerReliability(req: any, workerId: string): Promise<{
        worker_id: string;
        reliability_score: number;
        category: import("./decision-intelligence.service").ReliabilityCategory;
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
    }>;
    atRiskWorkers(req: any): Promise<{
        worker_id: string;
        worker_name: string;
        reliability_score: number;
        category: import("./decision-intelligence.service").ReliabilityCategory;
        at_risk: true;
        reasons: string[];
    }[]>;
    absenceRisk(req: any): Promise<{
        worker_id: string;
        absence_events_7d: number;
        label: "HIGH_RISK_ABSENCE" | "OK";
    }[]>;
}
