import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../database/prisma.service';
import { GradingEngine, DEFAULT_GRADE_SCALE } from './grading.engine';
import { Roles, Permissions, CurrentUser } from '../../common/decorators';
import { UserRoleType, ExamWorkflowStatus, AuditAction } from '@prisma/client';

export class CreateExamDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  academicYearId!: string;

  @ApiProperty({ example: 'Final Term Examination 2026' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Final Term' })
  @IsString()
  @IsNotEmpty()
  termName!: string;

  @ApiProperty({ example: '2026-11-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-11-15' })
  @IsDateString()
  endDate!: string;
}

export class CreateExamSubjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  examId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty({ example: '2026-11-02' })
  @IsDateString()
  examDate!: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ example: '13:00' })
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @ApiPropertyOptional({ example: 100.0 })
  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @ApiPropertyOptional({ example: 40.0 })
  @IsOptional()
  @IsNumber()
  passMarks?: number;
}

export class SubmitStudentMarkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  theoryScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  practicalScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  vivaScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  continuousAssessmentScore?: number;

  @ApiProperty({ example: 85.0 })
  @IsNumber()
  totalScore!: number;

  @ApiPropertyOptional({ example: 'A+' })
  @IsOptional()
  @IsString()
  gradeLetter?: string;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  @IsNumber()
  gradePoint?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAbsent?: boolean;
}

