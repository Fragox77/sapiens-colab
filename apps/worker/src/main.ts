import { queueNames } from "@sapiens/config";
import { processMessageJob } from "./jobs/processMessage";
import { runWorkflowJob } from "./jobs/runWorkflow";
import { connectQueue, consume } from "./queues/redisQueue";

async function consumeQueue(
  queueName: string,
  handler: (payload: string) => Promise<void>
): Promise<void> {
  // Long-running consumer loop for a specific queue.
  while (true) {
    try {
      const payload = await consume(queueName);
      if (!payload) {
        continue;
      }
      await handler(payload);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Worker queue error", { queueName, error });
    }
  }
}

async function bootstrapWorker() {
  await connectQueue();
  // eslint-disable-next-line no-console
  console.log("Worker connected to Redis");

  await Promise.all([
    consumeQueue(queueNames.processMessage, processMessageJob),
    consumeQueue(queueNames.runWorkflow, runWorkflowJob)
  ]);
}

void bootstrapWorker();