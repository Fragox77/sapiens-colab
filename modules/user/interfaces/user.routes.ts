import { Router } from "express";
import { UserController } from "./user.controller";

export function buildUserRoutes(controller: UserController): Router {
  const router = Router();

  router.get("/",     (req, res) => void controller.list(req, res));
  router.get("/:id",  (req, res) => void controller.getById(req, res));
  router.post("/",    (req, res) => void controller.create(req, res));

  return router;
}
