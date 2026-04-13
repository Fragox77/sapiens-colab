import { AuditLog } from "@sapiens/types";

export interface AuditRepository {
  insert(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;
}

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async logEvent(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    return this.repository.insert(input);
  }
}
