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

  findAll(query: UserListQueryDto) {
    const users = this.userRepository.findAll().map(toUserResponse);
    return applyCollectionQuery(users, query);
  }

  findOne(id: string): UserResponseDto {
    const user = this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return toUserResponse(user);
  }

  create(dto: CreateUserDto): UserResponseDto {
    const user = this.userRepository.create({
      login: dto.login,
      password: dto.password,
      role: dto.role,
    });

    return toUserResponse(user);
  }

  updatePassword(id: string, dto: UpdatePasswordDto): UserResponseDto {
    const existingUser = this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (existingUser.password !== dto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }

    const updatedUser = this.userRepository.update(id, { password: dto.newPassword });
    if (!updatedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return toUserResponse(updatedUser);
  }

  remove(id: string): void {
    const deletedUser = this.userRepository.delete(id);
    if (!deletedUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.articleService.clearAuthorByUser(id);
    this.commentService.removeByAuthor(id);
  }
}
