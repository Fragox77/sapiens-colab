import { buildApp } from "./app";
import { env } from "./config/env";

const app = buildApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`OpenClaw backend running on port ${env.port}`);
});