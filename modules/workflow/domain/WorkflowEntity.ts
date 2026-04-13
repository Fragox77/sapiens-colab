import { Workflow } from "@sapiens/types";

export class WorkflowEntity {
  constructor(private readonly data: Workflow) {}

  toJSON(): Workflow {
    return this.data;
  }
}
