export const queueNames = {
  processMessage: "queue:processMessage",
  runWorkflow: "queue:runWorkflow"
} as const;

export const eventNames = {
  messageReceived: "message.received",
  conversationCreated: "conversation.created",
  workflowTriggered: "workflow.triggered",
  ticketCreated: "ticket.created"
} as const;