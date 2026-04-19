import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, SignOptions, TokenExpiredError, sign, verify } from 'jsonwebtoken';

import { UserService } from '../user/user.service';
import type { UserResponseDto } from '../user/models/user.model';
import type { AuthCredentialsDto } from './dto/auth-credentials.dto';
import type { TokenPayload } from '../common/interfaces/authenticated-user.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly invalidatedRefreshTokens = new Set<string>();

  constructor(private readonly userService: UserService) {}

  async signup(dto: AuthCredentialsDto): Promise<UserResponseDto> {
    const existingUser = await this.userService.findByLoginWithPassword(dto.login);
    if (existingUser) {
      throw new BadRequestException('Login is already taken');
    }

    return this.userService.create({
      login: dto.login,
      password: dto.password,
    });
  }

  async login(dto: AuthCredentialsDto): Promise<TokenPair> {
    const user = await this.userService.findByLoginWithPassword(dto.login);
    if (!user) {
      throw new ForbiddenException('Authentication failed');
    }

    const passwordMatches = await this.userService.verifyPassword(
      user.id,
      dto.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new ForbiddenException('Authentication failed');
    }

    return this.generateTokenPair({
      userId: user.id,
      login: user.login,
      role: user.role,
    });
  }

  async refresh(refreshToken: unknown): Promise<TokenPair> {
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException('Refresh token is required');
    }

    if (this.invalidatedRefreshTokens.has(refreshToken)) {
      throw new ForbiddenException('Refresh token is invalid');
    }

    let payload: TokenPayload;
    try {
      payload = verify(refreshToken, this.refreshSecret) as TokenPayload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ForbiddenException('Refresh token has expired');
      }

      throw new ForbiddenException('Refresh token is invalid');
    }

    const user = await this.userService.findByIdForAuth(payload.userId);
    if (!user) {
      throw new ForbiddenException('Refresh token user was not found');
    }

    this.invalidatedRefreshTokens.add(refreshToken);

    return this.generateTokenPair({
      userId: user.id,
      login: user.login,
      role: user.role,
    });
  }

  logout(refreshToken: unknown): void {
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException('Refresh token is required');
    }

    this.invalidatedRefreshTokens.add(refreshToken);
  }

  private generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.signToken(payload, this.accessSecret, this.accessTtl),
      refreshToken: this.signToken(payload, this.refreshSecret, this.refreshTtl),
    };
  }

  private signToken(payload: TokenPayload, secret: string, expiresIn: string): string {
    const options: SignOptions = {
      expiresIn: expiresIn as SignOptions['expiresIn'],
    };
    return sign(payload as JwtPayload, secret, options);
  }

  private get accessSecret(): string {
    return process.env.JWT_SECRET ?? 'development_access_token_secret';
  }

  private get refreshSecret(): string {
    return (
      process.env.JWT_REFRESH_SECRET ??
      process.env.JWT_SECRET_REFRESH_KEY ??
      'development_refresh_token_secret'
    );
  }

  private get accessTtl(): string {
    return process.env.JWT_ACCESS_TTL ?? '15m';
  }

  private get refreshTtl(): string {
    return process.env.JWT_REFRESH_TTL ?? '7d';
  }
}
