import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
export declare class DonorCampaignsQueryDto extends PaginationQueryDto {
    from?: string;
    to?: string;
    location?: string;
    status?: 'ACTIVE' | 'COMPLETED';
}
