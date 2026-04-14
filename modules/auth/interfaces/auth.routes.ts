import { Router } from "express";
import { AuthController } from "./auth.controller";

export function buildAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post("/login",   (req, res) => void controller.login(req, res));
  router.post("/refresh", (req, res) => void controller.refresh(req, res));
  router.post("/logout",  (req, res) => void controller.logout(req, res));

  return router;
}
