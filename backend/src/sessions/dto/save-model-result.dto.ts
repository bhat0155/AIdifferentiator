import { IsInt, IsNumber, IsString } from 'class-validator';

export class SaveModelResultDto {
  @IsString() sessionId!: string;
  @IsString() provider!: 'openai' | 'google';
  @IsString() modelName!: string;
  @IsString() responseText!: string;

  @IsInt() tokenCount!: number;
  @IsNumber() costUSD!: number;
  @IsInt() responseTimeMs!: number;
}
