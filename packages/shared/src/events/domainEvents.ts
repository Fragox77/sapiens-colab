export type DomainEventName =
  | "message.received"
  | "conversation.created"
  | "workflow.triggered"
  | "ticket.created";

export interface DomainEventPayloadMap {
  "message.received": {
    messageId: string;
    conversationId: string;
  };
  "conversation.created": {
    conversationId: string;
  };
  "workflow.triggered": {
    workflowId: string;
    trigger: string;
    input: Record<string, unknown>;
  };
  "ticket.created": {
    conversationId: string;
  };
}

export interface DomainEvent<TName extends DomainEventName = DomainEventName> {
  name: TName;
  tenantId: string;
  occurredAt: Date;
  payload: DomainEventPayloadMap[TName];
}