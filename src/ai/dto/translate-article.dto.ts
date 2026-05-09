import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TranslateArticleDto {
  @ApiProperty({ example: 'Polish' })
  @IsString()
  @IsNotEmpty()
  targetLanguage!: string;

  @ApiPropertyOptional({ example: 'English' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sourceLanguage?: string;
}
