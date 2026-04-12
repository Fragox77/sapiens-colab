export type UserRole = "admin" | "designer" | "client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
