import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { OWNER_COOKIE } from "@/lib/auth";
import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { recordEvent } from "@/lib/store";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python/i;
const field = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const done = () => new Response(null, { status: 204 });

// The ID changes daily and can't be reversed to an IP, so no cookie or consent banner is needed.
function visitorId(request, userAgent) {
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "visitor")
    .update(`${day}|${clientIp(request)}|${userAgent}`)
    .digest("hex")
    .slice(0, 16);
}

function deviceOf(userAgent) {
  if (/ipad|tablet/i.test(userAgent)) return "Tablet";
  return /mobi|iphone|android/i.test(userAgent) ? "Mobile" : "Desktop";
}

function bareHost(host) {
  return host.split(":")[0].replace(/^www\./, "").toLowerCase();
}

// Empty means an internal arrival, which isn't a new visit.
function sourceOf(referrer, siteHost) {
  if (!referrer) return "Direct";
  try {
    const host = bareHost(new URL(referrer).hostname);
    return host === siteHost ? "" : host;
  } catch {
    return referrer.toLowerCase().slice(0, 60);
  }
}

export async function POST(request) {
  // Local runs can share the live database, so only real deployments count.
  if (process.env.NODE_ENV !== "production") return done();

  const body = await request.json().catch(() => null);
  const type = body?.type;
  const page = field(body?.page, 200);
  const name = type === "view" ? page : field(body?.name, 120);
  if ((type !== "view" && type !== "click") || !name || !page.startsWith("/")) return done();

  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent || BOTS.test(userAgent)) return done();
  if ((await cookies()).has(OWNER_COOKIE)) return done();
  if (await isRateLimited("track", clientIp(request), WINDOW_MS, MAX_PER_WINDOW)) return done();

  const siteHost = bareHost(request.headers.get("host") || "");
  await recordEvent({
    type,
    name,
    page,
    visitor: visitorId(request, userAgent),
    source: body.landing ? sourceOf(field(body.referrer, 200), siteHost) : "",
    device: deviceOf(userAgent),
    country: request.headers.get("x-vercel-ip-country") || "",
  }).catch(console.error);
  return done();
}
