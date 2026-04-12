import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(getEnv("PORT", "4000")),
  nodeEnv: getEnv("NODE_ENV", "development"),
  mongoUri: getEnv("MONGODB_URI"),
  jwtSecret: getEnv("JWT_SECRET"),
  jwtExpiresIn: getEnv("JWT_EXPIRES_IN", "7d"),
  clientUrl: getEnv("WEB_URL", "http://localhost:3000")
};
