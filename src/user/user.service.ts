import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';

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

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.create({
      login: dto.login,
      password: dto.password,
      role: dto.role,
    });

    return toUserResponse(user);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (existingUser.password !== dto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const updatedUser = await this.userRepository.update(id, { password: dto.newPassword });
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
}
