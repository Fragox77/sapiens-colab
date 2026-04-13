import { DatabaseClient } from "@sapiens/shared";
import { Message } from "@sapiens/types";
import { MessageRepository } from "../application/MessageService";

export class MessageRepositoryPg implements MessageRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(input: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const result = await this.db.query<Message>(
      `INSERT INTO messages (tenant_id, conversation_id, sender_type, content, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tenant_id AS "tenantId", conversation_id AS "conversationId", sender_type AS "senderType", content, metadata, created_at AS "createdAt"`,
      [input.tenantId, input.conversationId, input.senderType, input.content, JSON.stringify(input.metadata)]
    );
    return result.rows[0];
  }
}
