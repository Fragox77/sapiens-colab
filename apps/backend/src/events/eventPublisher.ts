import { EventBus, EventQueueBridge } from "@sapiens/shared";

export function attachEventQueueBridge(eventBus: EventBus, bridge: EventQueueBridge): void {
  eventBus.subscribe("message.received", async (event) => {
    await bridge.forward(event);
  });

  eventBus.subscribe("workflow.triggered", async (event) => {
    await bridge.forward(event);
  });
}