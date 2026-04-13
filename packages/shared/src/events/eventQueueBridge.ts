import { queueNames } from "@sapiens/config";
import { DomainEvent, DomainEventName } from "./domainEvents";

export interface QueuePublisher {
  enqueue(queueName: string, payload: string): Promise<void>;
}

function resolveQueue(eventName: DomainEventName): string | null {
  if (eventName === "message.received") {
    return queueNames.processMessage;
  }

  if (eventName === "workflow.triggered") {
    return queueNames.runWorkflow;
  }

  return null;
}

export class EventQueueBridge {
  constructor(private readonly publisher: QueuePublisher) {}

  async forward(event: DomainEvent): Promise<void> {
    const queueName = resolveQueue(event.name);
    if (!queueName) {
      return;
    }

    await this.publisher.enqueue(
      queueName,
      JSON.stringify({
        eventName: event.name,
        tenantId: event.tenantId,
        occurredAt: event.occurredAt,
        payload: event.payload
      })
    );
  }
}