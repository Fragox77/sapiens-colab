import { Router } from "express";
import { ConversationController } from "./conversation.controller";

export function buildConversationRoutes(controller: ConversationController): Router {
  const router = Router();

  router.get("/", (req, res) => void controller.list(req, res));
  router.get("/:id", (req, res) => void controller.getById(req, res));
  router.post("/", (req, res) => void controller.create(req, res));

  return router;
}