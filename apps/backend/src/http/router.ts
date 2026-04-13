import { Router } from "express";

export const router = Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    tenantId: req.headers["x-tenant-id"],
    service: "openclaw-backend"
  });
});