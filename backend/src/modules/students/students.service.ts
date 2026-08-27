import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudentDto, UpdateStudentDto, EnrollStudentDto, StudentFilterQueryDto } from './dto/students.dto';
import { UserRoleType, UserStatus, AttendanceStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists in system');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admissionNumber =
      dto.admissionNumber || `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash: hashedPassword,
          role: UserRoleType.STUDENT,
          status: UserStatus.ACTIVE,
          avatarUrl: dto.avatarUrl,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          admissionNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          bloodGroup: dto.bloodGroup,
          emergencyContact: dto.emergencyContact,
          presentAddress: dto.presentAddress,
          permanentAddress: dto.permanentAddress,
        },
      });

      // Auto-enroll if sectionId is provided
      if (dto.sectionId) {
        let activeYear = await tx.academicYear.findFirst({ where: { isCurrent: true } });
        if (!activeYear) {
          activeYear = await tx.academicYear.findFirst({ orderBy: { startDate: 'desc' } });
        }
        if (!activeYear) {
          activeYear = await tx.academicYear.create({
            data: {
              name: '2026-2027',
              startDate: new Date('2026-01-01'),
              endDate: new Date('2026-12-31'),
              isCurrent: true,
            },
          });
        }
        await tx.studentEnrollment.create({
          data: {
            studentId: student.id,
            academicYearId: activeYear.id,
            sectionId: dto.sectionId,
            rollNumber: dto.rollNumber || 1,
            isActive: true,
          },
        });
      }

      return {
        user: { id: user.id, email: user.email },
        student,
      };
    });
  }

  async findAll(query: StudentFilterQueryDto) {
    const { page = 1, limit = 10, search, classId, sectionId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (sectionId) {
      where.enrollments = {
        some: {
          sectionId,
          isActive: true,
        },
      };
    } else if (classId) {
      where.enrollments = {
        some: {
          section: { classId },
          isActive: true,
        },
      };
    }

    const [totalItems, data] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          enrollments: {
            where: { isActive: true },
            include: { section: { include: { class: true } } },
          },
          user: { select: { email: true, status: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    return this.getStudent360(id);
  }

  async getStudent360(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, status: true, avatarUrl: true, lastLoginAt: true } },
        enrollments: {
          include: {
            academicYear: true,
            section: { include: { class: true } },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        parents: {
          include: {
            parent: { include: { user: { select: { email: true } } } },
            guardian: true,
          },
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        invoices: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        marks: {
          include: {
            examSubject: {
              include: {
                subject: true,
                exam: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        results: {
          include: {
            exam: true,
            subjectResults: { include: { subject: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: true,
        idCards: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    // Compute attendance metrics
    const allAttendances = student.attendances;
    const totalDays = allAttendances.length;
    const presentDays = allAttendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const lateDays = allAttendances.filter((a) => a.status === AttendanceStatus.LATE).length;
    const absentDays = allAttendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;
    const attendancePercentage = totalDays > 0 ? parseFloat((((presentDays + lateDays) / totalDays) * 100).toFixed(1)) : 100;

    // Compute finance metrics
    const totalInvoiced = student.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = student.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const outstandingDue = Math.max(0, totalInvoiced - totalPaid);

    return {
      ...student,
      metrics: {
        attendancePercentage,
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        totalInvoiced,
        totalPaid,
        outstandingDue,
      },
    };
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        emergencyContact: dto.emergencyContact,
        presentAddress: dto.presentAddress,
        status: dto.status,
      },
    });
  }

  async delete(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.$transaction([
      this.prisma.student.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'WITHDRAWN' },
      }),
      this.prisma.user.update({
        where: { id: student.userId },
        data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
      }),
    ]);

    return { success: true, message: 'Student archived successfully' };
  }

  async enroll(studentId: string, dto: EnrollStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.studentEnrollment.updateMany({
      where: { studentId, academicYearId: dto.academicYearId },
      data: { isActive: false },
    });

    return this.prisma.studentEnrollment.create({
      data: {
        studentId,
        academicYearId: dto.academicYearId,
        sectionId: dto.sectionId,
        rollNumber: dto.rollNumber,
        isActive: true,
      },
    });
  }
}
