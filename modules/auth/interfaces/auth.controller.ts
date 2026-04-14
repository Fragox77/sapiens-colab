import { Request, Response } from "express";
import { AuthService } from "../application/AuthService";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ error: "email y password son requeridos" });
      return;
    }
    try {
      const tokens = await this.service.login(tenantId, email, password);
      res.json({ data: tokens });
    } catch (err: unknown) {
      res.status(401).json({ error: err instanceof Error ? err.message : "Error de autenticación" });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const tenantId = String(req.headers["x-tenant-id"] || "");
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      res.status(400).json({ error: "refreshToken es requerido" });
      return;
    }
    try {
      const tokens = await this.service.refresh(tenantId, refreshToken);
      res.json({ data: tokens });
    } catch (err: unknown) {
      res.status(401).json({ error: err instanceof Error ? err.message : "Token inválido" });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.body as { sessionId: string };
    if (!sessionId) {
      res.status(400).json({ error: "sessionId es requerido" });
      return;
    }
    await this.service.logout(sessionId);
    res.json({ ok: true });
  }
}
