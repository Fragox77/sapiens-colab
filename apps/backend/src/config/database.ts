import { Pool } from "pg";
import { DatabaseClient, QueryResult } from "@sapiens/shared";
import { env } from "./env";

const pool = new Pool({
  host: env.postgres.host,
  port: env.postgres.port,
  database: env.postgres.database,
  user: env.postgres.user,
  password: env.postgres.password,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("PostgreSQL pool error", err);
});

/** Adaptador que satisface el contrato DatabaseClient de @sapiens/shared. */
export const db: DatabaseClient = {
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
    const result = await pool.query<T & object>(sql, params);
    return { rows: result.rows as T[] };
  },
};

export async function connectDatabase(): Promise<void> {
  const client = await pool.connect();
  client.release();
  // eslint-disable-next-line no-console
  console.log(`PostgreSQL connected → ${env.postgres.database}@${env.postgres.host}:${env.postgres.port}`);
}
