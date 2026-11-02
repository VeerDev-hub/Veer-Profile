"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

const COLORS = {
  foreground: "text-foreground",
  accent: "text-accent",
  amber: "text-amber",
  teal: "text-teal",
};
const CURSOR_COLORS = [
  { text: "text-accent", fill: "bg-accent", ring: "border-accent" },
  { text: "text-teal", fill: "bg-teal", ring: "border-teal" },
  { text: "text-amber", fill: "bg-amber", ring: "border-amber" },
];
// Where each cursor flies in from, as a fraction of the headline's size.
const STARTS = [[-0.12, -0.25], [1.08, 0.35], [-0.14, 1.2]];
const START_AT_MS = 3500; // As the loader's circle closes.
const LINE_GAP_MS = 750;
const CHAR_MS = 48;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function lineChars(line) {
  const chars = line.prefix
    ? [...`${line.prefix} `].map((ch) => ({ ch, color: "foreground" }))
    : [];
  return [...chars, ...[...line.text].map((ch) => ({ ch, color: line.color }))];
}

function loaderElapsed() {
  const loader = document.querySelector(".preloader");
  return loader?.getAnimations()[0]?.currentTime ?? null;
}

export default function HeroHeadline({ headline, tags }) {
  const box = useRef(null);
  const cursors = useRef([]);
  // null: plain headline. An array: characters typed so far on each line.
  const [typed, setTyped] = useState(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const elapsed = loaderElapsed();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (elapsed === null || reduced || elapsed > START_AT_MS - 300) return;

    let cancelled = false;
    const lines = headline.map(lineChars);

    const typeLine = async (i) => {
      const cursor = cursors.current[i];
      const wrap = box.current;
      const place = (rect, side) => {
        const origin = wrap.getBoundingClientRect();
        return { x: rect[side] - origin.left, y: rect.bottom - origin.top - rect.height * 0.28 };
      };
      const chars = wrap.querySelectorAll(`[data-line="${i}"]`);
      await sleep(i * LINE_GAP_MS);
      if (cancelled) return;

      const first = place(chars[0].getBoundingClientRect(), "left");
      await animate(cursor, { ...first, opacity: 1 }, { duration: 0.55, ease: [0.22, 1, 0.36, 1] });
      await animate(cursor, { scale: [1, 0.72, 1] }, { duration: 0.2 });
      animate(cursor.querySelector("[data-ring]"), { scale: [0.2, 2.6], opacity: [0.7, 0] }, { duration: 0.45 });

      for (let n = 1; n <= lines[i].length; n++) {
        if (cancelled) return;
        setTyped((t) => t.map((count, j) => (j === i ? n : count)));
        animate(cursor, place(chars[n - 1].getBoundingClientRect(), "right"), { duration: CHAR_MS / 1000, ease: "linear" });
        await sleep(CHAR_MS);
      }

      await sleep(220);
      await animate(cursor, { opacity: 0, scale: 0.6, y: first.y - 26 }, { duration: 0.4 });
    };

    const start = setTimeout(async () => {
      try {
        await Promise.all(lines.map((_, i) => typeLine(i)));
      } finally {
        if (!cancelled) {
          setTyped(lines.map((chars) => chars.length));
          setFinished(true);
        }
      }
    }, START_AT_MS - elapsed);

    // Hides the text behind the loader, so nothing flashes before typing starts.
    const hide = requestAnimationFrame(() => {
      setTyped(lines.map(() => 0));
      const { width, height } = box.current.getBoundingClientRect();
      cursors.current.forEach((cursor, i) => {
        if (!cursor) return;
        const [x, y] = STARTS[i % STARTS.length];
        animate(cursor, { x: x * width, y: y * height }, { duration: 0 });
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(start);
      cancelAnimationFrame(hide);
    };
  }, [headline]);

  return (
    <div ref={box} className="relative">
      <h1
        aria-label={headline.map((l) => [l.prefix, l.text].filter(Boolean).join(" ")).join(" ")}
        className="text-[min(12.5vw,17svh)] font-bold uppercase leading-[0.98] tracking-tight"
      >
        {headline.map((line, i) => (
          <span key={line.text} aria-hidden className="block overflow-hidden pb-[0.04em]">
            <span
              className="hero-line block whitespace-pre"
              style={typed ? { animation: "none" } : { animationDelay: `${3.55 + i * 0.12}s` }}
            >
              {lineChars(line).map(({ ch, color }, c, chars) => {
                const shown = !typed || c < typed[i];
                const caret = typed && c === typed[i] - 1 && c < chars.length - 1;
                return (
                  <span
                    key={c}
                    data-line={i}
                    className={`${COLORS[color] || COLORS.foreground} ${caret ? "type-caret" : ""}`}
                    style={shown ? undefined : { opacity: 0 }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          </span>
        ))}
      </h1>

      {typed && !finished &&
        headline.map((line, i) => {
          const color = CURSOR_COLORS[i % CURSOR_COLORS.length];
          const label = tags.length ? tags[i % tags.length] : null;
          return (
            <div
              key={line.text}
              ref={(el) => { cursors.current[i] = el; }}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-10 flex flex-col items-start opacity-0"
            >
              <span data-ring className={`absolute -left-3 -top-3 size-7 rounded-full border-2 opacity-0 ${color.ring}`} />
              <svg width="20" height="20" viewBox="0 0 20 20" className={color.text}>
                <path fill="currentColor" d="M2 1.5 18 8l-7 2.5L8 18z" />
              </svg>
              {label && (
                <span className={`ml-4 whitespace-nowrap rounded-full ${color.fill} px-2.5 py-0.5 text-xs font-medium text-background sm:text-sm`}>
                  {label}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
}
