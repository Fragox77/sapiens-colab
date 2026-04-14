import { buildApp } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";

async function start() {
  await connectDatabase();
  const app = buildApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`OpenClaw backend running on port ${env.port}`);
  });
}

void start();