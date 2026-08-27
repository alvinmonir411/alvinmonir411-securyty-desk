import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateAcademicYearDto,
  CreateClassRoomDto,
  UpdateClassRoomDto,
  CreateSectionDto,
  UpdateSectionDto,
  CreateSubjectDto,
  UpdateSubjectDto,
} from './dto/academics.dto';
import { UserRoleType, AttendanceStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  // Dashboard Aggregated Metrics
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalTeachers,
      totalStaff,
      todayAttendances,
      paidInvoices,
      unpaidInvoices,
      expenses,
      accounts,
    ] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.teacher.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: {
          role: { in: [UserRoleType.ADMIN, UserRoleType.ACCOUNTANT, UserRoleType.STAFF] },
          deletedAt: null,
        },
      }),
      this.prisma.studentAttendance.findMany({
        where: { date: today },
      }),
      this.prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { deletedAt: null },
      }),
      this.prisma.invoice.aggregate({
        _sum: { totalAmount: true, paidAmount: true },
        where: { status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] }, deletedAt: null },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.account.aggregate({
        _sum: { balance: true },
        where: { isActive: true },
      }),
    ]);

    // Calculate today's attendance percentage
    const presentCount = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE,
    ).length;
    const todayAttendancePct =
      todayAttendances.length > 0
        ? parseFloat(((presentCount / todayAttendances.length) * 100).toFixed(1))
        : 0.0;

    const monthlyCollection = paidInvoices._sum.paidAmount || 0.0;
    const totalDuesRaw = (unpaidInvoices._sum.totalAmount || 0) - (unpaidInvoices._sum.paidAmount || 0);
    const outstandingFees = totalDuesRaw > 0 ? totalDuesRaw : 0.0;
    const monthlyExpenses = expenses._sum.amount || 0.0;
    const currentBalance = accounts._sum.balance || 0.0;

    return {
      totalStudents,
      totalTeachers,
      totalStaff,
      todayAttendance: todayAttendances.length > 0 ? `${todayAttendancePct}%` : 'N/A',
      todayAttendancePct,
      monthlyCollection,
      outstandingFees,
      monthlyExpenses,
      currentBalance,
    };
  }

  // Academic Years
  async createYear(dto: CreateAcademicYearDto) {
    if (dto.isCurrent) {
      await this.prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return this.prisma.academicYear.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isCurrent: dto.isCurrent ?? false,
      },
    });
  }

  async getYears() {
    return this.prisma.academicYear.findMany({
      include: { calendars: true },
      orderBy: { startDate: 'desc' },
    });
  }

  // Classes & Sections
  async createClass(dto: CreateClassRoomDto) {
    return this.prisma.class.create({
      data: {
        name: dto.name,
        code: dto.code,
        numericOrder: dto.numericOrder ?? 1,
        description: dto.description,
      },
    });
  }

  async getClasses() {
    return this.prisma.class.findMany({
      include: {
        sections: true,
        classSubjects: { include: { subject: true } },
      },
      orderBy: { numericOrder: 'asc' },
    });
  }

  async updateClass(id: string, dto: UpdateClassRoomDto) {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException('Class not found');

    return this.prisma.class.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        numericOrder: dto.numericOrder,
        description: dto.description,
      },
    });
  }

  async deleteClass(id: string) {
    const cls = await this.prisma.class.findUnique({ where: { id } });
    if (!cls) throw new NotFoundException('Class not found');

    // Check if there are active student enrollments
    const activeEnrollments = await this.prisma.studentEnrollment.count({
      where: { section: { classId: id }, isActive: true },
    });
    if (activeEnrollments > 0) {
      throw new BadRequestException(
        `এই শ্রেণীতে ${activeEnrollments} জন সক্রিয় শিক্ষার্থী ভর্তি রয়েছে। শ্রেণী মোছার আগে শিক্ষার্থীদের অন্য শ্রেণীতে স্থানান্তর করুন।`,
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        // Clean up admission applications & related docs/payments
        const apps = await tx.admissionApplication.findMany({
          where: { classId: id },
          select: { id: true },
        });
        const appIds = apps.map((a) => a.id);
        if (appIds.length > 0) {
          await tx.admissionDocument.deleteMany({
            where: { applicationId: { in: appIds } },
          });
          await tx.admissionPayment.deleteMany({
            where: { applicationId: { in: appIds } },
          });
          await tx.admissionApplication.deleteMany({
            where: { classId: id },
          });
        }

        // Clean up class schedules, syllabus, booklists, routines, exam routines
        await tx.classSubject.deleteMany({ where: { classId: id } });
        await tx.syllabus.deleteMany({ where: { classId: id } });
        await tx.booklist.deleteMany({ where: { classId: id } });
        await tx.classRoutine.deleteMany({ where: { classId: id } });
        await tx.feeStructure.deleteMany({ where: { classId: id } });
        await tx.examSubject.deleteMany({ where: { classId: id } });

        // Clean up sections
        const sections = await tx.section.findMany({
          where: { classId: id },
          select: { id: true },
        });
        const sectionIds = sections.map((s) => s.id);
        if (sectionIds.length > 0) {
          await tx.studentEnrollment.deleteMany({
            where: { sectionId: { in: sectionIds } },
          });
          await tx.studentAttendance.deleteMany({
            where: { sectionId: { in: sectionIds } },
          });
          await tx.teacherSubject.deleteMany({
            where: { sectionId: { in: sectionIds } },
          });
          await tx.examRoutine.deleteMany({
            where: { sectionId: { in: sectionIds } },
          });
          await tx.section.deleteMany({ where: { classId: id } });
        }

        return tx.class.delete({ where: { id } });
      },
      { timeout: 25000, maxWait: 10000 },
    );
  }

  async createSection(dto: CreateSectionDto) {
    return this.prisma.section.create({
      data: {
        classId: dto.classId,
        name: dto.name,
        capacity: dto.capacity ?? 40,
      },
    });
  }

  async updateSection(id: string, dto: UpdateSectionDto) {
    const sec = await this.prisma.section.findUnique({ where: { id } });
    if (!sec) throw new NotFoundException('Section not found');

    return this.prisma.section.update({
      where: { id },
      data: {
        name: dto.name,
        capacity: dto.capacity,
      },
    });
  }

  async deleteSection(id: string) {
    const sec = await this.prisma.section.findUnique({ where: { id } });
    if (!sec) throw new NotFoundException('Section not found');

    const activeStudents = await this.prisma.studentEnrollment.count({
      where: { sectionId: id, isActive: true },
    });
    if (activeStudents > 0) {
      throw new BadRequestException(
        `এই সেকশনে ${activeStudents} জন শিক্ষার্থী এনরোল করা রয়েছে। দয়া করে আগে শিক্ষার্থীদের অন্য সেকশনে স্থানান্তর করুন।`,
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.studentEnrollment.deleteMany({ where: { sectionId: id } });
        await tx.studentAttendance.deleteMany({ where: { sectionId: id } });
        await tx.teacherSubject.deleteMany({ where: { sectionId: id } });
        await tx.examRoutine.deleteMany({ where: { sectionId: id } });
        await tx.classRoutine.deleteMany({ where: { sectionId: id } });

        return tx.section.delete({ where: { id } });
      },
      { timeout: 25000, maxWait: 10000 },
    );
  }

  async getAllSections() {
    return this.prisma.section.findMany({
      include: {
        class: true,
      },
      orderBy: [{ class: { numericOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async createSubject(dto: CreateSubjectDto) {
    return this.prisma.$transaction(async (tx) => {
      const subject = await tx.subject.create({
        data: {
          name: dto.name,
          code: dto.code,
          creditHours: dto.creditHours ?? 1.0,
          totalMarks: dto.totalMarks ?? 100.0,
          passMarks: dto.passMarks ?? 33.0,
        },
      });

      if (dto.classId) {
        await tx.classSubject.create({
          data: {
            classId: dto.classId,
            subjectId: subject.id,
            totalMarks: dto.totalMarks ?? 100.0,
            passMarks: dto.passMarks ?? 33.0,
          },
        });
      }

      return subject;
    });
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    const sub = await this.prisma.subject.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subject not found');

    return this.prisma.subject.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        totalMarks: dto.totalMarks,
        passMarks: dto.passMarks,
      },
    });
  }

  async deleteSubject(id: string) {
    const sub = await this.prisma.subject.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subject not found');

    return this.prisma.$transaction(
      async (tx) => {
        await tx.classSubject.deleteMany({ where: { subjectId: id } });
        await tx.teacherSubject.deleteMany({ where: { subjectId: id } });
        await tx.classRoutine.deleteMany({ where: { subjectId: id } });
        await tx.examSubject.deleteMany({ where: { subjectId: id } });

        return tx.subject.delete({ where: { id } });
      },
      { timeout: 25000, maxWait: 10000 },
    );
  }

  async getAllSubjects() {
    return this.prisma.subject.findMany({
      include: {
        classSubjects: { include: { class: true } },
      },
      orderBy: { code: 'asc' },
    });
  }
}
