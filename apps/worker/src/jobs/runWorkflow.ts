import { QueuedEvent, RunWorkflowPayload } from "../types/jobs";

function parsePayload(raw: string): QueuedEvent<RunWorkflowPayload> {
  const parsed = JSON.parse(raw) as QueuedEvent<RunWorkflowPayload>;
  if (!parsed?.payload?.workflowId || !parsed?.payload?.trigger) {
    throw new Error("Invalid runWorkflow payload");
  }
  return parsed;
}

export async function runWorkflowJob(payload: string): Promise<void> {
  const event = parsePayload(payload);

  // Placeholder for workflow execution engine.
  // eslint-disable-next-line no-console
  console.log("runWorkflowJob", {
    tenantId: event.tenantId,
    workflowId: event.payload.workflowId,
    trigger: event.payload.trigger
  });
}