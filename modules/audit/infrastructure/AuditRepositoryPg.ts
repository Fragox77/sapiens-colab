import { DatabaseClient } from "@sapiens/shared";
import { AuditLog } from "@sapiens/types";
import { AuditRepository } from "../application/AuditService";

export class AuditRepositoryPg implements AuditRepository {
  constructor(private readonly db: DatabaseClient) {}

  async insert(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    const result = await this.db.query<AuditLog>(
      `INSERT INTO audit_logs (tenant_id, actor_id, action, entity, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tenant_id AS "tenantId", actor_id AS "actorId", action, entity, entity_id AS "entityId", metadata, created_at AS "createdAt"`,
      [
        input.tenantId,
        input.actorId,
        input.action,
        input.entity,
        input.entityId,
        JSON.stringify(input.metadata)
      ]
    );
    return result.rows[0];
  }
}
