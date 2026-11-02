"use client";

import { useState } from "react";
import { track } from "@/lib/track";

const fieldClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none transition-colors focus:border-accent";

export default function ContactForm({ email }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Your message wasn't sent.");
      }
      form.reset();
      setStatus("sent");
      track("Contact form sent");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required maxLength={100} autoComplete="name" aria-label="Your name" placeholder="Your name" className={fieldClass} />
        <input name="email" type="email" required maxLength={200} autoComplete="email" aria-label="Your email" placeholder="Your email" className={fieldClass} />
      </div>
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <textarea name="message" required minLength={10} maxLength={3000} rows={5} aria-label="Your message" placeholder="Your message" className={fieldClass} />
      <div className="flex flex-wrap items-center gap-4">
        <button
          disabled={status === "sending"}
          className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-transform hover:scale-105 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        <p role="status" className="text-sm text-muted">
          {status === "sent" && "Thanks! Your message is on its way."}
          {status === "error" && (
            <>
              {error} Please email <a href={`mailto:${email}`} className="underline">{email}</a> instead.
            </>
          )}
        </p>
      </div>
    </form>
  );
}
