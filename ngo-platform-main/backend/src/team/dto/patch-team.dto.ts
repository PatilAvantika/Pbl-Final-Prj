import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class TeamVolunteerRowDto {
    @IsUUID('4')
    id: string;

    /** When truthy, volunteer is on this leader's roster. */
    @IsOptional()
    @IsString()
    teamId?: string | null;
}

export class PatchTeamDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TeamVolunteerRowDto)
    volunteers: TeamVolunteerRowDto[];
}
