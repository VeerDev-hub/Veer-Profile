"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { MotionConfig, motion } from "motion/react";

let activeLenis = null;

// Scrolls to a section through Lenis when it's running, so the motion matches anchor links.
export function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return;
  if (activeLenis) activeLenis.scrollTo(target, { offset: -(parseFloat(getComputedStyle(target).scrollMarginTop) || 0) });
  else target.scrollIntoView({ behavior: "smooth" });
  history.replaceState(null, "", `#${id}`);
}

export function SmoothScroll({ children }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    activeLenis = lenis;
    return () => {
      lenis.destroy();
      activeLenis = null;
    };
  }, []);
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Reveal({ children, delay = 0, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
