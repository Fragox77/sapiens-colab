import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getCurrentUser, loginUser, registerUser } from "../services/auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);

  res.status(201).json({
    success: true,
    message: "Usuario registrado correctamente",
    data: result
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    success: true,
    message: "Inicio de sesión exitoso",
    data: result
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.userId);

  res.status(200).json({
    success: true,
    data: user
  });
});
