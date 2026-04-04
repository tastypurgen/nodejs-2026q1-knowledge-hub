import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';

const CATEGORY_SORT_FIELDS = ['name', 'description'] as const;

export class CategoryListQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: CATEGORY_SORT_FIELDS, example: 'name' })
  @IsOptional()
  @IsIn(CATEGORY_SORT_FIELDS)
  declare sortBy?: (typeof CATEGORY_SORT_FIELDS)[number];
}
