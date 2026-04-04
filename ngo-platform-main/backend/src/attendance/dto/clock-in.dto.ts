import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class ClockInDto {
  @IsUUID()
  taskId: string;

  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  lng: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracyMeters: number;

  @IsString()
  @MinLength(1)
  uniqueRequestId: string;

  @IsString()
  @MinLength(1)
  deviceId: string;

  @IsOptional()
  @IsString()
  imageHash?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
