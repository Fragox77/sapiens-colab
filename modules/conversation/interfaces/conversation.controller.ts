import { Request, Response } from "express";
import { ConversationService } from "../application/ConversationService";

export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  async list(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const conversations = await this.service.listConversations(tenantId);
    res.json({ data: conversations });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const conversation = await this.service.getConversation(tenantId, String(req.params.id || ""));
    res.json({ data: conversation });
  }

  async create(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const conversation = await this.service.createConversation({
      tenantId,
      channel: req.body.channel,
      subject: req.body.subject,
      status: "open"
    });
    res.status(201).json({ data: conversation });
  }
}
