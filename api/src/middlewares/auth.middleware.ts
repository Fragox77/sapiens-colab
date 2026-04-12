import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";
import { UserRole } from "../constants/roles";

export function protect(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No autorizado", 401));
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  req.user = {
    userId: decoded.userId,
    role: decoded.role
  };

  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("No autorizado", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("No tienes permisos para esta acción", 403));
    }

    next();
  };
}
