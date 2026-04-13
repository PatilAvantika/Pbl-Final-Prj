import { PrismaService } from '../prisma/prisma.service';
export declare class AdminMapDataService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private replayOpenTaskId;
    getMapData(organizationId: string): Promise<{
        tasks: Array<{
            id: string;
            title: string;
            lat: number;
            lng: number;
            radius: number;
        }>;
        volunteers: Array<{
            id: string;
            name: string;
            lat: number;
            lng: number;
            status: 'ACTIVE' | 'INACTIVE';
        }>;
    }>;
}
