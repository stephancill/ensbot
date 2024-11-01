import dotenv from "dotenv";
import { sendMessage } from "./lib/warpcast";

dotenv.config({ path: ".env.local" });

export async function main() {
  await sendMessage(
    {
      message: "Hello, world!",
      recipientFid: "1689",
      idempotencyKey: "2fc3cbb6-7c83-5956-8f1a-ac6d6ab565bb",
    },
    process.env.WARPCAST_API_KEY!
  );
}

main();
