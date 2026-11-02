"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

const INTERACTIVE = "a, button, [role='button']";
const FOLLOW = { stiffness: 400, damping: 32, mass: 0.4 };

export default function Cursor() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ringX = useSpring(x, FOLLOW);
  const ringY = useSpring(y, FOLLOW);

  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = document.documentElement;
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      setHovering(Boolean(e.target.closest?.(INTERACTIVE)));
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move);
    root.addEventListener("mouseleave", leave);
    root.classList.add("custom-cursor");
    return () => {
      window.removeEventListener("pointermove", move);
      root.removeEventListener("mouseleave", leave);
      root.classList.remove("custom-cursor");
    };
  }, [x, y]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]" style={{ opacity: visible ? 1 : 0 }}>
      <motion.div
        className="absolute left-0 top-0 -ml-5 -mt-5 size-10 rounded-full border border-accent"
        style={{ x: ringX, y: ringY }}
        animate={{ scale: hovering ? 1.5 : 1, backgroundColor: hovering ? "rgba(255,122,61,0.15)" : "rgba(255,122,61,0)" }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="absolute left-0 top-0 -ml-1 -mt-1 size-2 rounded-full bg-accent"
        style={{ x, y }}
        animate={{ scale: hovering ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />
    </div>
  );
}
