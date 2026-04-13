import { Tenant } from "@sapiens/types";

export class TenantEntity {
  constructor(private readonly data: Tenant) {}

  get id(): string {
    return this.data.id;
  }

  toJSON(): Tenant {
    return this.data;
  }
}
