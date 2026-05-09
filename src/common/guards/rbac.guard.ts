import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../enums/user-role.enum';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (
      this.isPublicRoute(request) ||
      request.path === '/auth/logout' ||
      request.method === 'GET'
    ) {
      return true;
    }

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authenticated user is required');
    }

    if (this.isReadOnlyPost(request)) {
      return true;
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.role === UserRole.VIEWER) {
      throw new ForbiddenException('Viewer role has read-only access');
    }

    return this.canEditorActivate(request, user);
  }

  private async canEditorActivate(
    request: AuthenticatedRequest,
    user: AuthenticatedUser,
  ): Promise<boolean> {
    const path = request.path;

    if (path.startsWith('/category') || path.startsWith('/user')) {
      throw new ForbiddenException('Editor role cannot manage this resource');
    }

    if (path === '/article' && request.method === 'POST') {
      this.ensureOwnAuthor(request, user.userId, 'article');
      return true;
    }

    if (path.startsWith('/article/') && request.method === 'PUT') {
      const articleId = this.getResourceId(path);
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { authorId: true },
      });

      if (!article || article.authorId !== user.userId) {
        throw new ForbiddenException('Editor role can update only own articles');
      }

      if (
        request.body?.authorId !== undefined &&
        request.body.authorId !== user.userId
      ) {
        throw new ForbiddenException('Editor role cannot transfer articles');
      }

      return true;
    }

    if (path.startsWith('/article/') && request.method === 'DELETE') {
      const articleId = this.getResourceId(path);
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { authorId: true },
      });

      if (!article || article.authorId !== user.userId) {
        throw new ForbiddenException('Editor role can delete only own articles');
      }

      return true;
    }

    if (path === '/comment' && request.method === 'POST') {
      this.ensureOwnAuthor(request, user.userId, 'comment');
      return true;
    }

    if (path.startsWith('/comment/') && request.method === 'DELETE') {
      const commentId = this.getResourceId(path);
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true },
      });

      if (!comment || comment.authorId !== user.userId) {
        throw new ForbiddenException('Editor role can delete only own comments');
      }

      return true;
    }

    throw new ForbiddenException('Editor role is not allowed to perform this action');
  }

  private ensureOwnAuthor(
    request: AuthenticatedRequest,
    userId: string,
    resource: 'article' | 'comment',
  ): void {
    if (!request.body) {
      request.body = {};
    }

    if (request.body.authorId === undefined || request.body.authorId === null) {
      request.body.authorId = userId;
      return;
    }

    if (request.body.authorId !== userId) {
      throw new ForbiddenException(`Editor role can create only own ${resource}s`);
    }
  }

  private getResourceId(path: string): string {
    return path.split('/')[2] ?? '';
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

  private isReadOnlyPost(request: Request): boolean {
    return (
      request.method === 'POST' &&
      (request.path === '/ai/rag/search' || request.path === '/ai/rag/chat')
    );
  }
}
