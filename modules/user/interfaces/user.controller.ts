import { Request, Response } from "express";
import { UserService } from "../application/UserService";

export class UserController {
  constructor(private readonly service: UserService) {}

  async list(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const users = await this.service.listByTenant(tenantId);
    res.json({ data: users });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const user = await this.service.getUser(tenantId, String(req.params["id"] || ""));
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json({ data: user });
  }

  async create(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const { email, name, role, password } = req.body as {
      email: string;
      name: string;
      role: "owner" | "admin" | "agent" | "viewer";
      password: string;
    };
    if (!email || !name || !role || !password) {
      res.status(400).json({ error: "email, name, role y password son requeridos" });
      return;
    }
    const user = await this.service.createUser(tenantId, { email, name, role, password });
    res.status(201).json({ data: user });
  }
}
