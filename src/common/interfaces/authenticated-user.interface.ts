import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  userId: string;
  login: string;
  role: UserRole;
}

export interface TokenPayload extends AuthenticatedUser {
  iat?: number;
  exp?: number;
}
