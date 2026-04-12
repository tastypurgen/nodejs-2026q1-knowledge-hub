import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from './models/user.model';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapUser(user: any): User {
    return {
      id: user.id,
      login: user.login,
      password: user.password,
      role: user.role as UserRole,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(this.mapUser);
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapUser(user) : undefined;
  }

  async create(data: Pick<User, 'login' | 'password' | 'role'>): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        login: data.login,
        password: data.password,
        role: data.role as any,
      },
    });
    return this.mapUser(user);
  }

  async update(id: string, data: Partial<Pick<User, 'password' | 'role' | 'login'>>): Promise<User | undefined> {
    const user = await this.findById(id);
    if (!user) {
      return undefined;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        login: data.login,
        password: data.password,
        role: data.role as any,
      },
    });
    return this.mapUser(updated);
  }

  async delete(id: string): Promise<User | undefined> {
    const user = await this.findById(id);
    if (!user) {
      return undefined;
    }

    const [deleted] = await this.prisma.$transaction([
      this.prisma.user.delete({ where: { id } }),
      // Optional: Prisma natively handles onDelete: SetNull for Article.authorId,
      // but explicitly updating for demonstration of complex transaction
      this.prisma.article.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      }),
    ]);

    return this.mapUser(deleted);
  }
}
