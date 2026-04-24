import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class OnboardingProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName: string;

  @IsString()
  @MinLength(8)
  @MaxLength(24)
  @Matches(/^[\d\s+\-()]+$/, { message: 'phone must contain digits and optional separators' })
  phone: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  department: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  emergencyContactName: string;

  @IsString()
  @MinLength(8)
  @MaxLength(24)
  @Matches(/^[\d\s+\-()]+$/, {
    message: 'emergency contact phone must contain digits and optional separators',
  })
  emergencyContactPhone: string;
}

export class FaceSampleItemDto {
  @IsString()
  @IsIn(['front', 'left', 'right'])
  angle: 'front' | 'left' | 'right';

  /** Base64 JPEG data URL — HD captures can exceed 3MB string length */
  @IsString()
  @MaxLength(12_000_000)
  @Matches(/^data:image\/jpeg;base64,/)
  dataUrl: string;
}

export class FaceSamplesDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => FaceSampleItemDto)
  samples: FaceSampleItemDto[];
}


