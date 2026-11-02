"use client";

import { useEffect, useRef, useState } from "react";

const GREETINGS = [
  { text: "नमस्ते", lang: "hi" },
  { text: "Hello", lang: "en" },
  { text: "Hola", lang: "es" },
  { text: "Bonjour", lang: "fr" },
  { text: "Guten Tag", lang: "de" },
  { text: "こんにちは", lang: "ja" },
  { text: "مرحبا", lang: "ar" },
];
// Keep in step with the preloader-exit delay in globals.css (STEP_MS × greetings).
const STEP_MS = 450;

export default function Preloader() {
  const root = useRef(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let frame;
    // Follows the CSS clock, so words stay matched to the bar even if hydration runs late.
    const tick = () => {
      const elapsed = root.current?.getAnimations()[0]?.currentTime ?? performance.now();
      const next = Math.floor(elapsed / STEP_MS);
      setStep(Math.min(next, GREETINGS.length - 1));
      if (next < GREETINGS.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const greeting = GREETINGS[step];

  return (
    <div ref={root} className="preloader fixed inset-0 z-50 flex flex-col items-center justify-center gap-8">
      <span
        key={greeting.text}
        lang={greeting.lang}
        dir="auto"
        className="preloader-word px-4 py-3 text-center text-[clamp(2.75rem,14vw,6rem)] font-semibold leading-tight tracking-tight"
      >
        {greeting.text}
      </span>
      <div className="flex w-52 gap-1.5 sm:w-72">
        {GREETINGS.map((g, i) => (
          <span key={g.text} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <span
              className="preloader-bar block h-full"
              style={{ animationDelay: `${i * STEP_MS}ms`, animationDuration: `${STEP_MS}ms` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
