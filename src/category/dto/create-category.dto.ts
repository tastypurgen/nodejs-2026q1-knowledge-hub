import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Node.js' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Articles related to Node.js and backend runtime topics' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
