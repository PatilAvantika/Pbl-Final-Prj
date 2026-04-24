import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ChatbotQueryDto {
  /** Optional; when set and different from JWT user, only privileged roles may query. */
  @IsOptional()
  @IsUUID('4')
  user_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;
}
