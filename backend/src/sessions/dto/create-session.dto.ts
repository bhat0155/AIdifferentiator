import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsString() @MinLength(1)
  prompt!: string;

  @IsOptional() @IsString()
  userId?: string;
}