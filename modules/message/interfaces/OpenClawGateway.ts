export interface OpenClawGateway {
  generateReply(input: { tenantId: string; prompt: string }): Promise<{ text: string }>;
}
