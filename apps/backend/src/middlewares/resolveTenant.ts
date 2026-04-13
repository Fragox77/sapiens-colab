import { NextFunction, Request, Response } from "express";

const FALLBACK_TENANT = "default-tenant";

export function resolveTenant(request: Request): string {
  const fromHeader = request.headers["x-tenant-id"];
  if (typeof fromHeader === "string" && fromHeader.trim().length > 0) {
    return fromHeader.trim();
  }

  const fromSubdomain = request.hostname.split(".")[0];
  if (fromSubdomain && fromSubdomain !== "localhost") {
    return fromSubdomain;
  }

  return FALLBACK_TENANT;
}

export function tenantMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.headers["x-tenant-id"] = resolveTenant(req);
  next();
}