import { Module, Injectable, Controller, Get, Post, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { Roles, CurrentUser } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto';
import { UserRoleType, UserStatus, GuardianRelation } from '@prisma/client';

export class CreateParentDto {
  @ApiProperty({ example: 'parent@family.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Pass@123456' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'David' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Johnson' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({ example: '+1-555-0144' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: '742 Evergreen Terrace' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class LinkStudentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  parentId!: string;

  @ApiProperty({ enum: GuardianRelation, default: GuardianRelation.FATHER })
  @IsEnum(GuardianRelation)
  relation: GuardianRelation = GuardianRelation.FATHER;
}

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateParentDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash: hashedPassword,
          role: UserRoleType.PARENT,
          status: UserStatus.ACTIVE,
        },
      });

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email.toLowerCase(),
          occupation: dto.occupation,
          address: dto.address,
        },
      });

      return { user: { id: user.id, email: user.email }, parent };
    });
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [totalItems, data] = await Promise.all([
      this.prisma.parent.count({ where }),
      this.prisma.parent.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { email: true, status: true, avatarUrl: true } },
          students: {
            include: {
              student: {
                include: {
                  enrollments: {
                    where: { isActive: true },
                    include: { section: { include: { class: true } } },
                  },
                },
              },
            },
          },
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

  async getMyChildren(userId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              include: {
                enrollments: {
                  where: { isActive: true },
                  include: { section: { include: { class: true } } },
                },
                invoices: { where: { status: { in: ['UNPAID', 'PARTIAL'] } } },
                attendances: { take: 10, orderBy: { date: 'desc' } },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    return parent.students.map((s) => s.student);
  }

  async linkStudent(dto: LinkStudentDto) {
    return this.prisma.studentParent.upsert({
      where: {
        studentId_parentId: {
          studentId: dto.studentId,
          parentId: dto.parentId,
        },
      },
      update: { relationship: dto.relation },
      create: {
        studentId: dto.studentId,
        parentId: dto.parentId,
        relationship: dto.relation,
        isPrimary: true,
      },
    });
  }
}

@ApiTags('Parents & Guardians')
@ApiBearerAuth()
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Register parent account' })
  async create(@Body() dto: CreateParentDto) {
    return this.parentsService.create(dto);
  }

  @Get()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'List all parents with linked students' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.parentsService.findAll(query);
  }

  @Get('my-children')
  @Roles(UserRoleType.PARENT)
  @ApiOperation({ summary: 'Get linked children for authenticated parent' })
  async getMyChildren(@CurrentUser('id') userId: string) {
    return this.parentsService.getMyChildren(userId);
  }

  @Post('link-student')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Link parent to a student' })
  async linkStudent(@Body() dto: LinkStudentDto) {
    return this.parentsService.linkStudent(dto);
  }
}

@Module({
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
