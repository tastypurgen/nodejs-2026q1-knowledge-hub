import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CommentListQueryDto } from './dto/comment-list-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentService } from './comment.service';

@ApiTags('comment')
@ApiBearerAuth()
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  findAll(@Query() query: CommentListQueryDto) {
    return this.commentService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.commentService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCommentDto) {
    return this.commentService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.commentService.remove(id);
  }
}
