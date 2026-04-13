import { EventBus } from "@sapiens/shared";
import { Message } from "@sapiens/types";
import { OpenClawGateway } from "../interfaces/OpenClawGateway";

export interface MessageRepository {
  create(input: Omit<Message, "id" | "createdAt">): Promise<Message>;
}

export class MessageService {
  constructor(
    private readonly repository: MessageRepository,
    private readonly eventBus: EventBus,
    private readonly openClawGateway: OpenClawGateway
  ) {}

  async addMessage(input: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const message = await this.repository.create(input);

    await this.eventBus.publish({
      name: "message.received",
      tenantId: message.tenantId,
      occurredAt: new Date(),
      payload: { messageId: message.id, conversationId: message.conversationId }
    });

    if (message.senderType === "user") {
      await this.openClawGateway.generateReply({
        tenantId: message.tenantId,
        prompt: message.content
      });
    }

    return message;
  }
}
