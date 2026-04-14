import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthSession, User } from "@sapiens/types";

export interface AuthConfig {
  jwtSecret: string;
  accessTokenTtl: string;  // e.g. "15m"
  refreshTokenTtl: number; // segundos, e.g. 604800 (7 días)
}

export interface UserCredentialRepository {
  findByEmail(tenantId: string, email: string): Promise<(User & { passwordHash: string }) | null>;
}

export interface AuthSessionRepository {
  create(input: Omit<AuthSession, "id" | "createdAt">): Promise<AuthSession>;
  /** Busca por SHA-256(refreshToken) — permite lookup O(1) con índice en BD. */
  findByRefreshTokenHash(tenantId: string, hash: string): Promise<AuthSession | null>;
  deleteById(id: string): Promise<void>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export class AuthService {
  constructor(
    private readonly userRepo: UserCredentialRepository,
    private readonly sessionRepo: AuthSessionRepository,
    private readonly config: AuthConfig,
  ) {}

  async login(tenantId: string, email: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepo.findByEmail(tenantId, email);
    if (!user) throw new Error("Credenciales incorrectas");

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error("Credenciales incorrectas");

    return this.issueTokens(tenantId, user.id, user.role);
  }

  async refresh(tenantId: string, incomingRefreshToken: string): Promise<AuthTokens> {
    // 1. Verificar firma JWT primero (falla rápido si el token es falso)
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(incomingRefreshToken, this.config.jwtSecret) as jwt.JwtPayload;
    } catch {
      throw new Error("Refresh token inválido");
    }

    // 2. Lookup por SHA-256 (determinístico, indexable en BD)
    const tokenHash = sha256(incomingRefreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(tenantId, tokenHash);
    if (!session) throw new Error("Sesión no encontrada o ya revocada");
    if (session.expiresAt < new Date()) {
      await this.sessionRepo.deleteById(session.id);
      throw new Error("Refresh token expirado");
    }

    // 3. Rotación: eliminar sesión vieja y emitir nuevos tokens
    await this.sessionRepo.deleteById(session.id);
    return this.issueTokens(tenantId, payload["sub"] as string, payload["role"] as string);
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepo.deleteById(sessionId);
  }

  verifyAccessToken(token: string): jwt.JwtPayload {
    return jwt.verify(token, this.config.jwtSecret) as jwt.JwtPayload;
  }

  // ── Privados ──────────────────────────────────────────────────────────────

  private async issueTokens(tenantId: string, userId: string, role: string): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { sub: userId, tenantId, role },
      this.config.jwtSecret,
      { expiresIn: this.config.accessTokenTtl },
    );

    const refreshToken = jwt.sign(
      { sub: userId, tenantId, role },
      this.config.jwtSecret,
      { expiresIn: this.config.refreshTokenTtl },
    );

    const expiresAt = new Date(Date.now() + this.config.refreshTokenTtl * 1000);
    // Guardamos SHA-256 del token (suficiente entropía, lookup rápido)
    await this.sessionRepo.create({
      tenantId,
      userId,
      refreshTokenHash: sha256(refreshToken),
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
