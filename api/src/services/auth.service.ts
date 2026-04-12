import { z } from "zod";
import { AppError } from "../utils/AppError";
import { User } from "../models/User";
import { ROLES, UserRole } from "../constants/roles";
import { signToken } from "../utils/jwt";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum([ROLES.ADMIN, ROLES.DESIGNER, ROLES.CLIENT]).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export async function registerUser(input: unknown): Promise<AuthResponse> {
  const parsed = registerSchema.parse(input);

  const existingUser = await User.findOne({ email: parsed.email });
  if (existingUser) {
    throw new AppError("El correo ya está registrado", 409);
  }

  const user = await User.create({
    name: parsed.name,
    email: parsed.email,
    password: parsed.password,
    role: parsed.role || ROLES.CLIENT
  });

  const token = signToken({
    userId: user.id,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

export async function loginUser(input: unknown): Promise<AuthResponse> {
  const parsed = loginSchema.parse(input);

  const user = await User.findOne({ email: parsed.email }).select("+password");
  if (!user) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const isPasswordValid = await user.comparePassword(parsed.password);
  if (!isPasswordValid) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const token = signToken({
    userId: user.id,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}
