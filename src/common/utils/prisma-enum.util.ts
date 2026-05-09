import { ArticleStatus } from '../enums/article-status.enum';
import { UserRole } from '../enums/user-role.enum';

const roleToPrisma: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'ADMIN',
  [UserRole.EDITOR]: 'EDITOR',
  [UserRole.VIEWER]: 'VIEWER',
};

const roleFromPrisma: Record<string, UserRole> = {
  ADMIN: UserRole.ADMIN,
  EDITOR: UserRole.EDITOR,
  VIEWER: UserRole.VIEWER,
};

const articleStatusToPrisma: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: 'DRAFT',
  [ArticleStatus.PUBLISHED]: 'PUBLISHED',
  [ArticleStatus.ARCHIVED]: 'ARCHIVED',
};

const articleStatusFromPrisma: Record<string, ArticleStatus> = {
  DRAFT: ArticleStatus.DRAFT,
  PUBLISHED: ArticleStatus.PUBLISHED,
  ARCHIVED: ArticleStatus.ARCHIVED,
};

export function toPrismaRole(role: UserRole): string {
  return roleToPrisma[role];
}

export function fromPrismaRole(role: string): UserRole {
  return roleFromPrisma[role] ?? UserRole.VIEWER;
}

export function toPrismaArticleStatus(status: ArticleStatus): string {
  return articleStatusToPrisma[status];
}

export function fromPrismaArticleStatus(status: string): ArticleStatus {
  return articleStatusFromPrisma[status] ?? ArticleStatus.DRAFT;
}
