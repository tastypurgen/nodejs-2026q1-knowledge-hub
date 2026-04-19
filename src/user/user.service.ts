import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compare, hash } from 'bcryptjs';

import { applyCollectionQuery } from '../common/utils/collection-query.util';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdatePasswordDto } from './dto/update-password.dto';
import type { UserListQueryDto } from './dto/user-list-query.dto';
import { toUserResponse, type UserResponseDto } from './models/user.model';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  async findAll(query: UserListQueryDto) {
    const users = (await this.userRepository.findAll()).map(toUserResponse);
    return applyCollectionQuery(users, query);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return toUserResponse(user);
  }

  async findByIdForAuth(id: string) {
    return this.userRepository.findById(id);
  }

  async findByLoginWithPassword(login: string) {
    return this.userRepository.findByLogin(login);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.create({
        login: dto.login,
        password: await this.hashPassword(dto.password),
        role: dto.role,
      });

      return toUserResponse(user);
    } catch (error) {
      if (this.isUniqueLoginError(error)) {
        throw new BadRequestException('Login is already taken');
      }

      throw error;
    }
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<UserResponseDto> {
    if (!dto.oldPassword && !dto.newPassword && !dto.role) {
      throw new BadRequestException('Password or role update data is required');
    }

    if ((dto.oldPassword && !dto.newPassword) || (!dto.oldPassword && dto.newPassword)) {
      throw new BadRequestException('Both oldPassword and newPassword are required');
    }

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    let password: string | undefined;
    if (dto.oldPassword && dto.newPassword) {
      const passwordMatches = await this.verifyPassword(
        existingUser.id,
        dto.oldPassword,
        existingUser.password,
      );
      if (!passwordMatches) {
        throw new ForbiddenException('Old password is incorrect');
      }

      password = await this.hashPassword(dto.newPassword);
    }

    const updatedUser = await this.userRepository.update(id, {
      password,
      role: dto.role,
    });
    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return toUserResponse(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const deletedUser = await this.userRepository.delete(id);
    if (!deletedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Prisma's onDelete: Cascade / SetNull constraints will handle deleting
    // or removing relations, so manual cleanup calls are no longer needed here.
    // this.articleService.clearAuthorByUser(id);
    // this.commentService.removeByAuthor(id);
  }

  async verifyPassword(
    userId: string,
    plainPassword: string,
    storedPassword: string,
  ): Promise<boolean> {
    if (this.isBcryptHash(storedPassword)) {
      return compare(plainPassword, storedPassword);
    }

    const matchesLegacyPlainPassword = plainPassword === storedPassword;
    if (matchesLegacyPlainPassword) {
      await this.userRepository.update(userId, {
        password: await this.hashPassword(plainPassword),
      });
    }

    return matchesLegacyPlainPassword;
  }

  private hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  private isBcryptHash(password: string): boolean {
    return /^\$2[aby]\$\d{2}\$/.test(password);
  }

  private isUniqueLoginError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
