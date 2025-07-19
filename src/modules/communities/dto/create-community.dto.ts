import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCommunityDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsBoolean()
  isPublic: boolean;

  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
