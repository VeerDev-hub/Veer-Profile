import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { getContent } from "@/lib/store";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const field = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function POST(request) {
  const body = await request.json().catch(() => null);
  // Bots fill the hidden field; report success so they don't adapt.
  if (body?.company) return Response.json({ ok: true });

  const name = field(body?.name, 100).replace(/[\r\n]+/g, " ");
  const email = field(body?.email, 200);
  const message = field(body?.message, 3000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return Response.json({ error: "Please check your details." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: "The form isn't set up yet." }, { status: 503 });
  }
  if (await isRateLimited("contact", clientIp(request), WINDOW_MS, MAX_PER_WINDOW)) {
    return Response.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  const to = process.env.CONTACT_TO || (await getContent()).email;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
      to,
      reply_to: email,
      subject: `Portfolio message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((err) => {
    console.error(err);
    return null;
  });

  if (!res?.ok) {
    if (res) console.error("Resend error", res.status, await res.text());
    return Response.json({ error: "Your message wasn't sent." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
