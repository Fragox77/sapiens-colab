import { Request, Response } from "express";
import { TenantService } from "../application/TenantService";

export class TenantController {
  constructor(private readonly service: TenantService) {}

  async getTenant(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const tenant = await this.service.getTenant(tenantId);
    res.json({ data: tenant });
  }

  async getBySlug(req: Request, res: Response): Promise<void> {
    const tenant = await this.service.getTenantBySlug(String(req.params.slug || ""));
    res.json({ data: tenant });
  }

  async create(req: Request, res: Response): Promise<void> {
    const tenant = await this.service.createTenant({
      slug: String(req.body.slug || ""),
      name: String(req.body.name || "")
    });
    res.status(201).json({ data: tenant });
  }
}
