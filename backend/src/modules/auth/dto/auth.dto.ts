import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@school.edu', description: 'Institutional email address' })
  @IsEmail({}, { message: 'Please provide a valid institutional email address' })
  email!: string;

  @ApiProperty({ example: 'Admin@123456', description: 'Account password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Active refresh token UUID' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Admin@123456', description: 'Current active password' })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecret@2026', description: 'New password' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@school.edu', description: 'Registered email address' })
  @IsEmail({}, { message: 'Please provide a valid registered email address' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset verification token' })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token!: string;

  @ApiProperty({ example: 'NewSecurePass@2026', description: 'New password' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}
