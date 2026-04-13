export interface AuthSessionProps {
  id: string;
  tenantId: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export class AuthSessionEntity {
  constructor(private readonly data: AuthSessionProps) {}

  toJSON(): AuthSessionProps {
    return this.data;
  }
}