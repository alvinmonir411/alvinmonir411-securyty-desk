import { Test, TestingModule } from '@nestjs/testing';
import { ExaminationsService } from './examinations.module';
import { PrismaService } from '../../database/prisma.service';
import { GradingEngine, DEFAULT_GRADE_SCALE } from './grading.engine';
import { ForbiddenException } from '@nestjs/common';
import { ExamWorkflowStatus, UserRoleType, AuditAction } from '@prisma/client';

describe('Examinations & Result Processing Engine (Mathematical & Unit Tests)', () => {
  let service: ExaminationsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      exam: {
        create: jest.fn().mockResolvedValue({ id: 'exam-1', status: ExamWorkflowStatus.DRAFT, isPublished: false }),
        findUnique: jest.fn().mockResolvedValue({ id: 'exam-1', status: ExamWorkflowStatus.DRAFT, isPublished: false }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'exam-1', ...data })),
      },
      examSubject: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'es-1',
          totalMarks: 100.0,
          passMarks: 40.0,
          exam: { isPublished: false },
        }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'es-math', subjectId: 'sub-math', totalMarks: 100, passMarks: 40 },
          { id: 'es-sci', subjectId: 'sub-sci', totalMarks: 100, passMarks: 40 },
          { id: 'es-eng', subjectId: 'sub-eng', totalMarks: 100, passMarks: 40 },
        ]),
      },
      studentEnrollment: {
        findMany: jest.fn().mockResolvedValue([
          { studentId: 'st-top' },
          { studentId: 'st-runner' },
          { studentId: 'st-failed' },
        ]),
      },
      mark: {
        upsert: jest.fn().mockImplementation(({ create, update }) => Promise.resolve({ id: 'mark-1', ...create, ...update })),
        findMany: jest.fn().mockResolvedValue([
          // Student 1 (Top student: 90, 85, 95 -> GPA 5.0)
          { studentId: 'st-top', examSubjectId: 'es-math', totalScore: 90, isAbsent: false },
          { studentId: 'st-top', examSubjectId: 'es-sci', totalScore: 85, isAbsent: false },
          { studentId: 'st-top', examSubjectId: 'es-eng', totalScore: 95, isAbsent: false },

          // Student 2 (Runner up: 75, 70, 72 -> GPA 4.0)
          { studentId: 'st-runner', examSubjectId: 'es-math', totalScore: 75, isAbsent: false },
          { studentId: 'st-runner', examSubjectId: 'es-sci', totalScore: 70, isAbsent: false },
          { studentId: 'st-runner', examSubjectId: 'es-eng', totalScore: 72, isAbsent: false },

          // Student 3 (Failed student: 80, 25 (failed science < 40), 90 -> GPA 0.0)
          { studentId: 'st-failed', examSubjectId: 'es-math', totalScore: 80, isAbsent: false },
          { studentId: 'st-failed', examSubjectId: 'es-sci', totalScore: 25, isAbsent: false },
          { studentId: 'st-failed', examSubjectId: 'es-eng', totalScore: 90, isAbsent: false },
        ]),
      },
      result: {
        upsert: jest.fn().mockResolvedValue({ id: 'res-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
        findUnique: jest.fn().mockResolvedValue({ id: 'res-1', gpa: 5.0, gradeLetter: 'A+' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      resultSubject: {
        upsert: jest.fn().mockResolvedValue({ id: 'rs-1' }),
      },
      meritPosition: {
        upsert: jest.fn().mockResolvedValue({ id: 'merit-1' }),
        findUnique: jest.fn().mockResolvedValue({ classRank: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn().mockImplementation((arg) => {
        if (typeof arg === 'function') {
          return arg(prisma);
        }
        return Promise.all(arg);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExaminationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ExaminationsService>(ExaminationsService);
  });

  describe('1. Mathematical Grading Engine Accuracy', () => {
    it('should accurately calculate subject grades against scale thresholds', () => {
      // 95/100 -> A+ (5.00)
      const resAplus = GradingEngine.calculateSubjectGrade(95, 100, 40);
      expect(resAplus.gradeLetter).toBe('A+');
      expect(resAplus.gradePoint).toBe(5.0);
      expect(resAplus.isPassed).toBe(true);

      // 74/100 -> A (4.00)
      const resA = GradingEngine.calculateSubjectGrade(74, 100, 40);
      expect(resA.gradeLetter).toBe('A');
      expect(resA.gradePoint).toBe(4.0);

      // 62/100 -> A- (3.50)
      const resAminus = GradingEngine.calculateSubjectGrade(62, 100, 40);
      expect(resAminus.gradeLetter).toBe('A-');
      expect(resAminus.gradePoint).toBe(3.5);

      // 52/100 -> B (3.00)
      const resB = GradingEngine.calculateSubjectGrade(52, 100, 40);
      expect(resB.gradeLetter).toBe('B');
      expect(resB.gradePoint).toBe(3.0);

      // 42/100 -> C (2.00)
      const resC = GradingEngine.calculateSubjectGrade(42, 100, 40);
      expect(resC.gradeLetter).toBe('C');
      expect(resC.gradePoint).toBe(2.0);

      // 35/100 (below pass threshold 40) -> F (0.00)
      const resFail = GradingEngine.calculateSubjectGrade(35, 100, 40);
      expect(resFail.gradeLetter).toBe('F');
      expect(resFail.gradePoint).toBe(0.0);
      expect(resFail.isPassed).toBe(false);
    });

    it('should calculate student GPA and drop to 0.00 if any subject fails', () => {
      // Top student with 3 passed subjects (90 A+, 85 A+, 95 A+)
      const topStudent = GradingEngine.calculateStudentResult([
        { subjectId: 'math', totalScore: 90, totalMarks: 100, passMarks: 40 },
        { subjectId: 'sci', totalScore: 85, totalMarks: 100, passMarks: 40 },
        { subjectId: 'eng', totalScore: 95, totalMarks: 100, passMarks: 40 },
      ]);
      expect(topStudent.isPassed).toBe(true);
      expect(topStudent.gpa).toBe(5.0);
      expect(topStudent.gradeLetter).toBe('A+');
      expect(topStudent.totalMarks).toBe(300);
      expect(topStudent.obtainedMarks).toBe(270);

      // Student failing 1 subject (80 A+, 25 F, 90 A+)
      const failedStudent = GradingEngine.calculateStudentResult([
        { subjectId: 'math', totalScore: 80, totalMarks: 100, passMarks: 40 },
        { subjectId: 'sci', totalScore: 25, totalMarks: 100, passMarks: 40 }, // FAILED
        { subjectId: 'eng', totalScore: 90, totalMarks: 100, passMarks: 40 },
      ]);
      expect(failedStudent.isPassed).toBe(false);
      expect(failedStudent.gpa).toBe(0.0);
      expect(failedStudent.gradeLetter).toBe('F');
    });

    it('should correctly sort Merit Positions by GPA and use Total Marks as tie-breaker', () => {
      const candidates = [
        { studentId: 'st-b', gpa: 4.5, obtainedMarks: 260 },
        { studentId: 'st-top', gpa: 5.0, obtainedMarks: 290 },
        { studentId: 'st-a', gpa: 5.0, obtainedMarks: 295 }, // Tie on GPA 5.0 with higher marks
        { studentId: 'st-fail', gpa: 0.0, obtainedMarks: 120 },
      ];

      const ranked = GradingEngine.calculateMeritPositions(candidates);

      expect(ranked[0].studentId).toBe('st-a');
      expect(ranked[0].classRank).toBe(1);

      expect(ranked[1].studentId).toBe('st-top');
      expect(ranked[1].classRank).toBe(2);

      expect(ranked[2].studentId).toBe('st-b');
      expect(ranked[2].classRank).toBe(3);

      expect(ranked[3].studentId).toBe('st-fail');
      expect(ranked[3].classRank).toBe(4);
    });
  });

  describe('2. End-to-End Result Processing Engine', () => {
    it('should process multi-student class results, compile GPA, and assign merit positions', async () => {
      const result = await service.processResults('exam-1', 'class-10', 'admin-user');

      expect(result.success).toBe(true);
      expect(result.rankingsCount).toBe(3);
      expect(prisma.result.upsert).toHaveBeenCalledTimes(3);
      expect(prisma.meritPosition.upsert).toHaveBeenCalledTimes(3);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditAction.APPROVE,
          entityName: 'Result',
        }),
      });
    });
  });

  describe('3. Exam Lifecycle & Security Locking', () => {
    it('should allow teacher to submit marks when exam is NOT published', async () => {
      const res = await service.submitMarks(
        {
          examSubjectId: 'es-1',
          marks: [{ studentId: 'st-1', totalScore: 88 }],
        },
        'teacher-1',
        UserRoleType.TEACHER,
      );

      expect(res.success).toBe(true);
      expect(prisma.mark.upsert).toHaveBeenCalled();
    });

    it('should prevent teacher from modifying marks when exam is PUBLISHED', async () => {
      prisma.examSubject.findUnique.mockResolvedValueOnce({
        id: 'es-1',
        totalMarks: 100,
        passMarks: 40,
        exam: { isPublished: true },
      });

      await expect(
        service.submitMarks(
          {
            examSubjectId: 'es-1',
            marks: [{ studentId: 'st-1', totalScore: 90 }],
          },
          'teacher-1',
          UserRoleType.TEACHER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should publish results and log audit trail', async () => {
      const res = await service.publishResults('exam-1', 'admin-user');

      expect(res.success).toBe(true);
      expect(prisma.exam.update).toHaveBeenCalledWith({
        where: { id: 'exam-1' },
        data: expect.objectContaining({ isPublished: true, status: ExamWorkflowStatus.PUBLISHED }),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should unpublish results and log audit trail', async () => {
      const res = await service.unpublishResults('exam-1', 'admin-user');

      expect(res.success).toBe(true);
      expect(prisma.exam.update).toHaveBeenCalledWith({
        where: { id: 'exam-1' },
        data: expect.objectContaining({ isPublished: false, status: ExamWorkflowStatus.APPROVED }),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
