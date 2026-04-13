import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true
});

export async function connectQueue(): Promise<void> {
  if (redis.status !== "ready") {
    await redis.connect();
  }
}

export async function enqueue(queueName: string, payload: string): Promise<void> {
  await redis.lpush(queueName, payload);
}

export async function consume(queueName: string): Promise<string | null> {
  const result = await redis.brpop(queueName, 1);
  return result ? result[1] : null;
}