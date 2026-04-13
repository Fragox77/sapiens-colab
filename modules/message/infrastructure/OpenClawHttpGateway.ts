import { OpenClawGateway } from "../interfaces/OpenClawGateway";

export class OpenClawHttpGateway implements OpenClawGateway {
  async generateReply(input: { tenantId: string; prompt: string }): Promise<{ text: string }> {
    // Integrate OpenClaw API in this adapter.
    return { text: `[OpenClaw placeholder] ${input.prompt}` };
  }
}
