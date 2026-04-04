import { ApiProperty } from '@nestjs/swagger';

export interface Category {
  id: string;
  name: string;
  description: string;
}

export class CategoryResponseDto implements Category {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  constructor(category: Category) {
    Object.assign(this, category);
  }
}
