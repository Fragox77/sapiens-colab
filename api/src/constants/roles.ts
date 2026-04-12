export const ROLES = {
  ADMIN: "admin",
  DESIGNER: "designer",
  CLIENT: "client"
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const allowedRoles = Object.values(ROLES);
