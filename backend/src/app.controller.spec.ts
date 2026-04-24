import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AdminDashboardService } from './admin/admin-dashboard.service';
import { AdminMapDataService } from './admin/admin-map-data.service';

describe('AppController', () => {
  let appController: AppController;
  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([1]),
    task: { count: jest.fn().mockResolvedValue(3) },
    attendance: {
      groupBy: jest.fn().mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]),
      count: jest.fn().mockResolvedValue(1),
    },
    fieldReport: {
      count: jest.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(8),
    },
    leave: { count: jest.fn().mockResolvedValue(2) },
    payslip: { count: jest.fn().mockResolvedValue(10) },
    auditLog: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'a1',
          action: 'TASK_CREATED',
          entityType: 'Task',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          actor: { firstName: 'Jane', lastName: 'Admin' },
        },
      ]),
    },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AdminDashboardService, useValue: { getDashboardKpis: jest.fn() } },
        { provide: AdminMapDataService, useValue: { getMapData: jest.fn() } },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('admin metrics', () => {
    it('returns operational KPI payload', async () => {
      const result = await appController.getAdminMetrics('2026-01-01', '2026-01-31');
      expect(result.kpis.activeTasks).toBe(3);
      expect(result.kpis.volunteersOnField).toBe(2);
      expect(result.kpis.reportsPending).toBe(4);
      expect(result.kpis.reportsInRange).toBe(8);
      expect(result.recentActivity).toHaveLength(1);
    });
  });
});
