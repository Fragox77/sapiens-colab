import bcrypt from "bcryptjs";
import { User } from "@sapiens/types";

export interface UserRepository {
  create(input: Omit<User, "id" | "createdAt"> & { passwordHash: string }): Promise<User>;
  findById(tenantId: string, id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<(User & { passwordHash: string }) | null>;
  listByTenant(tenantId: string): Promise<User[]>;
}

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async createUser(
    tenantId: string,
    input: { email: string; name: string; role: User["role"]; password: string },
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, 12);
    return this.repository.create({ tenantId, ...input, passwordHash });
  }

  async getUser(tenantId: string, userId: string): Promise<User | null> {
    return this.repository.findById(tenantId, userId);
  }

  async listByTenant(tenantId: string): Promise<User[]> {
    return this.repository.listByTenant(tenantId);
  }

  /** Expone el repositorio para que AuthService pueda usarlo como UserCredentialRepository. */
  get credentialRepository(): UserRepository {
    return this.repository;
  }
}
