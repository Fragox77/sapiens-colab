import express from "express";
import { tenantMiddleware } from "./middlewares/resolveTenant";
import { router } from "./http/router";

export function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(tenantMiddleware);
  app.use("/api", router);
  return app;
}