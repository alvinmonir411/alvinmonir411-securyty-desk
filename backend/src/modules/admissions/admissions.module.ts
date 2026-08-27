import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { Public, Roles, Permissions, CurrentUser } from '../../common/decorators';
import { UserRoleType, ApplicationStatus, Gender, PaymentMethod, PaymentStatus, AuditAction, StudentStatus, UserStatus } from '@prisma/client';

export class SubmitAdmissionApplicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty({ example: 'Ethan' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Davis' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '2015-08-20' })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: 'Robert Davis' })
  @IsString()
  @IsNotEmpty()
  parentName!: string;

  @ApiProperty({ example: 'parent@email.com' })
  @IsEmail()
  parentEmail!: string;

  @ApiProperty({ example: '+1-555-0144' })
  @IsString()
  @IsNotEmpty()
  parentPhone!: string;

  @ApiProperty({ example: '123 Pine St, City' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousSchool?: string;

  @ApiPropertyOptional({ example: '3.92' })
  @IsOptional()
  @IsString()
  previousGPA?: string;

  @ApiPropertyOptional({ example: 'https://placehold.co/400' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ example: 'https://placehold.co/doc' })
  @IsOptional()
  @IsString()
  birthCertUrl?: string;

  @ApiPropertyOptional({ example: 'BKASH' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: '01711234567' })
  @IsOptional()
  @IsString()
  senderNumber?: string;

  @ApiPropertyOptional({ example: '9KJH765TR1' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsString()
  paymentScreenshotUrl?: string;
}

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  testDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rollNumber?: number;
}

@Injectable()
export class AdmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: SubmitAdmissionApplicationDto) {
    const applicationNumber = `ADM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const receiptNumber = `RCP-ADM-${Math.floor(10000 + Math.random() * 90000)}`;

    return this.prisma.$transaction(
      async (tx) => {
        const application = await tx.admissionApplication.create({
          data: {
            applicationNumber,
            classId: dto.classId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            dateOfBirth: new Date(dto.dateOfBirth),
            gender: dto.gender,
            parentName: dto.parentName,
            parentEmail: dto.parentEmail.toLowerCase(),
            parentPhone: dto.parentPhone,
            address: dto.address,
            previousSchool: dto.previousSchool ? `${dto.previousSchool} (GPA: ${dto.previousGPA || 'N/A'})` : null,
            status: ApplicationStatus.SUBMITTED,
          },
        });

        // Save documents if provided
        if (dto.photoUrl) {
          await tx.admissionDocument.create({
            data: {
              applicationId: application.id,
              documentType: 'PASSPORT_PHOTO',
              fileUrl: dto.photoUrl,
            },
          });
        }

        if (dto.birthCertUrl) {
          await tx.admissionDocument.create({
            data: {
              applicationId: application.id,
              documentType: 'BIRTH_CERTIFICATE',
              fileUrl: dto.birthCertUrl,
            },
          });
        }

        if (dto.paymentScreenshotUrl) {
          await tx.admissionDocument.create({
            data: {
              applicationId: application.id,
              documentType: 'PAYMENT_RECEIPT',
              fileUrl: dto.paymentScreenshotUrl,
            },
          });
        }

        // Record application processing fee (bKash / Nagad / Rocket / Cash)
        let selectedMethod: PaymentMethod = PaymentMethod.BKASH;
        const normalizedMethod = dto.paymentMethod?.toUpperCase();
        if (normalizedMethod === 'NAGAD') selectedMethod = PaymentMethod.NAGAD;
        else if (normalizedMethod === 'CASH') selectedMethod = PaymentMethod.CASH;
        else if (normalizedMethod === 'ROCKET') selectedMethod = ((PaymentMethod as any).ROCKET ?? 'ROCKET') as PaymentMethod;
        else if (normalizedMethod === 'BKASH') selectedMethod = PaymentMethod.BKASH;
        else if (normalizedMethod && normalizedMethod in PaymentMethod) {
          selectedMethod = PaymentMethod[normalizedMethod as keyof typeof PaymentMethod];
        }

        const finalTrxId = dto.transactionId
          ? dto.transactionId.trim().toUpperCase()
          : `TXN-ADM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        await tx.admissionPayment.create({
          data: {
            applicationId: application.id,
            amount: 500.0,
            paymentMethod: selectedMethod,
            paymentStatus: PaymentStatus.SUCCESSFUL,
            receiptNumber,
            transactionId: dto.senderNumber ? `${finalTrxId} (Sender: ${dto.senderNumber})` : finalTrxId,
            paidAt: new Date(),
          },
        });

        return application;
      },
      { timeout: 25000, maxWait: 10000 },
    );
  }

  async findAll() {
    return this.prisma.admissionApplication.findMany({
      include: {
        class: true,
        documents: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByApplicationNumber(applicationNumber: string) {
    const application = await this.prisma.admissionApplication.findUnique({
      where: { applicationNumber },
      include: {
        class: true,
        documents: true,
        payments: true,
      },
    });

    if (!application) throw new NotFoundException('Admission application not found');
    return application;
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto, actorId?: string) {
    const app = await this.prisma.admissionApplication.findUnique({
      where: { id },
      include: { documents: true, class: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    // Precompute hash before opening DB transaction to eliminate CPU delay
    const hashedPassword = await bcrypt.hash('Pass@123456', 10);

    return this.prisma.$transaction(
      async (tx) => {
        // If status is APPROVED, automatically enroll the applicant as an active Student
        if (dto.status === ApplicationStatus.APPROVED) {
          // Check if student with this admissionNumber already exists
          let existingStudent = await tx.student.findFirst({
            where: { admissionNumber: app.applicationNumber },
          });

          if (!existingStudent) {
            const studentEmail = `${app.applicationNumber.toLowerCase()}@nobleschool.edu.bd`;
            const existingUser = await tx.user.findUnique({ where: { email: studentEmail } });
            const finalEmail = existingUser
              ? `${app.applicationNumber.toLowerCase()}_${Date.now()}@nobleschool.edu.bd`
              : studentEmail;

            const photoDoc = app.documents.find((d) => d.documentType === 'PASSPORT_PHOTO');

            const user = await tx.user.create({
              data: {
                email: finalEmail,
                passwordHash: hashedPassword,
                role: UserRoleType.STUDENT,
                status: UserStatus.ACTIVE,
                avatarUrl: photoDoc?.fileUrl || null,
                phoneNumber: app.parentPhone,
              },
            });

            existingStudent = await tx.student.create({
              data: {
                userId: user.id,
                admissionNumber: app.applicationNumber,
                firstName: app.firstName,
                lastName: app.lastName,
                dateOfBirth: app.dateOfBirth,
                gender: app.gender,
                emergencyContact: app.parentPhone,
                presentAddress: app.address,
                permanentAddress: app.address,
                status: StudentStatus.ACTIVE,
              },
            });

            // Determine Section
            let targetSectionId = dto.sectionId;
            if (!targetSectionId) {
              const firstSection = await tx.section.findFirst({
                where: { classId: app.classId },
                orderBy: { name: 'asc' },
              });
              if (firstSection) {
                targetSectionId = firstSection.id;
              }
            }

            // Determine Academic Year
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

            // Determine Roll Number
            let assignedRoll = dto.rollNumber;
            if (!assignedRoll && targetSectionId) {
              const currentCount = await tx.studentEnrollment.count({
                where: {
                  sectionId: targetSectionId,
                  academicYearId: activeYear.id,
                },
              });
              assignedRoll = currentCount + 1;
            }

            if (targetSectionId) {
              await tx.studentEnrollment.create({
                data: {
                  studentId: existingStudent.id,
                  academicYearId: activeYear.id,
                  sectionId: targetSectionId,
                  rollNumber: assignedRoll || 1,
                  isActive: true,
                },
              });
            }
          }
        }

        const updated = await tx.admissionApplication.update({
          where: { id },
          data: {
            status: dto.status,
            notes: dto.notes,
            testDate: dto.testDate ? new Date(dto.testDate) : undefined,
          },
        });

        if (actorId) {
          await tx.auditLog.create({
            data: {
              actorId,
              action: dto.status === ApplicationStatus.APPROVED ? AuditAction.APPROVE : AuditAction.UPDATE,
              entityName: 'AdmissionApplication',
              entityId: id,
              beforeState: { status: app.status },
              afterState: { status: dto.status },
            },
          });
        }

        return updated;
      },
      { timeout: 25000, maxWait: 10000 },
    );
  }
}

@ApiTags('Admissions Portal')
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Public()
  @Post('apply')
  @ApiOperation({ summary: 'Submit multi-step online admission application' })
  async apply(@Body() dto: SubmitAdmissionApplicationDto) {
    return this.admissionsService.submit(dto);
  }

  @Public()
  @Get('track/:applicationNumber')
  @ApiOperation({ summary: 'Lookup admission application status and admit card' })
  async trackApplication(@Param('applicationNumber') applicationNumber: string) {
    return this.admissionsService.findByApplicationNumber(applicationNumber);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('students.read')
  @ApiOperation({ summary: 'List all admission applications' })
  async findAll() {
    return this.admissionsService.findAll();
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('students.update')
  @ApiOperation({ summary: 'Update application review status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.admissionsService.updateStatus(id, dto, userId);
  }
}

@Module({
  controllers: [AdmissionsController],
  providers: [AdmissionsService],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
