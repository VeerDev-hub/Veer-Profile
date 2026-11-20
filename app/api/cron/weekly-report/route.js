import { timingSafeEqual } from "node:crypto";
import { emailEnabled } from "@/lib/email";
import { sendWeeklyReport } from "@/lib/report";

// Vercel Cron calls this every Monday (see vercel.json) with the CRON_SECRET as a bearer token.
function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!emailEnabled()) return Response.json({ error: "RESEND_API_KEY is not set." }, { status: 503 });
  try {
    const sent = await sendWeeklyReport();
    return Response.json({ sent }, { status: sent ? 200 : 502 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "The report failed." }, { status: 500 });
  }
}
