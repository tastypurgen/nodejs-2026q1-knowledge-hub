import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { UserRole } from '../../common/enums/user-role.enum';

export class UpdatePasswordDto {
  @ApiPropertyOptional({ example: 'old-password' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  oldPassword?: string;

  @ApiPropertyOptional({ example: 'new-password' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  newPassword?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
