import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { ListQueryDto } from '../../common/dto/list-query.dto';

const USER_SORT_FIELDS = ['login', 'role', 'createdAt', 'updatedAt'] as const;

export class UserListQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: USER_SORT_FIELDS, example: 'createdAt' })
  @IsOptional()
  @IsIn(USER_SORT_FIELDS)
  declare sortBy?: (typeof USER_SORT_FIELDS)[number];
}
