import 'dotenv/config';

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  const user = process.env.POSTGRES_USER ?? 'postgres';
  const password = process.env.POSTGRES_PASSWORD ?? 'postgres';
  const database = process.env.POSTGRES_DB ?? 'knowledge_hub';
  const port = process.env.POSTGRES_PORT ?? '5432';

  process.env.DATABASE_URL = `postgresql://${user}:${password}@localhost:${port}/${database}?schema=public&connection_limit=10&pool_timeout=5`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
