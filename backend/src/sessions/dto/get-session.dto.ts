import { IsString } from 'class-validator';
export class GetSessionParamDto {
  @IsString()
  id!: string;
}
