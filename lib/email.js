import { getContent } from "@/lib/store";

export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY);

// Until a domain is verified in Resend, CONTACT_TO must be the Resend account's own email.
export async function ownerEmail() {
  return process.env.CONTACT_TO || (await getContent()).email;
}

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

// Returns true when Resend accepted the message.
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>",
      to,
      reply_to: replyTo,
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((err) => {
    console.error(err);
    return null;
  });
  if (!res?.ok) {
    if (res) console.error("Resend error", res.status, await res.text());
    return false;
  }
  return true;
}
