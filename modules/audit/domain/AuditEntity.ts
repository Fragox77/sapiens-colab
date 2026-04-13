import { AuditLog } from "@sapiens/types";

export class AuditEntity {
  constructor(private readonly data: AuditLog) {}

  toJSON(): AuditLog {
    return this.data;
  }
}
