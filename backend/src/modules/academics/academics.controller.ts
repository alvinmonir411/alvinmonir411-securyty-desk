import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AcademicsService } from './academics.service';
import {
  CreateAcademicYearDto,
  CreateClassRoomDto,
  UpdateClassRoomDto,
  CreateSectionDto,
  UpdateSectionDto,
  CreateSubjectDto,
  UpdateSubjectDto,
} from './dto/academics.dto';
import { Roles, Permissions } from '../../common/decorators';
import { UserRoleType } from '@prisma/client';

@ApiTags('Academics & Structure')
@ApiBearerAuth()
@Controller('academics')
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get institutional overview metrics for Admin Dashboard' })
  async getDashboardStats() {
    return this.academicsService.getDashboardStats();
  }

  @Post('years')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Create academic year session' })
  async createYear(@Body() dto: CreateAcademicYearDto) {
    return this.academicsService.createYear(dto);
  }

  @Get('years')
  @ApiOperation({ summary: 'List all academic year sessions' })
  async getYears() {
    return this.academicsService.getYears();
  }

  @Post('classes')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Create grade / class level' })
  async createClass(@Body() dto: CreateClassRoomDto) {
    return this.academicsService.createClass(dto);
  }

  @Get('classes')
  @ApiOperation({ summary: 'List all classes with sections and subjects' })
  async getClasses() {
    return this.academicsService.getClasses();
  }

  @Patch('classes/:id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Update class details' })
  async updateClass(@Param('id') id: string, @Body() dto: UpdateClassRoomDto) {
    return this.academicsService.updateClass(id, dto);
  }

  @Delete('classes/:id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Delete a class' })
  async deleteClass(@Param('id') id: string) {
    return this.academicsService.deleteClass(id);
  }

  @Post('sections')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Create section inside a class' })
  async createSection(@Body() dto: CreateSectionDto) {
    return this.academicsService.createSection(dto);
  }

  @Patch('sections/:id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Update section' })
  async updateSection(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.academicsService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Delete section' })
  async deleteSection(@Param('id') id: string) {
    return this.academicsService.deleteSection(id);
  }

  @Get('sections')
  @ApiOperation({ summary: 'List all sections across classes' })
  async getAllSections() {
    return this.academicsService.getAllSections();
  }

  @Post('subjects')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Create subject in curriculum' })
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.academicsService.createSubject(dto);
  }

  @Patch('subjects/:id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Update subject' })
  async updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.academicsService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Delete subject' })
  async deleteSubject(@Param('id') id: string) {
    return this.academicsService.deleteSubject(id);
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List all curriculum subjects' })
  async getAllSubjects() {
    return this.academicsService.getAllSubjects();
  }
}
