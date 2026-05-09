import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GeneratePromptDto {
  @ApiProperty({ example: 'Write a short checklist for improving Nest.js API validation.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt!: string;

  @ApiPropertyOptional({ example: 'docs-review-session' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  sessionId?: string;
}
