export class UserService {
  async listByTenant(tenantId: string): Promise<{ tenantId: string }[]> {
    return [{ tenantId }];
  }
}
