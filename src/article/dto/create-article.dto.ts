import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

import { ArticleStatus } from '../../common/enums/article-status.enum';

export class CreateArticleDto {
  @ApiProperty({ example: 'Nest.js validation guide' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Detailed content for the article' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ enum: ArticleStatus, default: ArticleStatus.DRAFT })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status: ArticleStatus = ArticleStatus.DRAFT;

  @ApiPropertyOptional({ nullable: true, example: '78f5c3cf-b753-413d-9cc9-f362ec1fe42b' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID('4')
  authorId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '78f5c3cf-b753-413d-9cc9-f362ec1fe42b' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID('4')
  categoryId?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['nestjs', 'api'] })
  @IsOptional()
  @Type(() => String)
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];
}
