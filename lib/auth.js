import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";
const TTL_MS = 8 * 60 * 60 * 1000;
const OWNER_TTL_S = 365 * 24 * 60 * 60;

// Outlives the admin session so the owner's own browsing stays out of analytics after logging out.
export const OWNER_COOKIE = "site_owner";

const sha = (value) => createHash("sha256").update(value).digest();
const sign = (expires) => createHmac("sha256", process.env.ADMIN_PASSWORD).update(`admin:${expires}`).digest("hex");

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

export function passwordMatches(password) {
  return adminEnabled() && timingSafeEqual(sha(String(password)), sha(process.env.ADMIN_PASSWORD));
}

export async function startSession() {
  const expires = Date.now() + TTL_MS;
  const options = { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" };
  const jar = await cookies();
  jar.set(COOKIE, `${expires}.${sign(expires)}`, { ...options, maxAge: TTL_MS / 1000 });
  jar.set(OWNER_COOKIE, "1", { ...options, maxAge: OWNER_TTL_S });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminEnabled()) return false;
  const [expires, signature = ""] = ((await cookies()).get(COOKIE)?.value || "").split(".");
  if (!(Number(expires) > Date.now())) return false;
  return timingSafeEqual(sha(signature), sha(sign(expires)));
}
