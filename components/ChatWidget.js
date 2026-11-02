"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { LuSend, LuX } from "react-icons/lu";
import { track } from "@/lib/track";

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

export default function ChatWidget({ suggestions, photo, name }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  async function send(text) {
    const question = text.trim();
    if (!question || busy) return;
    const history = [...messages, { role: "user", content: question }];
    let sources = "";
    const update = (content) => {
      setMessages([...history, { role: "model", content, sources }]);
      requestAnimationFrame(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }));
    };
    update("");
    setInput("");
    setBusy(true);
    track("Chat message");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
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

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label={`Ask about ${name}`}
            data-lenis-prevent
            className="flex h-[30rem] max-h-[calc(100svh-10.5rem)] w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-black/20"
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
            </header>
            <div ref={logRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-muted">Hi! 👋 What would you like to know?</p>
                  <div className="flex flex-wrap gap-2">
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
                    {m.content || <Typing />}
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
