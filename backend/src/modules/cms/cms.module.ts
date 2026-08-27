import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../database/prisma.service';
import { Public, Roles, Permissions, CurrentUser } from '../../common/decorators';
import { UserRoleType, NoticeTarget, AuditAction } from '@prisma/client';

export class CreateNoticeDto {
  @ApiProperty({ example: 'Annual Science & Tech Fair 2026' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'The annual science fair exhibition will take place in the Main Auditorium...' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ enum: NoticeTarget, default: NoticeTarget.ALL })
  @IsEnum(NoticeTarget)
  target!: NoticeTarget;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class CreateNewsDto {
  @ApiProperty({ example: 'Apex Academy Students Win National Olympiad 2026' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Our grade 10 debate team clinched 1st place in the national tournament.' })
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiProperty({ example: 'Full article text detailing the championship and awards ceremony...' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Inter-School Sports Gala 2026' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Track and field events, football championship, and swimming competitions.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'Main Sports Complex & Athletics Track' })
  @IsString()
  @IsNotEmpty()
  venue!: string;

  @ApiProperty({ example: '2026-04-15T09:00:00.000Z' })
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-04-17T17:00:00.000Z' })
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;
}

export class CreateHeroSlideDto {
  @ApiProperty({ example: 'Empowering Tomorrow’s Global Leaders' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'World-Class STEM, Humanities, and Character Education from Pre-K to Grade 12' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1' })
  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @ApiPropertyOptional({ example: 'Apply for Admission' })
  @IsOptional()
  @IsString()
  buttonText?: string;

  @ApiPropertyOptional({ example: '/admission' })
  @IsOptional()
  @IsString()
  buttonLink?: string;
}

export class SubmitContactInquiryDto {
  @ApiProperty({ example: 'Sarah Jenkins' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'sarah.j@example.com' })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: '+1-555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Inquiry regarding Grade 9 IB Curriculum Admissions' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Hello Admissions Office, we are relocating to the city and would love a campus tour.' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

@Injectable()
export class CMSService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Hero Slides
  async getHeroSlides() {
    let slides = await this.prisma.heroSlider.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (slides.length === 0) {
      // Auto-seed default 2 persistent slides
      const slide1 = await this.prisma.heroSlider.create({
        data: {
          title: 'INSPIRING MINDS.\nBUILDING FUTURES.',
          subtitle: 'A disciplined, modern and student-centered learning environment where knowledge, character and creativity grow together.',
          imageUrl: '/787124177_2051232472934207_3472095284671851725_n.jpg',
          buttonText: 'Explore Academics',
          buttonLink: '/academics',
          sortOrder: 1,
          isActive: true,
        },
      });

      const slide2 = await this.prisma.heroSlider.create({
        data: {
          title: 'EXCELLENCE IN\nNCTB EDUCATION.',
          subtitle: 'Structured classroom learning, experienced educators, and complete guidance for secondary academic success.',
          imageUrl: '/778985014_1018608747889352_6428572593389947367_n.jpg',
          buttonText: 'Apply for Admission',
          buttonLink: '/admissions',
          sortOrder: 2,
          isActive: true,
        },
      });

      slides = [slide1, slide2];
    }
    return slides;
  }

  async createHeroSlide(dto: CreateHeroSlideDto) {
    return this.prisma.heroSlider.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        buttonText: dto.buttonText || 'Explore Academics',
        buttonLink: dto.buttonLink || '/academics',
        isActive: true,
      },
    });
  }

  async updateHeroSlide(id: string, dto: Partial<CreateHeroSlideDto>) {
    const existing = await this.prisma.heroSlider.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Hero slide with ID '${id}' not found`);
    }

    return this.prisma.heroSlider.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.buttonText !== undefined && { buttonText: dto.buttonText }),
        ...(dto.buttonLink !== undefined && { buttonLink: dto.buttonLink }),
      },
    });
  }

  async deleteHeroSlide(id: string) {
    const existing = await this.prisma.heroSlider.findUnique({ where: { id } });
    if (existing) {
      await this.prisma.heroSlider.delete({ where: { id } });
    }
    return { success: true, message: 'Hero slide deleted successfully' };
  }

  // 2. Notices
  async getNotices(target?: NoticeTarget) {
    const where: any = { isPublished: true };
    if (target && target !== NoticeTarget.ALL) {
      where.OR = [{ target: NoticeTarget.ALL }, { target }];
    }
    const notices = await this.prisma.notice.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });

    if (notices.length === 0) {
      return [
        {
          id: 'notif-1',
          title: 'Official Schedule for Term Examination 2026',
          content: 'The comprehensive routine and seat allocation plans have been uploaded to the Academic portal.',
          target: NoticeTarget.ALL,
          isPinned: true,
          publishedAt: new Date(),
        },
        {
          id: 'notif-2',
          title: 'Spring Parent-Teacher Conference (PTC)',
          content: 'Individual conferences with faculty members will take place on Saturday from 9:00 AM to 2:00 PM.',
          target: NoticeTarget.PARENTS,
          isPinned: false,
          publishedAt: new Date(Date.now() - 86400000),
        },
      ];
    }
    return notices;
  }

  async createNotice(dto: CreateNoticeDto, actorId?: string) {
    const notice = await this.prisma.notice.create({
      data: {
        title: dto.title,
        content: dto.content,
        target: dto.target,
        isPinned: dto.isPinned ?? false,
        attachmentUrl: dto.attachmentUrl,
      },
    });

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: AuditAction.CREATE,
          entityName: 'Notice',
          entityId: notice.id,
          afterState: notice,
        },
      });
    }

    return notice;
  }

  // 3. News Articles
  async getNews() {
    const news = await this.prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });

    if (news.length === 0) {
      return [
        {
          id: 'news-1',
          slug: 'national-robotics-championship-2026',
          title: 'Noble Residential High School Robotics Team Clinches First Place in National Championship',
          summary: 'Our student engineering squad designed an autonomous rover that achieved top score.',
          content: 'Our student engineering squad designed an autonomous rover that achieved top score in speed and obstacle navigation.',
          coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop',
          publishedAt: new Date(),
        },
        {
          id: 'news-2',
          slug: 'inauguration-new-performing-arts-complex',
          title: 'Grand Inauguration of New Performing Arts & Symphony Center',
          summary: 'A world-class 800-seat auditorium equipped with modern acoustics and theater lighting.',
          content: 'A world-class 800-seat auditorium equipped with modern acoustics, theater lighting, and music studios.',
          coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
          publishedAt: new Date(Date.now() - 172800000),
        },
      ];
    }
    return news;
  }

  async createNews(dto: CreateNewsDto) {
    const slug = dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return this.prisma.news.create({
      data: {
        slug,
        title: dto.title,
        summary: dto.summary,
        content: dto.content,
        coverImage: dto.coverImage,
        isPublished: true,
      },
    });
  }

  // 4. Events
  async getEvents() {
    const events = await this.prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { startDate: 'asc' },
    });

    if (events.length === 0) {
      return [
        {
          id: 'ev-1',
          title: 'Annual Science & Innovation Expo 2026',
          description: 'Over 120 student research exhibits, interactive coding workshops, and guest keynote speakers.',
          venue: 'Main Science Complex & Atrium',
          startDate: new Date('2026-04-12T09:00:00Z'),
          endDate: new Date('2026-04-13T16:00:00Z'),
          coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
        },
        {
          id: 'ev-2',
          title: 'Inter-School Athletics Track & Field Gala',
          description: '100m sprint, relay, long jump, high jump, and football finals with 12 visiting academies.',
          venue: 'Olympic Sports Ground',
          startDate: new Date('2026-04-20T08:30:00Z'),
          endDate: new Date('2026-04-21T18:00:00Z'),
          coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop',
        },
      ];
    }
    return events;
  }

  async createEvent(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        venue: dto.venue,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        coverImage: dto.coverImage,
      },
    });
  }

  // 5. School Statistics & Leadership Messages
  async getSchoolStats() {
    return {
      enrolledStudents: '1,850+',
      facultyMembers: '120+',
      examPassRate: '99.8%',
      nationalAwards: '45+',
      campusAcreage: '25 Acres',
    };
  }

  async getLeadershipMessages() {
    return {
      principal: {
        authorName: 'Dr. Elizabeth Montgomery, Ph.D.',
        authorDesignation: 'Principal & Chief Academic Officer',
        title: 'Welcome from the Principal',
        message:
          'At Noble Residential High School, we believe education is more than academic rigor — it is the cultivation of curiosity, integrity, and lifelong resilience. Our faculty empowers every learner to realize their fullest human potential.',
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
      },
      chairman: {
        authorName: 'Arthur Vance, M.Ed.',
        authorDesignation: 'Chairman, Board of Governors',
        title: 'Message from the Chairman',
        message:
          'Founded with a visionary purpose to inspire global leaders, our academy combines world-class infrastructure with deep moral character and innovative pedagogy.',
        imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop',
      },
    };
  }

  async getDownloads() {
    return [
      { id: 'd-1', title: 'Academic Calendar 2026-2027', category: 'Calendar', fileUrl: '/downloads/academic-calendar.pdf', fileSize: '1.2 MB' },
      { id: 'd-2', title: 'Curriculum Syllabus & Subject Guide (Grades 1-12)', category: 'Syllabus', fileUrl: '/downloads/syllabus-guide.pdf', fileSize: '3.4 MB' },
      { id: 'd-3', title: 'Prescribed Textbooks & Stationery Booklist', category: 'Booklist', fileUrl: '/downloads/booklist-2026.pdf', fileSize: '850 KB' },
      { id: 'd-4', title: 'Official School Prospectus & Admission Guidelines', category: 'Prospectus', fileUrl: '/downloads/prospectus.pdf', fileSize: '4.8 MB' },
    ];
  }
}

@ApiTags('CMS & Public School Content')
@Controller('cms')
export class CMSController {
  constructor(private readonly cmsService: CMSService) {}

  @Public()
  @Get('hero-slides')
  @ApiOperation({ summary: 'Get homepage hero banner slides' })
  async getHeroSlides() {
    return this.cmsService.getHeroSlides();
  }

  @Post('hero-slides')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('cms.create')
  @ApiOperation({ summary: 'Create hero banner slide' })
  async createHeroSlide(@Body() dto: CreateHeroSlideDto) {
    return this.cmsService.createHeroSlide(dto);
  }

  @Patch('hero-slides/:id')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Update hero banner slide' })
  async updateHeroSlide(@Param('id') id: string, @Body() dto: Partial<CreateHeroSlideDto>) {
    return this.cmsService.updateHeroSlide(id, dto);
  }

  @Delete('hero-slides/:id')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @ApiOperation({ summary: 'Delete hero banner slide' })
  async deleteHeroSlide(@Param('id') id: string) {
    return this.cmsService.deleteHeroSlide(id);
  }

  @Public()
  @Get('notices')
  @ApiOperation({ summary: 'Get published notice board items' })
  async getNotices(@Query('target') target?: NoticeTarget) {
    return this.cmsService.getNotices(target);
  }

  @Post('notices')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('cms.create')
  @ApiOperation({ summary: 'Post circular or notice board item' })
  async createNotice(@Body() dto: CreateNoticeDto, @CurrentUser('id') userId: string) {
    return this.cmsService.createNotice(dto, userId);
  }

  @Public()
  @Get('news')
  @ApiOperation({ summary: 'Get published news stories' })
  async getNews() {
    return this.cmsService.getNews();
  }

  @Post('news')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('cms.create')
  @ApiOperation({ summary: 'Publish school news story' })
  async createNews(@Body() dto: CreateNewsDto) {
    return this.cmsService.createNews(dto);
  }

  @Public()
  @Get('events')
  @ApiOperation({ summary: 'Get upcoming campus events' })
  async getEvents() {
    return this.cmsService.getEvents();
  }

  @Post('events')
  @ApiBearerAuth()
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('cms.create')
  @ApiOperation({ summary: 'Publish campus calendar event' })
  async createEvent(@Body() dto: CreateEventDto) {
    return this.cmsService.createEvent(dto);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get school achievement statistics' })
  async getSchoolStats() {
    return this.cmsService.getSchoolStats();
  }

  @Public()
  @Get('leadership')
  @ApiOperation({ summary: 'Get Principal and Chairman messages' })
  async getLeadershipMessages() {
    return this.cmsService.getLeadershipMessages();
  }

  @Public()
  @Get('downloads')
  @ApiOperation({ summary: 'Get academic calendar, syllabus, booklist downloads' })
  async getDownloads() {
    return this.cmsService.getDownloads();
  }
}

@Module({
  controllers: [CMSController],
  providers: [CMSService],
  exports: [CMSService],
})
export class CMSModule {}
