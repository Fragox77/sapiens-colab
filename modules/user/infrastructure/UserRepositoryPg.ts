import { DatabaseClient } from "@sapiens/shared";
import { User } from "@sapiens/types";
import { UserRepository } from "../application/UserService";

type UserRow = User & { passwordHash: string };

export class UserRepositoryPg implements UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(
    input: Omit<User, "id" | "createdAt"> & { passwordHash: string },
  ): Promise<User> {
    const result = await this.db.query<User>(
      `INSERT INTO users (tenant_id, email, name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id,
                 tenant_id  AS "tenantId",
                 email,
                 name,
                 role,
                 created_at AS "createdAt"`,
      [input.tenantId, input.email, input.name, input.role, input.passwordHash],
    );
    return result.rows[0];
  }

  async findById(tenantId: string, id: string): Promise<User | null> {
    const result = await this.db.query<User>(
      `SELECT id,
              tenant_id  AS "tenantId",
              email,
              name,
              role,
              created_at AS "createdAt"
       FROM users
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id],
    );
    return result.rows[0] || null;
  }

  async findByEmail(tenantId: string, email: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      `SELECT id,
              tenant_id     AS "tenantId",
              email,
              name,
              role,
              password_hash AS "passwordHash",
              created_at    AS "createdAt"
       FROM users
       WHERE tenant_id = $1 AND email = $2
       LIMIT 1`,
      [tenantId, email],
    );
    return result.rows[0] || null;
  }

  async listByTenant(tenantId: string): Promise<User[]> {
    const result = await this.db.query<User>(
      `SELECT id,
              tenant_id  AS "tenantId",
              email,
              name,
              role,
              created_at AS "createdAt"
       FROM users
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId],
    );
    return result.rows;
  }
}