export class SubmitMarksDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  examSubjectId!: string;

  @ApiProperty({ type: [SubmitStudentMarkDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitStudentMarkDto)
  marks!: SubmitStudentMarkDto[];
}

export class UpdateExamStatusDto {
  @ApiProperty({ enum: ExamWorkflowStatus })
  @IsEnum(ExamWorkflowStatus)
  status!: ExamWorkflowStatus;
}

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Exam CRUD & Workflow
  async createExam(dto: CreateExamDto, actorId?: string) {
    const exam = await this.prisma.exam.create({
      data: {
        academicYearId: dto.academicYearId,
        title: dto.title,
        termName: dto.termName,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: ExamWorkflowStatus.DRAFT,
        isPublished: false,
      },
    });

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CREATE,
          entityName: 'Exam',
          entityId: exam.id,
          afterState: exam,
        },
      });
    }

    return exam;
  }

  async getExams() {
    return this.prisma.exam.findMany({
      include: {
        academicYear: true,
        examSubjects: { include: { subject: true, class: true } },
        results: { select: { id: true, studentId: true, gpa: true, gradeLetter: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getExamById(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        academicYear: true,
        examSubjects: {
          include: {
            subject: true,
            class: { include: { sections: true } },
            marks: true,
          },
        },
        examRoutines: { include: { section: true } },
        meritPositions: {
          include: {
            student: { include: { enrollments: { include: { section: { include: { class: true } } } } } },
          },
          orderBy: { classRank: 'asc' },
        },
      },
    });

    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async updateStatus(examId: string, status: ExamWorkflowStatus, actorId?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { status },
    });

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: AuditAction.UPDATE,
          entityName: 'Exam',
          entityId: examId,
          beforeState: { status: exam.status },
          afterState: { status },
        },
      });
    }

    return updated;
  }

  // 2. Exam Subjects & Scheduling
  async createExamSubject(dto: CreateExamSubjectDto) {
    return this.prisma.examSubject.create({
      data: {
        examId: dto.examId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        examDate: new Date(dto.examDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        totalMarks: dto.totalMarks ?? 100.0,
        passMarks: dto.passMarks ?? 33.0,
      },
    });
  }

  // 3. Marks Entry & Security
  async submitMarks(dto: SubmitMarksDto, actorId?: string, userRole?: UserRoleType) {
    const examSubject = await this.prisma.examSubject.findUnique({
      where: { id: dto.examSubjectId },
      include: { exam: true },
    });

    if (!examSubject) throw new NotFoundException('Exam subject not found');

    // Security Rule: Once published, teachers cannot modify marks unless authorized
    if (examSubject.exam.isPublished && userRole === UserRoleType.TEACHER) {
      throw new ForbiddenException(
        'Examination results are already published and locked. Only administrators can alter published marks.',
      );
    }

    // Process and evaluate each mark using the GradingEngine
    const upserted = await this.prisma.$transaction(
      dto.marks.map((m) => {
        const total = m.theoryScore || m.practicalScore || m.vivaScore
          ? (m.theoryScore || 0) + (m.practicalScore || 0) + (m.vivaScore || 0) + (m.continuousAssessmentScore || 0)
          : m.totalScore;

        const gradeEvaluation = GradingEngine.calculateSubjectGrade(
          total,
          examSubject.totalMarks,
          examSubject.passMarks,
        );

        return this.prisma.mark.upsert({
          where: {
            examSubjectId_studentId: {
              examSubjectId: dto.examSubjectId,
              studentId: m.studentId,
            },
          },
          update: {
            theoryScore: m.theoryScore,
            practicalScore: m.practicalScore,
            vivaScore: m.vivaScore,
            continuousAssessmentScore: m.continuousAssessmentScore,
            totalScore: total,
            gradeLetter: gradeEvaluation.gradeLetter,
            gradePoint: gradeEvaluation.gradePoint,
            isAbsent: m.isAbsent ?? false,
            submittedBy: actorId,
          },
          create: {
            examSubjectId: dto.examSubjectId,
            studentId: m.studentId,
            theoryScore: m.theoryScore,
            practicalScore: m.practicalScore,
            vivaScore: m.vivaScore,
            continuousAssessmentScore: m.continuousAssessmentScore,
            totalScore: total,
            gradeLetter: gradeEvaluation.gradeLetter,
            gradePoint: gradeEvaluation.gradePoint,
            isAbsent: m.isAbsent ?? false,
            submittedBy: actorId,
          },
        });
      }),
    );

    // Write Audit Log
    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: AuditAction.UPDATE,
          entityName: 'Mark',
          entityId: dto.examSubjectId,
          afterState: { totalEntries: upserted.length },
        },
      });
    }

    return {
      success: true,
      message: `Successfully recorded marks for ${upserted.length} students.`,
      marks: upserted,
    };
  }

  // 4. Result Processing Engine (GPA, Grades, Merit Positions)
  async processResults(examId: string, classId: string, actorId?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    // Fetch all exam subjects for this exam & class
    const examSubjects = await this.prisma.examSubject.findMany({
      where: { examId, classId },
      include: { subject: true },
    });

    if (examSubjects.length === 0) {
      throw new BadRequestException('No exam subjects found for this class in the selected exam.');
    }

    const examSubjectIds = examSubjects.map((es) => es.id);

    // Fetch all enrolled active students in this class
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        section: { classId },
        isActive: true,
      },
      include: { student: true },
    });

    // Fetch all marks for these exam subjects
    const allMarks = await this.prisma.mark.findMany({
      where: { examSubjectId: { in: examSubjectIds } },
      include: { examSubject: true },
    });

    const studentResultsToCompile: Array<{
      studentId: string;
      gpa: number;
      obtainedMarks: number;
      totalMarks: number;
      gradeLetter: string;
      isPassed: boolean;
      subjectResults: Array<any>;
    }> = [];

    // Calculate individual student results
    for (const enr of enrollments) {
      const studentId = enr.studentId;
      const studentMarks = allMarks.filter((m) => m.studentId === studentId);

      const subjectsData = examSubjects.map((es) => {
        const m = studentMarks.find((mark) => mark.examSubjectId === es.id);
        return {
          subjectId: es.subjectId,
          totalScore: m ? m.totalScore : 0,
          totalMarks: es.totalMarks,
          passMarks: es.passMarks,
          isAbsent: m ? m.isAbsent : true,
        };
      });

      const evaluation = GradingEngine.calculateStudentResult(subjectsData, DEFAULT_GRADE_SCALE);

      studentResultsToCompile.push({
        studentId,
        gpa: evaluation.gpa,
        obtainedMarks: evaluation.obtainedMarks,
        totalMarks: evaluation.totalMarks,
        gradeLetter: evaluation.gradeLetter,
        isPassed: evaluation.isPassed,
        subjectResults: evaluation.subjectBreakdowns,
      });
    }

    // Calculate Merit Positions
    const meritRankings = GradingEngine.calculateMeritPositions(studentResultsToCompile);

    // Commit to database
    await this.prisma.$transaction(async (tx) => {
      for (const res of studentResultsToCompile) {
        const ranking = meritRankings.find((r) => r.studentId === res.studentId);

        const resultRecord = await tx.result.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: res.studentId,
            },
          },
          update: {
            totalMarks: res.totalMarks,
            obtainedMarks: res.obtainedMarks,
            gpa: res.gpa,
            gradeLetter: res.gradeLetter,
            classRank: ranking?.classRank || 1,
            remarks: res.isPassed ? 'Passed' : 'Needs Improvement',
            isPublished: false,
          },
          create: {
            examId,
            studentId: res.studentId,
            totalMarks: res.totalMarks,
            obtainedMarks: res.obtainedMarks,
            gpa: res.gpa,
            gradeLetter: res.gradeLetter,
            classRank: ranking?.classRank || 1,
            remarks: res.isPassed ? 'Passed' : 'Needs Improvement',
            isPublished: false,
          },
        });

        // Upsert Result Subjects
        for (const subRes of res.subjectResults) {
          await tx.resultSubject.upsert({
            where: {
              resultId_subjectId: {
                resultId: resultRecord.id,
                subjectId: subRes.subjectId,
              },
            },
            update: {
              totalMarks: subRes.totalMarks,
              obtainedMarks: subRes.obtainedMarks,
              gradeLetter: subRes.gradeLetter,
              gradePoint: subRes.gradePoint,
              remarks: subRes.remarks,
            },
            create: {
              resultId: resultRecord.id,
              subjectId: subRes.subjectId,
              totalMarks: subRes.totalMarks,
              obtainedMarks: subRes.obtainedMarks,
              gradeLetter: subRes.gradeLetter,
              gradePoint: subRes.gradePoint,
              remarks: subRes.remarks,
            },
          });
        }

        // Upsert Merit Position
        if (ranking) {
          await tx.meritPosition.upsert({
            where: {
              examId_studentId: {
                examId,
                studentId: res.studentId,
              },
            },
            update: {
              classRank: ranking.classRank,
              sectionRank: ranking.sectionRank,
              totalScore: ranking.totalScore,
              gpa: ranking.gpa,
            },
            create: {
              examId,
              studentId: res.studentId,
              classRank: ranking.classRank,
              sectionRank: ranking.sectionRank,
              totalScore: ranking.totalScore,
              gpa: ranking.gpa,
            },
          });
        }
      }

      // Update Exam Status to VERIFIED
      await tx.exam.update({
        where: { id: examId },
        data: { status: ExamWorkflowStatus.VERIFIED },
      });
    });

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: AuditAction.APPROVE,
          entityName: 'Result',
          entityId: examId,
          afterState: { compiledCount: studentResultsToCompile.length, classId },
        },
      });
    }

    return {
      success: true,
      message: `Compiled and verified results for ${studentResultsToCompile.length} students.`,
      rankingsCount: meritRankings.length,
    };
  }

  // 5. Result Publishing & Unpublishing
  async publishResults(examId: string, actorId?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    await this.prisma.$transaction([
      this.prisma.exam.update({
        where: { id: examId },
        data: {
          status: ExamWorkflowStatus.PUBLISHED,
          isPublished: true,
        },
      }),
      this.prisma.result.updateMany({
        where: { examId },
        data: { isPublished: true },
      }),
    ]);

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: AuditAction.UPDATE,
          entityName: 'Exam',
          entityId: examId,
          afterState: { isPublished: true, status: ExamWorkflowStatus.PUBLISHED },
        },
      });
    }

    return { success: true, message: 'Examination results published successfully.' };
  }

  async unpublishResults(examId: string, actorId?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    await this.prisma.$transaction([
      this.prisma.exam.update({
        where: { id: examId },
        data: {
          status: ExamWorkflowStatus.APPROVED,
          isPublished: false,
        },
      }),
      this.prisma.result.updateMany({
        where: { examId },
        data: { isPublished: false },
      }),
    ]);

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: AuditAction.UPDATE,
          entityName: 'Exam',
          entityId: examId,
          afterState: { isPublished: false, status: ExamWorkflowStatus.APPROVED },
        },
      });
    }

    return { success: true, message: 'Examination results unpublished and opened for revision.' };
  }

  // 6. Tabulation Sheet & Marksheet Lookups
  async getTabulationSheet(examId: string, classId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        academicYear: true,
        examSubjects: {
          where: { classId },
          include: { subject: true },
          orderBy: { subject: { code: 'asc' } },
        },
      },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    const results = await this.prisma.result.findMany({
      where: {
        examId,
        student: { enrollments: { some: { section: { classId }, isActive: true } } },
      },
      include: {
        student: {
          include: {
            enrollments: { where: { isActive: true }, include: { section: true } },
          },
        },
        subjectResults: { include: { subject: true } },
      },
      orderBy: { classRank: 'asc' },
    });

    return {
      exam,
      subjects: exam.examSubjects,
      results,
    };
  }

  async getStudentMarksheet(examId: string, studentId: string) {
    const result = await this.prisma.result.findUnique({
      where: {
        examId_studentId: { examId, studentId },
      },
      include: {
        exam: { include: { academicYear: true } },
        student: {
          include: {
            enrollments: {
              where: { isActive: true },
              include: { section: { include: { class: true } } },
            },
          },
        },
        subjectResults: {
          include: { subject: true },
          orderBy: { subject: { code: 'asc' } },
        },
      },
    });

    if (!result) throw new NotFoundException('Student result not compiled or not found');

    const merit = await this.prisma.meritPosition.findUnique({
      where: { examId_studentId: { examId, studentId } },
    });

    return {
      ...result,
      meritPosition: merit,
    };
  }

  async getMeritList(examId: string, classId?: string) {
    const where: any = { examId };
    if (classId) {
      where.student = { enrollments: { some: { section: { classId }, isActive: true } } };
    }

    return this.prisma.meritPosition.findMany({
      where,
      include: {
        student: {
          include: {
            enrollments: { where: { isActive: true }, include: { section: { include: { class: true } } } },
          },
        },
      },
      orderBy: { classRank: 'asc' },
      take: 50,
    });
  }

  // 7. Admit Card Generation
  async generateAdmitCards(examId: string, classId: string) {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { section: { classId }, isActive: true },
    });

    const admitCards = await this.prisma.$transaction(
      enrollments.map((enr) => {
        const admitCardNumber = `AC-${new Date().getFullYear()}-${enr.studentId.substring(0, 8).toUpperCase()}`;
        return this.prisma.examAdmitCard.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: enr.studentId,
            },
          },
          update: { isIssued: true, issuedAt: new Date() },
          create: {
            examId,
            studentId: enr.studentId,
            admitCardNumber,
            isIssued: true,
            issuedAt: new Date(),
          },
        });
      }),
    );

    return { success: true, count: admitCards.length };
  }
}

