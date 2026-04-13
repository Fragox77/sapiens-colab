import { DatabaseClient } from "@sapiens/shared";
import { Conversation } from "@sapiens/types";
import { ConversationRepository } from "../application/ConversationService";

export class ConversationRepositoryPg implements ConversationRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(input: Omit<Conversation, "id" | "createdAt">): Promise<Conversation> {
    const result = await this.db.query<Conversation>(
      `INSERT INTO conversations (tenant_id, channel, subject, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tenant_id AS "tenantId", channel, subject, status, created_at AS "createdAt"`,
      [input.tenantId, input.channel, input.subject, input.status]
    );
    return result.rows[0];
  }

  async findById(tenantId: string, id: string): Promise<Conversation | null> {
    const result = await this.db.query<Conversation>(
      `SELECT id, tenant_id AS "tenantId", channel, subject, status, created_at AS "createdAt"
       FROM conversations
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id]
    );
    return result.rows[0] || null;
  }

  async listByTenant(tenantId: string): Promise<Conversation[]> {
    const result = await this.db.query<Conversation>(
      `SELECT id, tenant_id AS "tenantId", channel, subject, status, created_at AS "createdAt"
       FROM conversations
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }
}
