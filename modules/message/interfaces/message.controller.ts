import { Request, Response } from "express";
import { MessageService } from "../application/MessageService";

export class MessageController {
  constructor(private readonly service: MessageService) {}

  async create(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const message = await this.service.addMessage({
      tenantId,
      conversationId: req.body.conversationId,
      senderType: req.body.senderType,
      content: req.body.content,
      metadata: req.body.metadata || {}
    });
    res.status(201).json({ data: message });
  }
}
