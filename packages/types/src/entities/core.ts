export interface Tenant {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "agent" | "viewer";
  createdAt: Date;
}

export interface AuthSession {
  id: string;
  tenantId: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
  model: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  tenantId: string;
  channel: "web" | "whatsapp" | "email" | "api";
  subject: string;
  status: "open" | "closed" | "waiting";
  createdAt: Date;
}

export interface Message {
  id: string;
  tenantId: string;
  conversationId: string;
  senderType: "user" | "agent" | "system";
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  trigger: string;
  isActive: boolean;
  definition: Record<string, unknown>;
  createdAt: Date;
}

export interface WorkflowRun {
  id: string;
  tenantId: string;
  workflowId: string;
  status: "queued" | "running" | "completed" | "failed";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  tenantId: string;
  conversationId: string;
  title: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved";
  createdAt: Date;
}

export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  source: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}