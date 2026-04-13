import { LeaveType } from '@prisma/client';
import { IsDateString, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class VolunteerCreateLeaveDto {
  @IsEnum(LeaveType)
  type: LeaveType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @MinLength(1, { message: 'Reason is required' })
  @MaxLength(500)
  reason: string;
}
