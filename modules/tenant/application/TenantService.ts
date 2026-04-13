import { Tenant } from "@sapiens/types";

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  create(input: { slug: string; name: string }): Promise<Tenant>;
}

export class TenantService {
  constructor(private readonly repository: TenantRepository) {}

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.repository.findById(tenantId);
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.repository.findBySlug(slug);
  }

  async createTenant(input: { slug: string; name: string }): Promise<Tenant> {
    return this.repository.create(input);
  }
}
