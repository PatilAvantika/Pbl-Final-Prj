import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_RULE_MESSAGE,
} from '../password.validation';

export class LoginDto {
  @IsEmail()
  email: string;

  /** Accept any non-empty password so existing accounts are not locked out; strength enforced on register/admin set-password. */
  @IsString()
  @MinLength(1)
  password: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_RULE_MESSAGE })
  password: string;

  @IsEnum(Role)
  role: Role;
}
