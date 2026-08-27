import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService, NotificationEventType } from './notifications.module';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../integrations/email/email.service';
import { SMSService } from '../../integrations/sms/sms.service';
import { NotificationChannel } from '@prisma/client';

describe('Notifications & Communication Engine (Unit Tests)', () => {
  let service: NotificationsService;
  let prisma: any;
  let emailService: any;
  let smsService: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'notif-1', ...data })),
        findMany: jest.fn().mockResolvedValue([{ id: 'notif-1', title: 'Fee Due' }]),
        update: jest.fn().mockResolvedValue({ id: 'notif-1', isRead: true }),
      },
      sMSLog: {
        create: jest.fn().mockResolvedValue({ id: 'sms-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      emailLog: {
        create: jest.fn().mockResolvedValue({ id: 'email-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };

    smsService = {
      sendSMS: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
        { provide: SMSService, useValue: smsService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('1. Templated Multi-Channel Event Dispatching', () => {
    it('should format and dispatch Student Absence notification via In-App and SMS', async () => {
      const res = await service.triggerEvent({
        event: NotificationEventType.ATTENDANCE_ABSENCE,
        userId: 'user-parent-1',
        phone: '+1-555-0144',
        data: { studentName: 'Alex Johnson', date: '2026-03-01' },
      });

      expect(res.title).toBe('Student Absence Notice');
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-parent-1',
          title: 'Student Absence Notice',
          channel: NotificationChannel.IN_APP,
        }),
      });
      expect(smsService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+1-555-0144',
          message: expect.stringContaining('Alex Johnson was marked ABSENT'),
        }),
      );
    });

    it('should format and dispatch Fee Due Reminder via In-App and Email', async () => {
      const res = await service.triggerEvent({
        event: NotificationEventType.FEE_REMINDER,
        userId: 'user-parent-1',
        email: 'parent@family.com',
        data: { invoiceNumber: 'INV-2026-03', amount: 250, dueDate: '2026-03-25' },
      });

      expect(res.title).toBe('Tuition Fee Due Reminder');
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'parent@family.com',
          subject: '[Apex Academy] Tuition Fee Due Reminder',
        }),
      );
    });

    it('should format and dispatch Result Published notification', async () => {
      const res = await service.triggerEvent({
        event: NotificationEventType.RESULT_PUBLISHED,
        userId: 'user-student-1',
        data: { examTitle: 'Mid-Term Exam 2026', gpa: '4.85' },
      });

      expect(res.title).toBe('Examination Results Published');
      expect(res.message).toContain('Cumulative GPA: 4.85');
    });
  });

  describe('2. User In-App Inbox & Read Status', () => {
    it('should fetch user in-app notification inbox', async () => {
      const list = await service.getMyInAppNotifications('user-1');
      expect(list).toHaveLength(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
    });

    it('should mark notification as read', async () => {
      const updated = await service.markAsRead('notif-1');
      expect(updated.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });
  });
});
