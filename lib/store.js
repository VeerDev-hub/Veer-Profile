import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cacheTag } from "next/cache";
import { Pool } from "pg";
import { summarize } from "@/lib/analytics";
import { defaultContent } from "@/lib/content";

export const CONTENT_TAG = "content";

const DAY_MS = 24 * 60 * 60 * 1000;
const EVENT_RETENTION_MS = 366 * DAY_MS;
const MAX_FILE_EVENTS = 5000;

// Postgres when DATABASE_URL is set; otherwise a local file, which only works on a writable disk.
const DATA_FILE = path.join(process.cwd(), "data", "site.json");
let ready;

async function connect() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("CREATE TABLE IF NOT EXISTS site_data (key text PRIMARY KEY, value jsonb NOT NULL)");
  await pool.query("CREATE TABLE IF NOT EXISTS login_failures (id text NOT NULL, at bigint NOT NULL)");
  await pool.query("CREATE TABLE IF NOT EXISTS rate_hits (bucket text NOT NULL, id text NOT NULL, at bigint NOT NULL)");
  await pool.query("CREATE TABLE IF NOT EXISTS chat_gaps (question text NOT NULL, at bigint NOT NULL)");
  await pool.query(`CREATE TABLE IF NOT EXISTS analytics_events (
    at bigint NOT NULL, type text NOT NULL, name text NOT NULL, page text NOT NULL,
    visitor text NOT NULL, source text NOT NULL, device text NOT NULL, country text NOT NULL
  )`);
  await pool.query("CREATE INDEX IF NOT EXISTS analytics_events_at ON analytics_events (at)");
  return pool;
}

// Shared promise, so parallel first queries all wait for the tables to exist.
function db() {
  ready ??= connect().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

async function readFileStore() {
  try {
    return JSON.parse(await readFile(DATA_FILE, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

export async function readKey(key) {
  if (process.env.DATABASE_URL) {
    const { rows } = await (await db()).query("SELECT value FROM site_data WHERE key = $1", [key]);
    return rows[0]?.value ?? null;
  }
  return (await readFileStore())[key] ?? null;
}

export async function writeKey(key, value) {
  if (process.env.DATABASE_URL) {
    await (await db()).query(
      "INSERT INTO site_data (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
      [key, JSON.stringify(value)],
    );
    return;
  }
  const data = await readFileStore();
  data[key] = value;
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function recordLoginFailure(id, pruneBefore) {
  const at = Date.now();
  if (process.env.DATABASE_URL) {
    const client = await db();
    await client.query("DELETE FROM login_failures WHERE at < $1", [pruneBefore]);
    await client.query("INSERT INTO login_failures (id, at) VALUES ($1, $2)", [id, at]);
    return;
  }
  const failures = ((await readKey("loginFailures")) || []).filter((f) => f.at >= pruneBefore);
  await writeKey("loginFailures", [...failures, { id, at }]);
}

export async function loginFailures(id, since) {
  let rows;
  if (process.env.DATABASE_URL) {
    ({ rows } = await (await db()).query("SELECT id, at::float8 AS at FROM login_failures WHERE at >= $1", [since]));
  } else {
    rows = ((await readKey("loginFailures")) || []).filter((f) => f.at >= since);
  }
  const mine = rows.filter((f) => f.id === id).map((f) => f.at);
  return {
    count: mine.length,
    oldest: Math.min(...mine),
    total: rows.length,
    oldestOverall: Math.min(...rows.map((f) => f.at)),
  };
}

export async function clearLoginFailures(id) {
  if (process.env.DATABASE_URL) {
    await (await db()).query("DELETE FROM login_failures WHERE id = $1", [id]);
    return;
  }
  await writeKey("loginFailures", ((await readKey("loginFailures")) || []).filter((f) => f.id !== id));
}

export async function recordHit(bucket, id, windowMs) {
  const at = Date.now();
  const since = at - windowMs;
  if (process.env.DATABASE_URL) {
    const client = await db();
    await client.query("DELETE FROM rate_hits WHERE bucket = $1 AND at < $2", [bucket, since]);
    await client.query("INSERT INTO rate_hits (bucket, id, at) VALUES ($1, $2, $3)", [bucket, id, at]);
    const { rows } = await client.query("SELECT count(*)::int AS n FROM rate_hits WHERE bucket = $1 AND id = $2", [bucket, id]);
    return rows[0].n;
  }
  const key = `rate:${bucket}:${id}`;
  const hits = [...((await readKey(key)) || []).filter((t) => t >= since), at];
  await writeKey(key, hits);
  return hits.length;
}

export async function logChatGap(question) {
  if (process.env.DATABASE_URL) {
    await (await db()).query("INSERT INTO chat_gaps (question, at) VALUES ($1, $2)", [question, Date.now()]);
    return;
  }
  await writeKey("chatGaps", [...((await readKey("chatGaps")) || []), { question, at: Date.now() }].slice(-100));
}

export async function getChatGaps() {
  if (process.env.DATABASE_URL) {
    const { rows } = await (await db()).query("SELECT question FROM chat_gaps ORDER BY at DESC LIMIT 50");
    return rows.map((r) => r.question);
  }
  return ((await readKey("chatGaps")) || []).map((g) => g.question).reverse();
}

export async function clearChatGaps() {
  if (process.env.DATABASE_URL) {
    await (await db()).query("DELETE FROM chat_gaps");
    return;
  }
  await writeKey("chatGaps", []);
}

export async function recordEvent(event) {
  const at = Date.now();
  if (process.env.DATABASE_URL) {
    const client = await db();
    await client.query("DELETE FROM analytics_events WHERE at < $1", [at - EVENT_RETENTION_MS]);
    await client.query(
      "INSERT INTO analytics_events (at, type, name, page, visitor, source, device, country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [at, event.type, event.name, event.page, event.visitor, event.source, event.device, event.country],
    );
    return;
  }
  await writeKey("events", [...((await readKey("events")) || []), { ...event, at }].slice(-MAX_FILE_EVENTS));
}

async function getEvents(since) {
  if (process.env.DATABASE_URL) {
    const { rows } = await (await db()).query(
      "SELECT at::float8 AS at, type, name, page, visitor, source, device, country FROM analytics_events WHERE at >= $1",
      [since],
    );
    return rows;
  }
  return ((await readKey("events")) || []).filter((e) => e.at >= since);
}

export async function getAnalytics(days) {
  const now = Date.now();
  // One spare day, because the oldest bar starts at local midnight rather than exactly `days` ago.
  return summarize(await getEvents(now - (days + 1) * DAY_MS), days, now);
}

export async function getContent() {
  "use cache";
  cacheTag(CONTENT_TAG);
  return { ...defaultContent, ...(await readKey("content")) };
}

export async function getKnowledge() {
  const saved = await readKey("knowledge");
  return saved ?? readFile(path.join(process.cwd(), "knowledge", "profile.md"), "utf8");
}
