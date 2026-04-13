import { EventBus } from "@sapiens/shared";

export class TicketService {
  constructor(private readonly eventBus: EventBus) {}

  async createTicket(tenantId: string, conversationId: string): Promise<void> {
    await this.eventBus.publish({
      name: "ticket.created",
      tenantId,
      occurredAt: new Date(),
      payload: { conversationId }
    });
  }
}
