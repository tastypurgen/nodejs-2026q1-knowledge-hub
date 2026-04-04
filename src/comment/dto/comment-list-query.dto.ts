import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';

const COMMENT_SORT_FIELDS = ['content', 'createdAt'] as const;

export class CommentListQueryDto extends ListQueryDto {
  @ApiProperty({ example: '78f5c3cf-b753-413d-9cc9-f362ec1fe42b' })
  @IsUUID('4')
  articleId!: string;

  @ApiPropertyOptional({ enum: COMMENT_SORT_FIELDS, example: 'createdAt' })
  @IsOptional()
  @IsIn(COMMENT_SORT_FIELDS)
  declare sortBy?: (typeof COMMENT_SORT_FIELDS)[number];
}
