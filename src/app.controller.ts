import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return { message: 'Knowledge Hub API is running' };
  }
}
