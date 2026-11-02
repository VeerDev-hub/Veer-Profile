"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

const SLOTS = [
  { className: "left-[9%] top-[24%]", fill: "bg-accent", depth: 26, delay: "0s" },
  { className: "right-[9%] top-[32%]", fill: "bg-teal", depth: -34, delay: "-1.6s" },
  { className: "left-[3%] bottom-[12%]", fill: "bg-amber", depth: -20, delay: "-3.1s" },
];

function Tag({ label, slot, pointerX, pointerY }) {
  const x = useTransform(pointerX, (v) => v * slot.depth);
  const y = useTransform(pointerY, (v) => v * slot.depth);
  return (
    <motion.div className={`absolute ${slot.className}`} style={{ x, y }}>
      <div className="tag-float flex flex-col items-start" style={{ animationDelay: slot.delay }}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className={slot.fill.replace("bg-", "text-")}>
          <path fill="currentColor" d="M2 1.5 18 8l-7 2.5L8 18z" />
        </svg>
        <span className={`ml-4 rounded-full px-3 py-1 text-sm font-medium text-background ${slot.fill}`}>{label}</span>
      </div>
    </motion.div>
  );
}

export default function FloatingTags({ tags }) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, { stiffness: 60, damping: 18 });
  const pointerY = useSpring(rawY, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const move = (e) => {
      rawX.set(e.clientX / innerWidth - 0.5);
      rawY.set(e.clientY / innerHeight - 0.5);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [rawX, rawY]);

  return (
    <div aria-hidden className="hero-pop pointer-events-none absolute inset-0 hidden lg:block">
      {tags.slice(0, SLOTS.length).map((tag, i) => (
        <Tag key={tag} label={tag} slot={SLOTS[i]} pointerX={pointerX} pointerY={pointerY} />
      ))}
    </div>
  );
}
