import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  IsUUID,
  MaxLength,
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
  @IsIn(['CLOCK_IN', 'CLOCK_OUT'])
  type?: 'CLOCK_IN' | 'CLOCK_OUT';

  @IsOptional()
  @IsString()
  @MaxLength(12_000_000)
  @Matches(/^data:image\/jpeg;base64,/, { message: 'image must be a JPEG data URL' })
  image?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @MaxLength(12_000_000, { each: true })
  @Matches(/^data:image\/jpeg;base64,/, { each: true, message: 'imageSequence items must be JPEG data URLs' })
  imageSequence?: string[];

  @IsOptional()
  @IsString()
  imageHash?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
