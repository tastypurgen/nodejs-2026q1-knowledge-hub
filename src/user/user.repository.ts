import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { User } from './models/user.model';

@Injectable()
export class UserRepository {
  private readonly users: User[] = [];

  findAll(): User[] {
    return [...this.users];
  }

  findById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  create(data: Pick<User, 'login' | 'password' | 'role'>): User {
    const timestamp = Date.now();
    const user: User = {
      id: randomUUID(),
      login: data.login,
      password: data.password,
      role: data.role,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.users.push(user);
    return user;
  }

  update(id: string, data: Partial<Pick<User, 'password' | 'role' | 'login'>>): User | undefined {
    const user = this.findById(id);
    if (!user) {
      return undefined;
    }

    Object.assign(user, data, { updatedAt: Date.now() });
    return user;
  }

  delete(id: string): User | undefined {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      return undefined;
    }

    const [deletedUser] = this.users.splice(index, 1);
    return deletedUser;
  }
}
