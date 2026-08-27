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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../database/prisma.service';
import { PDFService } from '../../integrations/pdf/pdf.service';
import { Roles, Permissions, CurrentUser } from '../../common/decorators';
import { UserRoleType, PayRunStatus, PaymentMethod, SalaryComponentType, AuditAction, BankTransactionType } from '@prisma/client';

export class SalaryComponentDto {
  @ApiProperty({ example: 'Housing Allowance' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: SalaryComponentType })
  @IsEnum(SalaryComponentType)
  componentType!: SalaryComponentType;

  @ApiProperty({ example: 350.0 })
  @IsNumber()
  amount!: number;
}

export class CreateSalaryStructureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  teacherId!: string;

  @ApiProperty({ example: 4500.0 })
  @IsNumber()
  baseSalary!: number;

  @ApiPropertyOptional({ type: [SalaryComponentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentDto)
  components?: SalaryComponentDto[];
}

export class GeneratePayRunDto {
  @ApiProperty({ example: 3, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 2026 })
  @IsInt()
  year!: number;
}

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Salary Structure Configuration
  async createSalaryStructure(dto: CreateSalaryStructureDto) {
    return this.prisma.$transaction(async (tx) => {
      const struct = await tx.salaryStructure.upsert({
        where: { teacherId: dto.teacherId },
        update: { baseSalary: dto.baseSalary },
        create: { teacherId: dto.teacherId, baseSalary: dto.baseSalary },
      });

      if (dto.components && dto.components.length > 0) {
        await tx.salaryComponent.deleteMany({ where: { salaryStructureId: struct.id } });
        await tx.salaryComponent.createMany({
          data: dto.components.map((c) => ({
            salaryStructureId: struct.id,
            name: c.name,
            componentType: c.componentType,
            amount: c.amount,
          })),
        });
      }

      return tx.salaryStructure.findUnique({
        where: { id: struct.id },
        include: { components: true, teacher: true },
      });
    });
  }

  // 2. PayRun Generation (Gross Salary - Deductions = Net Salary)
  async generatePayRun(dto: GeneratePayRunDto, actorId?: string) {
    const existing = await this.prisma.payroll.findUnique({
      where: {
        month_year: { month: dto.month, year: dto.year },
      },
    });

    if (existing && existing.status === PayRunStatus.DISBURSED) {
      throw new BadRequestException('Payroll for this period has already been disbursed.');
    }

    const activeTeachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        salaryStructure: { include: { components: true } },
      },
    });

    return this.prisma.$transaction(async (tx) => {
      let totalPayrollAmount = 0;

      // Upsert payroll master record
      const payroll = await tx.payroll.upsert({
        where: {
          month_year: { month: dto.month, year: dto.year },
        },
        update: {
          status: PayRunStatus.DRAFT,
        },
        create: {
          month: dto.month,
          year: dto.year,
          status: PayRunStatus.DRAFT,
        },
      });

      // Clear existing draft items if re-generating
      await tx.payrollItem.deleteMany({ where: { payrollId: payroll.id } });

      for (const teacher of activeTeachers) {
        const baseSalary = teacher.salaryStructure?.baseSalary || 4500.0;
        let totalAllowance = 0;
        let totalDeduction = 0;

        if (teacher.salaryStructure?.components) {
          teacher.salaryStructure.components.forEach((c) => {
            if (c.componentType === SalaryComponentType.ALLOWANCE) {
              totalAllowance += c.amount;
            } else if (c.componentType === SalaryComponentType.DEDUCTION) {
              totalDeduction += c.amount;
            }
          });
        } else {
          // Standard defaults: 10% medical/housing, 5% tax
          totalAllowance = parseFloat((baseSalary * 0.1).toFixed(2));
          totalDeduction = parseFloat((baseSalary * 0.05).toFixed(2));
        }

        const netSalary = parseFloat((baseSalary + totalAllowance - totalDeduction).toFixed(2));
        totalPayrollAmount += netSalary;

        const item = await tx.payrollItem.create({
          data: {
            payrollId: payroll.id,
            teacherId: teacher.id,
            baseSalary,
            totalAllowance,
            totalDeduction,
            netSalary,
            isDisbursed: false,
          },
        });

        await tx.payslip.create({
          data: {
            payrollItemId: item.id,
            payslipNumber: `PAY-${dto.year}-${String(dto.month).padStart(2, '0')}-${teacher.employeeId}`,
            netSalary,
            isDisbursed: false,
          },
        });
      }

      const updatedPayroll = await tx.payroll.update({
        where: { id: payroll.id },
        data: { totalAmount: totalPayrollAmount },
        include: {
          items: {
            include: {
              teacher: true,
              payslip: true,
            },
          },
        },
      });

      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            action: AuditAction.CREATE,
            entityName: 'Payroll',
            entityId: payroll.id,
            afterState: { month: dto.month, year: dto.year, totalAmount: totalPayrollAmount },
          },
        });
      }

      return updatedPayroll;
    });
  }

  // 3. Workflow Progression: Review -> Approved -> Disbursed (Paid)
  async updatePayRunStatus(id: string, status: PayRunStatus, actorId?: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!payroll) throw new NotFoundException('Payroll run not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payroll.update({
        where: { id },
        data: {
          status,
          approvedAt: status === PayRunStatus.APPROVED || status === PayRunStatus.DISBURSED ? new Date() : undefined,
          approvedBy: actorId,
        },
      });

      // If Disbursed, mark all payslips and payroll items as disbursed and create bank transaction
      if (status === PayRunStatus.DISBURSED) {
        await tx.payrollItem.updateMany({
          where: { payrollId: id },
          data: { isDisbursed: true, disbursedAt: new Date() },
        });

        const itemIds = payroll.items.map((it) => it.id);
        await tx.payslip.updateMany({
          where: { payrollItemId: { in: itemIds } },
          data: { isDisbursed: true },
        });

        // Record Bank Transaction in Accounting
        await tx.bankTransaction.create({
          data: {
            bankName: 'Prime Commercial Bank (Treasury Operating)',
            accountNumber: 'ACC-1002-TREASURY',
            transactionType: BankTransactionType.WITHDRAWAL,
            amount: payroll.totalAmount,
            referenceNumber: `SALARY-DISBURSED-${payroll.year}-${payroll.month}`,
          },
        });
      }

      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            action: status === PayRunStatus.APPROVED ? AuditAction.APPROVE : AuditAction.UPDATE,
            entityName: 'Payroll',
            entityId: id,
            beforeState: { status: payroll.status },
            afterState: { status },
          },
        });
      }

      return updated;
    });
  }

  async getPayRuns() {
    return this.prisma.payroll.findMany({
      include: {
        items: {
          include: {
            teacher: true,
            payslip: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getPayslip(payslipNumber: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { payslipNumber },
      include: {
        payrollItem: {
          include: {
            payroll: true,
            teacher: { include: { salaryStructure: { include: { components: true } } } },
          },
        },
      },
    });

    if (!payslip) throw new NotFoundException('Payslip record not found');
    return payslip;
  }
}

@ApiTags('Payroll & Staff Compensation')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('salary-structures')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN, UserRoleType.ACCOUNTANT)
  @Permissions('payroll.create')
  @ApiOperation({ summary: 'Define or update faculty base salary and allowances' })
  async createSalaryStructure(@Body() dto: CreateSalaryStructureDto) {
    return this.payrollService.createSalaryStructure(dto);
  }

  @Post('pay-runs/generate')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN, UserRoleType.ACCOUNTANT)
  @Permissions('payroll.create')
  @ApiOperation({ summary: 'Generate monthly institutional payroll run' })
  async generatePayRun(@Body() dto: GeneratePayRunDto, @CurrentUser('id') userId: string) {
    return this.payrollService.generatePayRun(dto, userId);
  }

  @Patch('pay-runs/:id/status')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN, UserRoleType.ACCOUNTANT)
  @Permissions('payroll.approve')
  @ApiOperation({ summary: 'Transition pay-run workflow (DRAFT -> APPROVED -> DISBURSED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PayRunStatus,
    @CurrentUser('id') userId: string,
  ) {
    return this.payrollService.updatePayRunStatus(id, status, userId);
  }

  @Get('pay-runs')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN, UserRoleType.ACCOUNTANT)
  @Permissions('payroll.read')
  @ApiOperation({ summary: 'List all payroll runs and employee items' })
  async getPayRuns() {
    return this.payrollService.getPayRuns();
  }

  @Get('payslips/:number')
  @ApiOperation({ summary: 'Get official employee payslip by number' })
  async getPayslip(@Param('number') number: string) {
    return this.payrollService.getPayslip(number);
  }
}

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, PDFService],
  exports: [PayrollService],
})
export class PayrollModule {}
