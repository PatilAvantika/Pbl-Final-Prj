import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export type ReliabilityCategory = 'reliable' | 'average' | 'at_risk';
export type WorkerSuggestion = {
    worker_id: string;
    worker_name: string;
    score: number;
    reliability_score: number;
    distance_score: number;
    workload_score: number;
    badge: string;
};
export declare class DecisionIntelligenceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private reliabilityWindowStart;
    private absenceWindowStart;
    private hasApprovedLeaveAt;
    private hasTimelyClockIn;
    assertWorkerInOrganization(workerId: string, organizationId: string): Promise<void>;
    computeReliability(workerId: string, organizationId: string): Promise<{
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
    }>;
    lastTwoAssignedIncomplete(workerId: string, organizationId: string): Promise<boolean>;
    listAtRiskWorkers(organizationId: string): Promise<Array<{
        worker_id: string;
        worker_name: string;
        reliability_score: number;
        category: ReliabilityCategory;
        at_risk: true;
        reasons: string[];
    }>>;
    private distanceScoreMeters;
    private workloadScoreToday;
    suggestWorkersForTask(taskId: string, organizationId: string): Promise<WorkerSuggestion[]>;
    listTaskRiskAlerts(organizationId: string): Promise<Array<{
        worker_id: string;
        worker_name: string;
        task_id: string;
        task_title: string;
        status: 'ABSENT';
        task_start_time: string;
        replacement_suggestions: WorkerSuggestion[];
    }>>;
    countAbsenceEvents(workerId: string, organizationId: string): Promise<number>;
    listAbsenceRisk(organizationId: string): Promise<Array<{
        worker_id: string;
        absence_events_7d: number;
        label: 'HIGH_RISK_ABSENCE' | 'OK';
    }>>;
    assertCanViewWorker(requesterId: string, requesterRole: Role, workerId: string): void;
}
