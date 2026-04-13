import { ProcessMessagePayload, QueuedEvent } from "../types/jobs";

function parsePayload(raw: string): QueuedEvent<ProcessMessagePayload> {
  const parsed = JSON.parse(raw) as QueuedEvent<ProcessMessagePayload>;
  if (!parsed?.payload?.messageId || !parsed?.payload?.conversationId) {
    throw new Error("Invalid processMessage payload");
  }
  return parsed;
}

export async function processMessageJob(payload: string): Promise<void> {
  const event = parsePayload(payload);

  // Placeholder for OpenClaw processing pipeline.
  // eslint-disable-next-line no-console
  console.log("processMessageJob", {
    tenantId: event.tenantId,
    messageId: event.payload.messageId,
    conversationId: event.payload.conversationId
  });
}