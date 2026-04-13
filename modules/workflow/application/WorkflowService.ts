import { EventBus } from "@sapiens/shared";
import { Workflow } from "@sapiens/types";

export interface WorkflowRepository {
  findActiveByTrigger(tenantId: string, trigger: string): Promise<Workflow[]>;
}

export class WorkflowService {
  constructor(
    private readonly repository: WorkflowRepository,
    private readonly eventBus: EventBus
  ) {}

  async triggerWorkflows(tenantId: string, trigger: string, payload: Record<string, unknown>): Promise<number> {
    const workflows = await this.repository.findActiveByTrigger(tenantId, trigger);

    for (const workflow of workflows) {
      await this.eventBus.publish({
        name: "workflow.triggered",
        tenantId,
        occurredAt: new Date(),
        payload: { workflowId: workflow.id, trigger, input: payload }
      });
    }

    return workflows.length;
  }
}
