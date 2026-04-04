import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class WriteAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!['POST', 'PUT', 'DELETE'].includes(request.method)) {
      return true;
    }

    const role = request.header('x-user-role');
    if (role === 'viewer') {
      throw new ForbiddenException('Viewer role cannot modify resources');
    }

    return true;
  }
}
