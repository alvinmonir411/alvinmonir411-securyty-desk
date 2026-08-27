import { Module, Injectable, Controller, Get, Post, Patch, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRoleType, UserStatus } from '@prisma/client';

export class CreateTeacherDto {
  @ApiProperty({ example: 'teacher@school.edu' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Pass@123456' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Connor' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'Senior Lecturer' })
  @IsString()
  @IsNotEmpty()
  designation!: string;

  @ApiProperty({ example: 'Science' })
  @IsString()
  @IsNotEmpty()
  department!: string;

  @ApiPropertyOptional({ example: '2022-01-15' })
  @IsOptional()
  @IsString()
  joiningDate?: string;

  @ApiPropertyOptional({ example: 'EMP-001' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'M.Sc. in Physics' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: '+1-555-0188' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 4500.0 })
  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateTeacherDto {
  @ApiPropertyOptional({ example: 'Sarah' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Connor' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Head of Physics Department' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'Science' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Ph.D. in Applied Physics' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: '+1-555-0188' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class AssignSubjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  teacherId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sectionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId!: string;
}

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeacherDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const employeeId =
      dto.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const joiningDate = dto.joiningDate ? new Date(dto.joiningDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash: hashedPassword,
          role: UserRoleType.TEACHER,
          status: UserStatus.ACTIVE,
          avatarUrl: dto.avatarUrl,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          designation: dto.designation,
          department: dto.department,
          qualification: dto.qualification,
          phone: dto.phone,
          joiningDate,
        },
      });

      if (dto.baseSalary) {
        await tx.salaryStructure.create({
          data: {
            teacherId: teacher.id,
            baseSalary: dto.baseSalary,
          },
        });
      }

      return { user: { id: user.id, email: user.email }, teacher };
    });
  }

  async findAll() {
    return this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { email: true, status: true, avatarUrl: true } },
        salaryStructure: true,
        teacherSubjects: {
          include: {
            subject: true,
            section: { include: { class: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, status: true, avatarUrl: true, lastLoginAt: true } },
        salaryStructure: { include: { components: true } },
        teacherSubjects: {
          include: {
            subject: true,
            section: { include: { class: true } },
          },
        },
        routines: {
          include: {
            subject: true,
            section: { include: { class: true } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        payrollItems: {
          include: {
            payroll: true,
            payslip: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.avatarUrl !== undefined) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: { avatarUrl: dto.avatarUrl },
        });
      }

      return tx.teacher.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          designation: dto.designation,
          department: dto.department,
          qualification: dto.qualification,
          phone: dto.phone,
        },
      });
    });
  }

  async delete(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.prisma.$transaction([
      this.prisma.teacher.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: teacher.userId },
        data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
      }),
    ]);

    return { success: true, message: 'Teacher archived successfully' };
  }

  async getStaffMembers() {
    return this.prisma.user.findMany({
      where: {
        role: { in: [UserRoleType.ADMIN, UserRoleType.ACCOUNTANT, UserRoleType.STAFF] },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        phoneNumber: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMySchedule(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.prisma.classRoutine.findMany({
      where: { teacherId: teacher.id },
      include: {
        section: { include: { class: true } },
        subject: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async assignSubject(dto: AssignSubjectDto) {
    return this.prisma.teacherSubject.upsert({
      where: {
        teacherId_sectionId_subjectId_academicYearId: {
          teacherId: dto.teacherId,
          sectionId: dto.sectionId,
          subjectId: dto.subjectId,
          academicYearId: dto.academicYearId,
        },
      },
      update: {},
      create: {
        teacherId: dto.teacherId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
      },
    });
  }
}

@ApiTags('Faculty & Staff')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Create new teacher profile with salary details' })
  async create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of active teachers with assigned classes' })
  async findAll() {
    return this.teachersService.findAll();
  }

  @Get('staff/all')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Get list of administrative and support staff members' })
  async getStaffMembers() {
    return this.teachersService.getStaffMembers();
  }

  @Get('my-schedule')
  @Roles(UserRoleType.TEACHER)
  @ApiOperation({ summary: 'Get teaching schedule for current teacher' })
  async getMySchedule(@CurrentUser('id') userId: string) {
    return this.teachersService.getMySchedule(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed Teacher profile with salary, timetable, and subjects' })
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Update teacher designation, qualification, or department' })
  async update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Archive/delete teacher account' })
  async delete(@Param('id') id: string) {
    return this.teachersService.delete(id);
  }

  @Post('assign-subject')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Assign teacher to section and subject' })
  async assignSubject(@Body() dto: AssignSubjectDto) {
    return this.teachersService.assignSubject(dto);
  }
}

@Module({
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
