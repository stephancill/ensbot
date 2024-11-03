import dotenv from "dotenv";

import { queue } from "./lib/queue";
import { ExpirationRow } from "./lib/types";
import { sendMessage } from "./lib/warpcast";

dotenv.config({ path: ".env.local" });

function formatJobId(row: ExpirationRow) {
  return `${row.fid}-${new Date(row.max_expires).getTime()}-${row.name}`;
}

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
  const existingJobs = await queue.getJobs(["completed"]);
  const existingJobIds = new Set(existingJobs.map((job) => job.id));

  const jobs = await queue.addBulk(
    duneData.result.rows
      .slice(0, 5)
      .filter((row) => {
        const jobId = formatJobId(row);
        return !existingJobIds.has(jobId);
      })
      .map((row) => ({
        name: row.name,
        data: row,
        opts: {
          removeOnComplete: false,
          jobId: formatJobId(row),
        },
      }))
  );

  if (process.env.REPORTING_FID)
    await sendMessage(
      {
        message: `Queued ${jobs.length} jobs for ENS name expiration reminders.`,
        recipientFid: process.env.REPORTING_FID,
      },
      process.env.WARPCAST_API_KEY!
    );

  console.log(`Queued ${jobs.length} jobs`);

  process.exit(0);
}

main();
