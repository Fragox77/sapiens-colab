import { DatabaseClient } from "@sapiens/shared";
import { Tenant } from "@sapiens/types";
import { TenantRepository } from "../application/TenantService";

export class TenantRepositoryPg implements TenantRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<Tenant | null> {
    const result = await this.db.query<Tenant>(
      "SELECT id, slug, name, created_at AS \"createdAt\" FROM tenants WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const result = await this.db.query<Tenant>(
      "SELECT id, slug, name, created_at AS \"createdAt\" FROM tenants WHERE slug = $1",
      [slug]
    );
    return result.rows[0] || null;
  }

  async create(input: { slug: string; name: string }): Promise<Tenant> {
    const result = await this.db.query<Tenant>(
      `INSERT INTO tenants (slug, name)
       VALUES ($1, $2)
       RETURNING id, slug, name, created_at AS "createdAt"`,
      [input.slug, input.name]
    );
    return result.rows[0];
  }
}
