#!/usr/bin/env node
/**
 * External keep-alive ping for Supabase Free (avoids long idle windows).
 *
 * Usage:
 *   node scripts/keep-alive.js
 *   KEEP_ALIVE_URL=https://your-app.vercel.app/api/cron/keep-alive CRON_SECRET=... node scripts/keep-alive.js
 *
 * Schedule a few times per day. One ping a day can still look inactive to
 * Supabase Free. Only a paid plan guarantees the project will not pause.
 *
 * Requires CRON_SECRET to match the value deployed on the app.
 */

/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

/** Minimal .env loader (no dotenv dependency required). */
function loadEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // file optional
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const urlBase =
  process.env.KEEP_ALIVE_URL ||
  (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/cron/keep-alive`
    : null);

const secret = process.env.CRON_SECRET;

async function main() {
  if (!urlBase) {
    console.error("❌  Set KEEP_ALIVE_URL or NEXT_PUBLIC_APP_URL");
    process.exit(1);
  }
  if (!secret) {
    console.error("❌  Set CRON_SECRET (must match production env)");
    process.exit(1);
  }

  const res = await fetch(urlBase, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    console.error("❌  Keep-alive failed", res.status, body);
    process.exit(1);
  }

  console.log("✅  Keep-alive OK", body);
}

main().catch((err) => {
  console.error("❌ ", err.message || err);
  process.exit(1);
});
