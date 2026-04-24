import { TeamLeaderService } from './team-leader.service';
export declare class TeamLeaderController {
    private readonly teamLeaderService;
    constructor(teamLeaderService: TeamLeaderService);
    dashboard(req: any): Promise<{
        totalTasks: number;
        activeTasks: number;
        totalVolunteers: number;
        attendanceToday: number;
        reportsSubmitted: number;
        reportsPending: number;
        reportsApproved: number;
        reportsRejected: number;
    }>;
}
