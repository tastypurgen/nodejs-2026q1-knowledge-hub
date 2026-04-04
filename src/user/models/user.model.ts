import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../common/enums/user-role.enum';

export interface User {
  id: string;
  login: string;
  password: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  login!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  createdAt!: number;

  @ApiProperty()
  updatedAt!: number;

  constructor(user: Omit<User, 'password'>) {
    Object.assign(this, user);
  }
}

export function toUserResponse(user: User): UserResponseDto {
  const { password: _password, ...safeUser } = user;
  return new UserResponseDto(safeUser);
}
