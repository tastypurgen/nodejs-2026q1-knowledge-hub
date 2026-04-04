import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';
import { ArticleStatus } from '../../common/enums/article-status.enum';

const ARTICLE_SORT_FIELDS = ['title', 'status', 'createdAt', 'updatedAt'] as const;

export class ArticleListQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ARTICLE_SORT_FIELDS, example: 'createdAt' })
  @IsOptional()
  @IsIn(ARTICLE_SORT_FIELDS)
  declare sortBy?: (typeof ARTICLE_SORT_FIELDS)[number];

  @ApiPropertyOptional({ enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({ example: '78f5c3cf-b753-413d-9cc9-f362ec1fe42b' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ example: 'nestjs' })
  @IsOptional()
  @IsString()
  tag?: string;
}
