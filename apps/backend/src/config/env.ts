export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4100),
  postgres: {
    host:     process.env.POSTGRES_HOST     || "localhost",
    port:     Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB       || "openclaw",
    user:     process.env.POSTGRES_USER     || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
  },
  jwt: {
    secret:          process.env.JWT_SECRET           || "changeme-secret-at-least-32-chars!",
    accessTokenTtl:  process.env.JWT_ACCESS_TTL        || "15m",
    refreshTokenTtl: Number(process.env.JWT_REFRESH_TTL || 604800), // 7 días
  },
};