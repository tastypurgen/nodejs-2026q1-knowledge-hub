import { ApiProperty } from '@nestjs/swagger';

import { ArticleStatus } from '../../common/enums/article-status.enum';

export interface Article {
  id: string;
  title: string;
  content: string;
  status: ArticleStatus;
  authorId: string | null;
  categoryId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export class ArticleResponseDto implements Article {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: ArticleStatus })
  status!: ArticleStatus;

  @ApiProperty({ nullable: true })
  authorId!: string | null;

  @ApiProperty({ nullable: true })
  categoryId!: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  createdAt!: number;

  @ApiProperty()
  updatedAt!: number;

  constructor(article: Article) {
    Object.assign(this, article);
  }
}
