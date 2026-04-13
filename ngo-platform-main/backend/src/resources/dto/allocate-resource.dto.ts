import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive, IsString, IsUUID, Min } from 'class-validator';

export class AllocateResourceDto {
    @IsUUID('4')
    resourceId: string;

    @IsUUID('4')
    taskId: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsPositive()
    quantity: number;
}

export class CreateResourceDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    quantity?: number;
}
