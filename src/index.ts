import dotenv from "dotenv";

import { Worker } from "bullmq";
import { queueName } from "./lib/constants";
import { redis } from "./lib/redis";
import { ExpirationRow } from "./lib/types";
import { formatRenewUrl } from "./lib/utils";
import { sendMessage } from "./lib/warpcast";
import getUuidByString from "uuid-by-string";
import { initExpressApp } from "./lib/express";

dotenv.config({ path: ".env.local" });

new Worker<ExpirationRow>(
  queueName,
  async (job) => {
    await sendMessage(
      {
        message: `Your ENS name "${
          job.data.name
        }" is expiring soon. ${formatRenewUrl(job.data.name)}`,
        recipientFid: job.data.fid.toString(),
        idempotencyKey: job.id ? getUuidByString(job.id) : undefined,
      },
      process.env.WARPCAST_API_KEY!
    );
  },
  {
    connection: redis,
  }
);

initExpressApp();
