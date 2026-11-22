"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { LuArrowLeft, LuBriefcase, LuDownload, LuFileText, LuSend, LuX } from "react-icons/lu";
import ResumeButton from "@/components/ResumeButton";
import { track } from "@/lib/track";

const MAX_CHARS = 2000;
const MAX_JOB_CHARS = 6000;

// Any mention of the resume gets a resume card under the reply. A plain request for it
// ("can I see your CV?", "resume pls") is answered straight away without asking the model.
const MENTIONS_RESUME = /\b(r[eé]sum[eé]s?|cvs?|curriculum vitae)(?![a-z])/i;
const ASKS_FOR_RESUME =
  /\b(send|share|download|give|get|see|view|show|open|have|need|want|link|pdf|copy|where|can i|could i|may i)\b/i;
const isResumeRequest = (text) =>
  MENTIONS_RESUME.test(text) && (ASKS_FOR_RESUME.test(text) || text.trim().split(/\s+/).length <= 3);

// Opens the resume preview first, so nobody has to download a file blind. Download stays one tap away.
function ResumeCard({ url, name }) {
  return (
    <div className="mt-2 flex items-center rounded-xl border border-line bg-surface transition-colors hover:border-accent">
      <ResumeButton url={url} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 hover:text-accent">
        <LuFileText aria-hidden className="shrink-0 text-lg text-accent" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{name}&apos;s resume</span>
          <span className="block text-[11px] text-muted">Tap to view · PDF</span>
        </span>
      </ResumeButton>
      <a
        href={url}
        download={`${name}-Resume.pdf`}
        data-track="Resume download"
        aria-label="Download resume"
        title="Download PDF"
        className="mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/15 hover:text-accent"
      >
        <LuDownload />
      </a>
    </div>
  );
}

function Typing() {
  return (
    <span className="flex gap-1 py-1" aria-label="Thinking">
      {[0, 0.15, 0.3].map((delay) => (
        <span key={delay} className="chat-dot size-1.5 rounded-full bg-muted opacity-40" style={{ animationDelay: `${delay}s` }} />
      ))}
    </span>
  );
}

function Avatar({ photo, className }) {
  return (
    <span className={`block overflow-hidden rounded-full bg-accent/20 ${className}`}>
      <Image
        src={photo}
        alt=""
        width={640}
        height={640}
        sizes="112px"
        loading="eager"
        unoptimized={photo.startsWith("data:")}
        className="translate-y-[6%] scale-110"
      />
    </span>
  );
}

// What earlier turns look like when sent back as history. A pasted job description is
// shortened so follow-up questions stay within the normal message limit.
const historyOf = (messages) =>
  messages.map(({ role, content }) => ({ role, content: content.slice(0, MAX_CHARS) }));

function FitForm({ name, busy, onSubmit, onBack }) {
  const [job, setJob] = useState("");
  return (
    <form
      className="flex flex-1 flex-col gap-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (job.trim().length >= 40) onSubmit(job.trim());
      }}
    >
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 self-start text-xs text-muted hover:text-accent">
        <LuArrowLeft aria-hidden /> Back to chat
      </button>
      <div>
        <p className="text-sm font-medium">Check {name}&apos;s fit for a role</p>
        <p className="mt-1 text-xs text-muted">
          Paste a job description. You&apos;ll get the requirements {name} matches, with the projects that show it, and anything worth discussing.
        </p>
      </div>
      <textarea
        autoFocus
        value={job}
        onChange={(e) => setJob(e.target.value)}
        maxLength={MAX_JOB_CHARS}
        aria-label="Job description"
        placeholder="Paste the job description here…"
        className="min-h-0 flex-1 resize-none rounded-2xl bg-background p-3 text-base outline-none focus:ring-2 focus:ring-accent/40 sm:text-sm"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted tabular-nums">
          {job.length.toLocaleString()} / {MAX_JOB_CHARS.toLocaleString()}
        </span>
        <button
          disabled={busy || job.trim().length < 40}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          Check fit
        </button>
      </div>
    </form>
  );
}

