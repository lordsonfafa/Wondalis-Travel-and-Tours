// Netlify scheduled function: once a day it calls the site's own /api/cron/fx route, which fetches
// the live USD to GHS rate and stores it. The route refuses requests without CRON_SECRET, so this
// function is the only thing that can trigger it. (Scheduled functions run on the published site only.)
import type { Config } from "@netlify/functions";

const refresh = async () => {
  const site = process.env.BETTER_AUTH_URL ?? process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!site || !secret) {
    console.error("[fx-refresh] BETTER_AUTH_URL (or URL) and CRON_SECRET must be set");
    return;
  }
  const res = await fetch(`${site.replace(/\/$/, "")}/api/cron/fx`, { headers: { Authorization: `Bearer ${secret}` } });
  console.log(`[fx-refresh] ${res.status} ${await res.text()}`);
};

export default refresh;

export const config: Config = { schedule: "0 6 * * *" }; // every day at 06:00 UTC
