import { Queue, Worker } from "bullmq";
import dotenv from "dotenv";
import { redis } from "./lib/redis";
import { sendMessage } from "./lib/warpcast";

dotenv.config({ path: ".env.local" });

type ExpirationRow = {
  fid: number;
  max_expires: string;
  name: string;
  owner: string;
};

const queueName = "ens-reminders";

function formatRenewUrl(name: string) {
  const searchParams = new URLSearchParams({
    name,
  });

  return `https://ens.steer.fun/frames/manage?${searchParams.toString()}`;
}

const worker = new Worker<ExpirationRow>(
  queueName,
  async (job) => {
    await sendMessage(
      {
        message: `Your ENS name "${
          job.data.name
        }" is expiring soon. ${formatRenewUrl(job.data.name)}`,
        recipientFid: job.data.fid.toString(),
      },
      process.env.WARPCAST_API_TOKEN!
    );
  },
  {
    connection: redis,
  }
);

const queue = new Queue(queueName, {
  connection: redis,
});

async function main() {
  // Get rows from query
  const duneRes = await fetch(
    "https://api.dune.com/api/v1/query/4227341/results?limit=1000",
    {
      headers: {
        "X-Dune-API-Key": process.env.DUNE_API_KEY!,
      },
    }
  );

  if (!duneRes.ok) {
    throw new Error(
      `Failed to fetch from Dune: ${duneRes.statusText} (${
        duneRes.status
      }) ${await duneRes.text()}`
    );
  }

  const duneData: { result: { rows: ExpirationRow[] } } = await duneRes.json();

  // Queue jobs
  const jobs = await queue.addBulk(
    duneData.result.rows.map((row) => ({
      name: row.name,
      data: row,
      opts: {
        removeOnComplete: false,
        jobId: `${row.name}-${row.fid}-${new Date(row.max_expires).getTime()}`,
      },
    }))
  );

  if (process.env.REPORTING_FID)
    await sendMessage(
      {
        message: `Queued ${
          jobs.length
        } jobs for ENS name expirations. ${formatRenewUrl("stephancill.eth")}`,
        recipientFid: process.env.REPORTING_FID,
      },
      process.env.WARPCAST_API_TOKEN!
    );
}

main();
