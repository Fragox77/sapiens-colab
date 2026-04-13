export interface QueuedEvent<TPayload = Record<string, unknown>> {
  eventName: string;
  tenantId: string;
  occurredAt: string | Date;
  payload: TPayload;
}

export interface ProcessMessagePayload {
  messageId: string;
  conversationId: string;
}

export interface RunWorkflowPayload {
  workflowId: string;
  trigger: string;
  input: Record<string, unknown>;
}