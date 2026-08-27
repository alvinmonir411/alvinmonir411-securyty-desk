import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Headers,
  UnauthorizedException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiHeader,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../database/prisma.service';
import { Roles } from '../../common/decorators';
import { UserRoleType } from '@prisma/client';

// TODO: Add BiometricDevice, BiometricLog, BiometricUserMapping models to Prisma schema,
//       then uncomment BiometricDeviceStatus, AttendanceStatus imports and all service methods below.
// import { BiometricDeviceStatus, AttendanceStatus } from '@prisma/client';

// ─── DTOs ───────────────────────────────────────────────────────────────────

export class CreateDeviceDto {
  @ApiProperty({ example: 'Main Gate Machine' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'ZKTK40-SN12345' })
  @IsOptional() @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: '192.168.1.100' })
  @IsOptional() @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'School Main Gate' })
  @IsOptional() @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'ZKTeco K40' })
  @IsOptional() @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'ZKTeco' })
  @IsOptional() @IsString()
  brand?: string;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ipAddress?: string;
  // TODO: Uncomment when BiometricDeviceStatus is added to Prisma schema
  // @ApiPropertyOptional({ enum: BiometricDeviceStatus })
  // @IsOptional() @IsEnum(BiometricDeviceStatus) status?: BiometricDeviceStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class PunchRecordDto {
  @ApiProperty({ example: '1001', description: 'The user ID enrolled in the biometric machine' })
  @IsString() @IsNotEmpty()
  uid!: string;

  @ApiProperty({ example: '2026-08-26T08:32:00Z', description: 'Exact punch timestamp from machine' })
  @IsDateString()
  punchTime!: string;

  @ApiPropertyOptional({ example: 'IN', description: 'IN or OUT punch type' })
  @IsOptional() @IsString()
  punchType?: string;
}

