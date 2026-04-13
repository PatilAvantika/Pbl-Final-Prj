import { IsOptional, IsString, IsUUID } from 'class-validator';

/** Text fields from multipart POST /volunteer/reports (files are separate). */
export class VolunteerCreateReportDto {
  @IsUUID('4')
  taskId: string;

  @IsOptional()
  @IsString()
  wasteCollected?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
