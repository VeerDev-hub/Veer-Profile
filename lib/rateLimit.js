import { createHash } from "node:crypto";
import { recordHit } from "@/lib/store";

export const hashIp = (ip) => createHash("sha256").update(ip).digest("hex");

export function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

// Counts in the database, so the limit holds across server instances.
export async function isRateLimited(bucket, ip, windowMs, max) {
  try {
    return (await recordHit(bucket, hashIp(ip), windowMs)) > max;
  } catch (err) {
    console.error(err);
    return false; // A database hiccup shouldn't take the form or chat down.
  }
}
