import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great explanation of global pipes.' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ example: '78f5c3cf-b753-413d-9cc9-f362ec1fe42b' })
  @IsUUID('4')
  articleId!: string;

  @ApiPropertyOptional({ nullable: true, example: '78f5c3cf-b753-413d-9cc9-f362ec1fe42b' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID('4')
  authorId?: string | null;
}