export class MachineAdmsPushDto {
  @ApiProperty({ type: [PunchRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PunchRecordDto)
  records!: PunchRecordDto[];
}

export class CreateMappingDto {
  @ApiProperty({ example: '1001', description: 'Machine user ID enrolled in fingerprint device' })
  @IsString() @IsNotEmpty()
  machineUserId!: string;

  @ApiPropertyOptional({ description: 'Device ID (leave empty for all devices)' })
  @IsOptional() @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Student ID to link to this machine user' })
  @IsOptional() @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Teacher ID to link to this machine user' })
  @IsOptional() @IsString()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  notes?: string;
}

export class ProcessPendingLogsDto {
  @ApiProperty({ example: '2026-08-26', description: 'Date to process pending logs for (YYYY-MM-DD)' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Section ID for the attendance record' })
  @IsOptional() @IsString()
  sectionId?: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class BiometricService {
  private readonly logger = new Logger(BiometricService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // TODO: All methods below are commented out because the following Prisma
  //       models are not yet defined in schema.prisma:
  //         - BiometricDevice
  //         - BiometricLog
  //         - BiometricUserMapping
  //       Also needed in schema:
  //         - BiometricDeviceStatus (enum)
  //         - AttendanceStatus (enum) — for studentAttendance.upsert
  //       Steps to restore:
  //       1. Add models to prisma/schema.prisma
  //       2. Run: npx prisma migrate dev
  //       3. Uncomment all methods below and the imports at the top
  // ══════════════════════════════════════════════════════════════════════════

  /*
  // ── Device Management ─────────────────────────────────────────────────────

  async createDevice(dto: CreateDeviceDto) {
    return this.prisma.biometricDevice.create({ data: dto });
  }

  async listDevices() {
    return this.prisma.biometricDevice.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { logs: true } },
      },
    });
  }

  async getDevice(id: string) {
    const device = await this.prisma.biometricDevice.findUnique({
      where: { id },
      include: { _count: { select: { logs: true } } },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async updateDevice(id: string, dto: UpdateDeviceDto) {
    return this.prisma.biometricDevice.update({ where: { id }, data: dto });
  }

  async deleteDevice(id: string) {
    await this.prisma.biometricDevice.delete({ where: { id } });
    return { success: true, message: 'Device deleted' };
  }

  async regenerateApiKey(id: string) {
    const newKey = crypto.randomUUID();
    const device = await this.prisma.biometricDevice.update({
      where: { id },
      data: { apiKey: newKey },
    });
    return { apiKey: device.apiKey };
  }

  // ── ADMS Push Mode — called by the biometric machine itself ──────────────

  async receiveMachinePush(apiKey: string, dto: MachineAdmsPushDto) {
    const device = await this.prisma.biometricDevice.findUnique({ where: { apiKey } });
    if (!device) throw new UnauthorizedException('Invalid device API key');

    if (device.status !== BiometricDeviceStatus.ACTIVE) {
      throw new UnauthorizedException(`Device "${device.name}" is not active`);
    }

    const createdLogs: any[] = [];

    for (const record of dto.records) {
      const mapping = await this.prisma.biometricUserMapping.findFirst({
        where: {
          machineUserId: record.uid,
          OR: [{ deviceId: device.id }, { deviceId: null }],
        },
      });

      const log = await this.prisma.biometricLog.create({
        data: {
          deviceId: device.id,
          machineUserId: record.uid,
          punchTime: new Date(record.punchTime),
          punchType: record.punchType,
          rawPayload: record as any,
          studentId: mapping?.studentId,
          teacherId: mapping?.teacherId,
          processed: false,
        },
      });

      createdLogs.push(log);
    }

    await this.prisma.biometricDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    this.logger.log(`[Biometric] ${dto.records.length} punch(es) received from device: ${device.name}`);

    return {
      success: true,
      received: createdLogs.length,
      deviceName: device.name,
    };
  }

  // ── User Mappings (machine ID ↔ student/teacher) ─────────────────────────

  async createMapping(dto: CreateMappingDto) {
    if (!dto.studentId && !dto.teacherId) {
      throw new BadRequestException('Either studentId or teacherId must be provided');
    }
    return this.prisma.biometricUserMapping.upsert({
      where: {
        machineUserId_deviceId: {
          machineUserId: dto.machineUserId,
          deviceId: dto.deviceId ?? null,
        },
      },
      update: { studentId: dto.studentId, teacherId: dto.teacherId, notes: dto.notes },
      create: {
        machineUserId: dto.machineUserId,
        deviceId: dto.deviceId,
        studentId: dto.studentId,
        teacherId: dto.teacherId,
        notes: dto.notes,
      },
    });
  }

  async listMappings(deviceId?: string) {
    return this.prisma.biometricUserMapping.findMany({
      where: deviceId ? { deviceId } : undefined,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { machineUserId: 'asc' },
    });
  }

  async deleteMapping(id: string) {
    await this.prisma.biometricUserMapping.delete({ where: { id } });
    return { success: true };
  }

  // ── Punch Logs ────────────────────────────────────────────────────────────

  async listLogs(deviceId?: string, date?: string, processed?: string) {
    const where: any = {};
    if (deviceId) where.deviceId = deviceId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(date);
      dEnd.setHours(23, 59, 59, 999);
      where.punchTime = { gte: d, lte: dEnd };
    }
    if (processed !== undefined) where.processed = processed === 'true';

    return this.prisma.biometricLog.findMany({
      where,
      include: {
        device: { select: { id: true, name: true, location: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
      orderBy: { punchTime: 'desc' },
      take: 500,
    });
  }

  // ── Process Pending Biometric Logs → StudentAttendance ───────────────────

  async processPendingLogs(dto: ProcessPendingLogsDto) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dto.date);
    dateEnd.setHours(23, 59, 59, 999);

    const pendingLogs = await this.prisma.biometricLog.findMany({
      where: {
        processed: false,
        studentId: { not: null },
        punchTime: { gte: date, lte: dateEnd },
      },
      include: {
        student: {
          include: {
            enrollments: { where: { isActive: true } },
          },
        },
      },
      orderBy: { punchTime: 'asc' },
    });

    if (pendingLogs.length === 0) {
      return { success: true, processed: 0, message: 'No pending student logs to process for this date' };
    }

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isCurrent: true } });
    const yearId = activeYear?.id;

    if (!yearId) {
      throw new BadRequestException('No active academic year found. Please set up an academic year first.');
    }

    const studentFirstPunch = new Map<string, (typeof pendingLogs)[0]>();
    for (const log of pendingLogs) {
      if (log.studentId && !studentFirstPunch.has(log.studentId)) {
        studentFirstPunch.set(log.studentId, log);
      }
    }

    let processedCount = 0;
    const processedLogIds: string[] = [];

    for (const [studentId, log] of studentFirstPunch) {
      const enrollment = log.student?.enrollments?.[0];
      const sectionId = dto.sectionId || enrollment?.sectionId;

      if (!sectionId) {
        this.logger.warn(`Student ${studentId} has no active enrollment — skipping`);
        continue;
      }

      try {
        const punchHour = log.punchTime.getHours();
        const punchMinute = log.punchTime.getMinutes();
        const totalMinutes = punchHour * 60 + punchMinute;
        const cutoffMinutes = 8 * 60 + 30; // 8:30 AM
        const status = totalMinutes <= cutoffMinutes ? AttendanceStatus.PRESENT : AttendanceStatus.LATE;

        await this.prisma.studentAttendance.upsert({
          where: {
            studentId_date_academicYearId: {
              studentId,
              date,
              academicYearId: yearId,
            },
          },
          update: { status, remarks: `Auto-marked from biometric punch at ${log.punchTime.toLocaleTimeString()}` },
          create: {
            studentId,
            sectionId,
            academicYearId: yearId,
            date,
            status,
            remarks: `Auto-marked from biometric punch at ${log.punchTime.toLocaleTimeString()}`,
          },
        });

        processedCount++;
        processedLogIds.push(...pendingLogs.filter((l) => l.studentId === studentId).map((l) => l.id));
      } catch (err: any) {
        this.logger.error(`Failed to process log for student ${studentId}: ${err.message}`);
      }
    }

    if (processedLogIds.length > 0) {
      await this.prisma.biometricLog.updateMany({
        where: { id: { in: processedLogIds } },
        data: { processed: true, processedAt: new Date() },
      });
    }

    return {
      success: true,
      totalPending: pendingLogs.length,
      processed: processedCount,
      message: `Successfully converted ${processedCount} biometric punch(es) to attendance records.`,
    };
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard() {
    const [totalDevices, activeDevices, pendingLogs, todayLogs] = await Promise.all([
      this.prisma.biometricDevice.count(),
      this.prisma.biometricDevice.count({ where: { status: BiometricDeviceStatus.ACTIVE } }),
      this.prisma.biometricLog.count({ where: { processed: false } }),
      this.prisma.biometricLog.count({
        where: {
          punchTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const recentLogs = await this.prisma.biometricLog.findMany({
      take: 10,
      orderBy: { punchTime: 'desc' },
      include: {
        device: { select: { name: true } },
        student: { select: { firstName: true, lastName: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    return { totalDevices, activeDevices, pendingLogs, todayLogs, recentLogs };
  }
  */

  // ── Temporary placeholder — remove once schema models are added ───────────
  async getStatus() {
    return {
      status: 'Biometric module is pending schema setup',
      message: 'BiometricDevice, BiometricLog, and BiometricUserMapping models need to be added to Prisma schema.',
    };
  }
}

// ─── Controller ─────────────────────────────────────────────────────────────

@ApiTags('Biometric Attendance')
@Controller('biometric')
export class BiometricController {
  constructor(private readonly biometricService: BiometricService) {}

  // ── Machine Push Endpoint ─────────────────────────────────────────────────
  // TODO: Uncomment after schema is set up
  /*
  @Post('machine/push')
  @ApiOperation({
    summary: 'Receive punch records from biometric machine (ADMS push mode)',
    description: 'The fingerprint machine POSTs punch data here. Authenticate using X-Device-Key header.',
  })
  @ApiHeader({ name: 'X-Device-Key', description: 'Device API key from device settings page', required: true })
  async receiveMachinePush(
    @Headers('x-device-key') apiKey: string,
    @Body() dto: MachineAdmsPushDto,
  ) {
    if (!apiKey) throw new UnauthorizedException('X-Device-Key header required');
    return this.biometricService.receiveMachinePush(apiKey, dto);
  }
  */

  // ── Admin Device Management ───────────────────────────────────────────────
  // TODO: Uncomment after schema is set up
  /*
  @Post('devices')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Register a new biometric device' })
  async createDevice(@Body() dto: CreateDeviceDto) {
    return this.biometricService.createDevice(dto);
  }

  @Get('devices')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'List all registered biometric devices' })
  async listDevices() {
    return this.biometricService.listDevices();
  }

  @Get('devices/:id')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Get a specific biometric device' })
  async getDevice(@Param('id') id: string) {
    return this.biometricService.getDevice(id);
  }

  @Put('devices/:id')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Update biometric device details' })
  async updateDevice(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.biometricService.updateDevice(id, dto);
  }

  @Delete('devices/:id')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Delete biometric device' })
  async deleteDevice(@Param('id') id: string) {
    return this.biometricService.deleteDevice(id);
  }

  @Post('devices/:id/regenerate-key')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Regenerate API key for a device' })
  async regenerateKey(@Param('id') id: string) {
    return this.biometricService.regenerateApiKey(id);
  }
  */

  // ── User Mappings ─────────────────────────────────────────────────────────
  // TODO: Uncomment after schema is set up
  /*
  @Post('mappings')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Map a machine user ID to a student or teacher' })
  async createMapping(@Body() dto: CreateMappingDto) {
    return this.biometricService.createMapping(dto);
  }

  @Get('mappings')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'List all machine ID ↔ person mappings' })
  async listMappings(@Query('deviceId') deviceId?: string) {
    return this.biometricService.listMappings(deviceId);
  }

  @Delete('mappings/:id')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Delete a user mapping' })
  async deleteMapping(@Param('id') id: string) {
    return this.biometricService.deleteMapping(id);
  }
  */

  // ── Punch Logs ────────────────────────────────────────────────────────────
  // TODO: Uncomment after schema is set up
  /*
  @Get('logs')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'View biometric punch logs with optional filters' })
  async listLogs(
    @Query('deviceId') deviceId?: string,
    @Query('date') date?: string,
    @Query('processed') processed?: string,
  ) {
    return this.biometricService.listLogs(deviceId, date, processed);
  }
  */

  // ── Process / Convert Logs → Attendance ──────────────────────────────────
  // TODO: Uncomment after schema is set up
  /*
  @Post('process')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Process pending biometric logs and create StudentAttendance records' })
  async processPendingLogs(@Body() dto: ProcessPendingLogsDto) {
    return this.biometricService.processPendingLogs(dto);
  }
  */

  // ── Dashboard ─────────────────────────────────────────────────────────────
  // TODO: Uncomment after schema is set up
  /*
  @Get('dashboard')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Biometric device integration dashboard metrics' })
  async getDashboard() {
    return this.biometricService.getDashboard();
  }
  */

  // ── Temporary status endpoint ─────────────────────────────────────────────
  @Get('status')
  @ApiOperation({ summary: 'Biometric module setup status' })
  async getStatus() {
    return this.biometricService.getStatus();
  }
}

// ─── Module ──────────────────────────────────────────────────────────────────

@Module({
  controllers: [BiometricController],
  providers: [BiometricService],
  exports: [BiometricService],
})
export class BiometricModule {}
