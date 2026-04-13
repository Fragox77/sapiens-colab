import { Request, Response } from "express";
import { WorkflowService } from "../application/WorkflowService";

export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  async trigger(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const count = await this.service.triggerWorkflows(tenantId, req.body.trigger, req.body.payload || {});
    res.json({ triggered: count });
  }
}
