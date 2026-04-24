import { IsIn } from 'class-validator';

export class ReviewReportDto {
    @IsIn(['APPROVED', 'REJECTED'])
    status: 'APPROVED' | 'REJECTED';
}