@ApiTags('Examinations & Result Processing')
@ApiBearerAuth()
@Controller('examinations')
export class ExaminationsController {
  constructor(private readonly examsService: ExaminationsService) {}

  @Post()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('results.create')
  @ApiOperation({ summary: 'Create new examination event' })
  async createExam(@Body() dto: CreateExamDto, @CurrentUser('id') userId: string) {
    return this.examsService.createExam(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all examinations with subjects and result counts' })
  async getExams() {
    return this.examsService.getExams();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed examination record' })
  async getExamById(@Param('id') id: string) {
    return this.examsService.getExamById(id);
  }

  @Patch(':id/status')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('results.update')
  @ApiOperation({ summary: 'Transition exam workflow lifecycle' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExamStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.examsService.updateStatus(id, dto.status, userId);
  }

  @Post('subjects')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('results.create')
  @ApiOperation({ summary: 'Assign subject to exam with total & pass marks' })
  async createExamSubject(@Body() dto: CreateExamSubjectDto) {
    return this.examsService.createExamSubject(dto);
  }

  @Post('submit-marks')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN, UserRoleType.TEACHER)
  @Permissions('results.create', 'results.update')
  @ApiOperation({ summary: 'Submit & grade student marks' })
  async submitMarks(
    @Body() dto: SubmitMarksDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRoleType,
  ) {
    return this.examsService.submitMarks(dto, userId, role);
  }

  @Post(':id/process-results')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('results.update')
  @ApiOperation({ summary: 'Execute result computation engine: calculate GPA, letter grades, and merit ranks' })
  async processResults(
    @Param('id') examId: string,
    @Query('classId') classId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.examsService.processResults(examId, classId, userId);
  }

  @Post(':id/publish')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('results.publish')
  @ApiOperation({ summary: 'Publish exam results to student and parent portals' })
  async publishResults(@Param('id') examId: string, @CurrentUser('id') userId: string) {
    return this.examsService.publishResults(examId, userId);
  }

  @Post(':id/unpublish')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('results.publish')
  @ApiOperation({ summary: 'Unpublish results to permit administrative revisions' })
  async unpublishResults(@Param('id') examId: string, @CurrentUser('id') userId: string) {
    return this.examsService.unpublishResults(examId, userId);
  }

  @Get(':id/tabulation-sheet')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN, UserRoleType.TEACHER)
  @Permissions('results.read')
  @ApiOperation({ summary: 'Get class-wide tabulation matrix sheet' })
  async getTabulationSheet(@Param('id') examId: string, @Query('classId') classId: string) {
    return this.examsService.getTabulationSheet(examId, classId);
  }

  @Get(':id/marksheet/:studentId')
  @Permissions('results.read')
  @ApiOperation({ summary: 'Get official individual student marksheet' })
  async getStudentMarksheet(@Param('id') examId: string, @Param('studentId') studentId: string) {
    return this.examsService.getStudentMarksheet(examId, studentId);
  }

  @Get(':id/merit-list')
  @Permissions('results.read')
  @ApiOperation({ summary: 'Get ranked merit list' })
  async getMeritList(@Param('id') examId: string, @Query('classId') classId?: string) {
    return this.examsService.getMeritList(examId, classId);
  }

  @Post(':id/admit-cards')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('results.create')
  @ApiOperation({ summary: 'Generate admit cards for exam candidates' })
  async generateAdmitCards(@Param('id') examId: string, @Query('classId') classId: string) {
    return this.examsService.generateAdmitCards(examId, classId);
  }
}

@Module({
  controllers: [ExaminationsController],
  providers: [ExaminationsService],
  exports: [ExaminationsService],
})
export class ExaminationsModule {}
