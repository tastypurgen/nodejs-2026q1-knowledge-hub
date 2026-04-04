import { ApiProperty } from '@nestjs/swagger';

export interface Comment {
  id: string;
  content: string;
  articleId: string;
  authorId: string | null;
  createdAt: number;
}

export class CommentResponseDto implements Comment {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  articleId!: string;

  @ApiProperty({ nullable: true })
  authorId!: string | null;

  @ApiProperty()
  createdAt!: number;

  constructor(comment: Comment) {
    Object.assign(this, comment);
  }
}
