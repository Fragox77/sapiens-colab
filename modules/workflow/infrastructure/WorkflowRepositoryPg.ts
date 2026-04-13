import { DatabaseClient } from "@sapiens/shared";
import { Workflow } from "@sapiens/types";
import { WorkflowRepository } from "../application/WorkflowService";

export class WorkflowRepositoryPg implements WorkflowRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findActiveByTrigger(tenantId: string, trigger: string): Promise<Workflow[]> {
    const result = await this.db.query<Workflow>(
      `SELECT id, tenant_id AS "tenantId", name, trigger, is_active AS "isActive", definition, created_at AS "createdAt"
       FROM workflows
       WHERE tenant_id = $1 AND trigger = $2 AND is_active = true`,
      [tenantId, trigger]
    );
    return result.rows;
  }
}
