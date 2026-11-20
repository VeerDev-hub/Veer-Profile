import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { emailEnabled, ownerEmail, sendEmail } from "@/lib/email";

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

  if (!emailEnabled()) {
    return Response.json({ error: "The form isn't set up yet." }, { status: 503 });
  }
  if (await isRateLimited("contact", clientIp(request), WINDOW_MS, MAX_PER_WINDOW)) {
    return Response.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  const sent = await sendEmail({
    to: await ownerEmail(),
    replyTo: email,
    subject: `Portfolio message from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
  if (!sent) return Response.json({ error: "Your message wasn't sent." }, { status: 502 });
  return Response.json({ ok: true });
}
