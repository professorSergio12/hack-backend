import "dotenv/config";
import cron from "node-cron";
import { ping } from "./ping.js";

const schedule = process.env.KEEPALIVE_CRON || "*/10 * * * *";
const timezone = process.env.CRON_TZ || "UTC";
const url = (process.env.KEEPALIVE_URL || "https://hack-backend-h3eq.onrender.com/health").trim();

if (!cron.validate(schedule)) {
  console.error(`[keepalive] invalid KEEPALIVE_CRON: ${schedule}`);
  process.exit(1);
}

console.log(`[keepalive] service: backend`);
console.log(`[keepalive] target: ${url}`);
console.log(`[keepalive] schedule: ${schedule} (${timezone})`);

ping().catch((e) => console.error("[keepalive] initial ping failed", e));

cron.schedule(
  schedule,
  () => {
    ping().catch((e) => console.error("[keepalive] scheduled ping failed", e));
  },
  { timezone }
);

console.log("[keepalive] running — Ctrl+C to stop");
