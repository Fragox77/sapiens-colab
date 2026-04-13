import { Router } from "express";
import { TenantController } from "./tenant.controller";

export function buildTenantRoutes(controller: TenantController): Router {
  const router = Router();

  router.get("/me", (req, res) => void controller.getTenant(req, res));
  router.get("/slug/:slug", (req, res) => void controller.getBySlug(req, res));
  router.post("/", (req, res) => void controller.create(req, res));

  return router;
}