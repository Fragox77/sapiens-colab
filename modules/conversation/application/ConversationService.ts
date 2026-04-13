import { EventBus } from "@sapiens/shared";
import { Conversation } from "@sapiens/types";

export interface ConversationRepository {
  create(input: Omit<Conversation, "id" | "createdAt">): Promise<Conversation>;
  findById(tenantId: string, id: string): Promise<Conversation | null>;
  listByTenant(tenantId: string): Promise<Conversation[]>;
}

export class ConversationService {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly eventBus: EventBus
  ) {}

  async createConversation(input: Omit<Conversation, "id" | "createdAt">): Promise<Conversation> {
    const conversation = await this.repository.create(input);
    await this.eventBus.publish({
      name: "conversation.created",
      tenantId: conversation.tenantId,
      occurredAt: new Date(),
      payload: { conversationId: conversation.id }
    });
    return conversation;
  }

  async getConversation(tenantId: string, conversationId: string): Promise<Conversation | null> {
    return this.repository.findById(tenantId, conversationId);
  }

  async listConversations(tenantId: string): Promise<Conversation[]> {
    return this.repository.listByTenant(tenantId);
  }
}
