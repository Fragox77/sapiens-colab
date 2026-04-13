import { DomainEvent } from "./domainEvents";

export type EventHandler = (event: DomainEvent) => Promise<void> | void;

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: DomainEvent["name"], handler: EventHandler): void;
}

export class InMemoryEventBus implements EventBus {
  private handlers = new Map<DomainEvent["name"], EventHandler[]>();

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.name) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  subscribe(eventName: DomainEvent["name"], handler: EventHandler): void {
    const previous = this.handlers.get(eventName) || [];
    this.handlers.set(eventName, [...previous, handler]);
  }
}