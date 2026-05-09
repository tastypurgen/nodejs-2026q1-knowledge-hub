import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ChunkingService } from './chunking.service';
import { ConversationMemoryService } from './conversation-memory.service';
import { GeminiService } from './gemini.service';
import { QdrantService } from './qdrant.service';
import { RagConfigService } from './rag-config.service';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

@Module({
  imports: [PrismaModule],
  controllers: [RagController],
  providers: [
    RagConfigService,
    ChunkingService,
    GeminiService,
    QdrantService,
    ConversationMemoryService,
    RagService,
  ],
})
export class RagModule {}
