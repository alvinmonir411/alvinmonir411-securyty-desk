import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAcademicYearDto {
  @ApiProperty({ example: '2026-2027' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

export class CreateClassRoomDto {
  @ApiProperty({ example: 'Grade 10' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'G10' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  numericOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty({ example: 'Section A' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ default: 40 })
  @IsOptional()
  @IsNumber()
  capacity?: number;
}

export class CreateSubjectDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @ApiProperty({ example: 'Advanced Mathematics' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'MATH-101' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({ default: 1.0 })
  @IsOptional()
  @IsNumber()
  creditHours?: number;

  @ApiPropertyOptional({ default: 100.0 })
  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @ApiPropertyOptional({ default: 33.0 })
  @IsOptional()
  @IsNumber()
  passMarks?: number;
}

export class UpdateClassRoomDto {
  @ApiPropertyOptional({ example: 'Class 10' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'C10' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  numericOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSectionDto {
  @ApiPropertyOptional({ example: 'Section A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ default: 40 })
  @IsOptional()
  @IsNumber()
  capacity?: number;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({ example: 'Advanced Mathematics' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'MATH-101' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ default: 100.0 })
  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @ApiPropertyOptional({ default: 33.0 })
  @IsOptional()
  @IsNumber()
  passMarks?: number;
}