export default function ChatWidget({ suggestions, photo, name, resumeUrl }) {
  const [open, setOpen] = useState(false);
  const [fitMode, setFitMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const sendRef = useRef(null);

  async function send(text, { fit = false } = {}) {
    const question = text.trim();
    if (!question || busy) return;
    const asked = fit
      ? { role: "user", content: `Job description I shared:\n${question}`, label: "Checking fit for this role", preview: question }
      : { role: "user", content: question };
    const history = [...messages, asked];
    const resume = Boolean(resumeUrl) && !fit && MENTIONS_RESUME.test(question);
    let sources = "";
    const update = (content) => {
      setMessages([...history, { role: "model", content, sources, resume }]);
      requestAnimationFrame(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }));
    };
    setFitMode(false);
    setInput("");
    if (resume && isResumeRequest(question)) {
      track("Chat resume");
      update(`Here's ${name}'s resume. Tap below to view it, or use the download button to save the PDF.`);
      return;
    }
    update("");
    setBusy(true);
    track(fit ? "Chat fit check" : "Chat message");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          fit
            ? { mode: "fit", messages: [{ role: "user", content: question }] }
            : { messages: historyOf(history) },
        ),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        update(data.error || "Something went wrong.");
        return;
      }
      sources = decodeURIComponent(res.headers.get("X-Sources") || "");
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let answer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += value;
        update(answer);
      }
      if (!answer) update("Something went wrong.");
    } catch {
      update("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    sendRef.current = send;
  });

  // The command palette opens the chat, sometimes with a question or straight into fit mode.
  useEffect(() => {
    const onOpen = (e) => {
      setOpen(true);
      if (e.detail?.mode === "fit") setFitMode(true);
      if (e.detail?.question) sendRef.current?.(e.detail.question);
    };
    window.addEventListener("open-chat", onOpen);
    return () => window.removeEventListener("open-chat", onOpen);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label={`Ask about ${name}`}
            data-lenis-prevent
            className="flex h-[32rem] max-h-[calc(100svh-10.5rem)] w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-black/20"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Avatar photo={photo} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Ask about {name}</p>
                <p className="text-xs text-muted">AI assistant, answers from {name}&apos;s profile</p>
              </div>
              {!fitMode && (
                <button
                  onClick={() => setFitMode(true)}
                  disabled={busy}
                  title="Check fit for a job"
                  aria-label="Check fit for a job"
                  className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent/15 hover:text-accent disabled:opacity-40"
                >
                  <LuBriefcase />
                </button>
              )}
            </header>

            {fitMode ? (
              <FitForm name={name} busy={busy} onSubmit={(job) => send(job, { fit: true })} onBack={() => setFitMode(false)} />
            ) : (
              <>
                <div ref={logRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-muted">Hi! 👋 What would you like to know?</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setFitMode(true)}
                          className="flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-left text-xs text-accent transition-colors hover:bg-accent/20"
                        >
                          <LuBriefcase aria-hidden /> Hiring? Check {name}&apos;s fit for a role
                        </button>
                        {resumeUrl && (
                          <button
                            onClick={() => send("Can I get the resume?")}
                            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-left text-xs transition-colors hover:border-accent hover:text-accent"
                          >
                            <LuDownload aria-hidden /> Download resume
                          </button>
                        )}
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => send(s)}
                            className="rounded-full border border-line px-3 py-1.5 text-left text-xs transition-colors hover:border-accent hover:text-accent"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={
                          m.role === "user"
                            ? "max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-white"
                            : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-background px-3.5 py-2"
                        }
                      >
                        {m.label ? (
                          <>
                            <span className="flex items-center gap-1.5 font-medium">
                              <LuBriefcase aria-hidden /> {m.label}
                            </span>
                            <span className="mt-1 line-clamp-3 block text-xs opacity-80">{m.preview}</span>
                          </>
                        ) : (
                          m.content || <Typing />
                        )}
                        {m.resume && m.content && <ResumeCard url={resumeUrl} name={name} />}
                        {m.sources && !busy && <p className="mt-1.5 text-[11px] text-muted">From: {m.sources}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  className="flex items-center gap-2 border-t border-line p-2.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={500}
                    aria-label="Your question"
                    placeholder="Ask a question"
                    className="min-w-0 flex-1 rounded-full bg-background px-4 py-2.5 text-base outline-none focus:ring-2 sm:text-sm focus:ring-accent/40"
                  />
                  <button
                    disabled={busy}
                    aria-label="Send"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform hover:scale-105 disabled:opacity-40"
                  >
                    <LuSend />
                  </button>
                </form>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
      <div className="relative">
        {!open && <span aria-hidden className="chat-ping absolute inset-0 rounded-full bg-accent/40" />}
        <motion.button
          onClick={() => {
            if (!open) track("Chat opened");
            setOpen(!open);
          }}
          aria-expanded={open}
          aria-label={open ? "Close chat" : `Ask about ${name}`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative flex size-16 items-center justify-center rounded-full bg-surface text-2xl shadow-lg shadow-black/25 ring-2 ring-accent"
        >
          {open ? (
            <LuX />
          ) : (
            <>
              <Avatar photo={photo} className="size-full" />
              <span aria-hidden className="chat-wave absolute -right-1 -top-1 text-lg">
                👋
              </span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
