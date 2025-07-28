import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
