import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.module';
import { PrismaService } from '../../database/prisma.service';
import { SMSService } from '../../integrations/sms/sms.service';
import { AttendanceStatus, LeaveStatus } from '@prisma/client';

describe('AttendanceService (Unit & Automation Tests)', () => {
  let service: AttendanceService;
  let prisma: any;
  let smsService: any;

  beforeEach(async () => {
    prisma = {
      academicYear: {
        findFirst: jest.fn().mockResolvedValue({ id: 'year-2026', isCurrent: true }),
      },
      studentAttendance: {
        upsert: jest.fn().mockImplementation(({ where, create, update }) => {
          return Promise.resolve({
            id: 'att-1',
            ...create,
            ...update,
          });
        }),
        findMany: jest.fn().mockResolvedValue([
          { status: AttendanceStatus.PRESENT },
          { status: AttendanceStatus.PRESENT },
          { status: AttendanceStatus.LATE },
          { status: AttendanceStatus.ABSENT },
        ]),
      },
      student: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'st-1',
            firstName: 'Alex',
            lastName: 'Johnson',
            parents: [
              {
                parent: {
                  id: 'parent-1',
                  userId: 'user-p-1',
                  phone: '+1-555-0144',
                },
              },
            ],
          },
        ]),
      },
      studentEnrollment: {
        findMany: jest.fn().mockResolvedValue([
          {
            rollNumber: 1,
            student: {
              id: 'st-1',
              firstName: 'Alex',
              lastName: 'Johnson',
              gender: 'MALE',
              admissionNumber: 'ADM-2026-0042',
              user: { email: 'alex@student.edu' },
              attendances: [{ status: AttendanceStatus.PRESENT, remarks: 'On time' }],
            },
          },
        ]),
      },
      class: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'c-1',
            name: 'Grade 10',
            code: 'G10',
            sections: [
              {
                enrollments: [{}, {}],
                studentAttendances: [{ status: AttendanceStatus.PRESENT }, { status: AttendanceStatus.LATE }],
              },
            ],
          },
        ]),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
      leaveRequest: {
        create: jest.fn().mockResolvedValue({ id: 'leave-1', status: LeaveStatus.PENDING }),
        findMany: jest.fn().mockResolvedValue([{ id: 'leave-1', reason: 'Medical' }]),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    smsService = {
      sendSMS: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: SMSService, useValue: smsService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('1. Bulk Attendance Marking & Duplicate Prevention', () => {
    it('should upsert attendance records for all provided students', async () => {
      const result = await service.markStudentAttendance(
        {
          sectionId: 'sec-1',
          date: '2026-03-01',
          attendances: [
            { studentId: 'st-1', status: AttendanceStatus.PRESENT },
            { studentId: 'st-2', status: AttendanceStatus.ABSENT },
          ],
        },
        'teacher-user-1',
      );

      expect(result.success).toBe(true);
      expect(result.absentCount).toBe(1);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should trigger absence notification and SMS dispatch when student is ABSENT', async () => {
      await service.markStudentAttendance(
        {
          sectionId: 'sec-1',
          date: '2026-03-01',
          attendances: [{ studentId: 'st-1', status: AttendanceStatus.ABSENT }],
        },
        'teacher-user-1',
      );

      // Wait brief tick for async triggerAbsenceNotifications
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['st-1'] } },
        include: expect.any(Object),
      });
      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+1-555-0144',
          message: expect.stringContaining('Alex Johnson was marked ABSENT'),
        }),
      );
    });
  });

  describe('2. Automated Attendance Rate Calculations', () => {
    it('should compute daily stats with present, late, absent counts and percentage', async () => {
      const stats = await service.getDailyStats('2026-03-01');

      expect(stats.totalMarked).toBe(4);
      expect(stats.presentCount).toBe(2);
      expect(stats.lateCount).toBe(1);
      expect(stats.absentCount).toBe(1);
      // (2 + 1) / 4 = 75%
      expect(stats.percentage).toBe('75%');
      expect(stats.percentageValue).toBe(75);
    });

    it('should compute class-wise percentage breakdown', async () => {
      const breakdown = await service.getClassWiseBreakdown('2026-03-01');

      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].className).toBe('Grade 10');
      expect(breakdown[0].totalEnrolled).toBe(2);
      expect(breakdown[0].rateValue).toBe(100);
    });
  });

  describe('3. Roster & Leave Requests', () => {
    it('should fetch section roster with student details and current attendance status', async () => {
      const roster = await service.getSectionRosterWithAttendance('sec-1', '2026-03-01');

      expect(roster).toHaveLength(1);
      expect(roster[0].studentId).toBe('st-1');
      expect(roster[0].currentStatus).toBe(AttendanceStatus.PRESENT);
      expect(roster[0].rollNumber).toBe(1);
    });

    it('should submit leave request with PENDING status', async () => {
      const leave = await service.applyLeave('user-1', {
        startDate: '2026-03-10',
        endDate: '2026-03-12',
        reason: 'Medical checkup',
      });

      expect(leave.status).toBe(LeaveStatus.PENDING);
      expect(prisma.leaveRequest.create).toHaveBeenCalled();
    });
  });
});
