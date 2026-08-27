import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, EnrollStudentDto, StudentFilterQueryDto } from './dto/students.dto';
import { Roles, Permissions } from '../../common/decorators';
import { UserRoleType } from '@prisma/client';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('students.create')
  @ApiOperation({ summary: 'Register a new student' })
  async create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN, UserRoleType.TEACHER, UserRoleType.ACCOUNTANT)
  @Permissions('students.read')
  @ApiOperation({ summary: 'Get paginated list of students with class/section/status filters' })
  async findAll(@Query() query: StudentFilterQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @Permissions('students.read')
  @ApiOperation({ summary: 'Get detailed Student 360° profile' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.getStudent360(id);
  }

  @Patch(':id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('students.update')
  @ApiOperation({ summary: 'Update student demographic and contact information' })
  async update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('students.delete')
  @ApiOperation({ summary: 'Archive/soft-delete a student profile' })
  async delete(@Param('id') id: string) {
    return this.studentsService.delete(id);
  }

  @Post(':id/enroll')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('students.update')
  @ApiOperation({ summary: 'Enroll student into academic year and section' })
  async enroll(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.studentsService.enroll(id, dto);
  }
}
