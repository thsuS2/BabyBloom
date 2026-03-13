import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SendCodeDto {
  @IsEmail()
  email: string;
}

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  nickname?: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
