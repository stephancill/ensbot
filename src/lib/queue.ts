import { Queue } from "bullmq";
import { queueName } from "./constants";
import { redis } from "./redis";

export const queue = new Queue(queueName, {
  connection: redis,
});
