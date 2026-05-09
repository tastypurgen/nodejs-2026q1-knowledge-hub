import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { RagConfigService } from './rag-config.service';
import type { ConversationMessage } from './rag.types';

@Injectable()
export class ConversationMemoryService {
  private readonly conversations = new Map<string, ConversationMessage[]>();

  constructor(private readonly config: RagConfigService) {}

  createOrGetConversationId(conversationId?: string): string {
    const id = conversationId ?? randomUUID();
    if (!this.conversations.has(id)) {
      this.conversations.set(id, []);
    }

    return id;
  }

  addMessage(conversationId: string, message: Omit<ConversationMessage, 'createdAt'>): void {
    const messages = this.conversations.get(conversationId) ?? [];
    messages.push({ ...message, createdAt: Date.now() });

    const maxMessages = this.config.conversationMaxMessages;
    this.conversations.set(conversationId, messages.slice(-maxMessages));
  }

  getHistory(conversationId: string): ConversationMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }
}
