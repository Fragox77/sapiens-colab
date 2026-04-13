export interface AgentProps {
  id: string;
  tenantId: string;
  name: string;
  model: string;
  isActive: boolean;
  createdAt: Date;
}

export class AgentEntity {
  constructor(private readonly data: AgentProps) {}

  toJSON(): AgentProps {
    return this.data;
  }
}