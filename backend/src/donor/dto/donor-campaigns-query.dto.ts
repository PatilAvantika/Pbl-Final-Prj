import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Validated query for GET /donor/campaigns (pagination + filters, UTC-safe date strings). */
export class DonorCampaignsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().slice(0, 200) : value))
    location?: string;

    @IsOptional()
    @IsIn(['ACTIVE', 'COMPLETED'])
    status?: 'ACTIVE' | 'COMPLETED';
}
