import { DatabaseClient } from "@sapiens/shared";
import { AuthSession } from "@sapiens/types";
import { AuthSessionRepository } from "../application/AuthService";

export class AuthSessionRepositoryPg implements AuthSessionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(input: Omit<AuthSession, "id" | "createdAt">): Promise<AuthSession> {
    const result = await this.db.query<AuthSession>(
      `INSERT INTO auth_sessions (tenant_id, user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id,
                 tenant_id        AS "tenantId",
                 user_id          AS "userId",
                 refresh_token_hash AS "refreshTokenHash",
                 expires_at       AS "expiresAt",
                 created_at       AS "createdAt"`,
      [input.tenantId, input.userId, input.refreshTokenHash, input.expiresAt],
    );
    return result.rows[0];
  }

  async findByRefreshTokenHash(tenantId: string, hash: string): Promise<AuthSession | null> {
    const result = await this.db.query<AuthSession>(
      `SELECT id,
              tenant_id          AS "tenantId",
              user_id            AS "userId",
              refresh_token_hash AS "refreshTokenHash",
              expires_at         AS "expiresAt",
              created_at         AS "createdAt"
       FROM auth_sessions
       WHERE tenant_id = $1 AND refresh_token_hash = $2
       LIMIT 1`,
      [tenantId, hash],
    );
    return result.rows[0] || null;
  }

  async deleteById(id: string): Promise<void> {
    await this.db.query("DELETE FROM auth_sessions WHERE id = $1", [id]);
  }
}
