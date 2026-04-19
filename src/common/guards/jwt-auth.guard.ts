import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenExpiredError, verify } from 'jsonwebtoken';

import type { TokenPayload } from '../interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & { user?: TokenPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (this.isPublicRoute(request)) {
      return true;
    }

    const authorization = request.header('authorization');
    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [scheme, token, ...rest] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token || rest.length > 0) {
      throw new UnauthorizedException('Authorization header must use Bearer scheme');
    }

    try {
      const payload = verify(token, this.accessSecret) as TokenPayload;
      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Access token has expired');
      }

      throw new UnauthorizedException('Access token is invalid');
    }
  }

  private get accessSecret(): string {
    return process.env.JWT_SECRET ?? 'development_access_token_secret';
  }

  private isPublicRoute(request: Request): boolean {
    const path = request.path;

    return (
      request.method === 'OPTIONS' ||
      path === '/' ||
      path.startsWith('/doc') ||
      path === '/auth/signup' ||
      path === '/auth/login' ||
      path === '/auth/refresh'
    );
  }
}
