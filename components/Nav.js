"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { LuMoon, LuSun } from "react-icons/lu";

const LINKS = [
  ["Work", "work"],
  ["Experience", "experience"],
  ["Skills", "skills"],
  ["Contact", "contact"],
];

function toggleTheme(event) {
  const root = document.documentElement;
  const apply = () => {
    const dark = root.classList.toggle("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  };
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }
  const { clientX: x, clientY: y } = event;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 550, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

export default function Nav() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
          else setActive((current) => (current === entry.target.id ? null : current));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const [, id] of LINKS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="nav-enter fixed inset-x-0 top-4 z-30 flex justify-center px-4">
      <nav className="flex items-center gap-1 rounded-full border border-line bg-surface/80 p-1.5 shadow-lg shadow-black/5 backdrop-blur-md">
        <a
          href="#main"
          aria-label="Back to top"
          className="flex size-9 items-center justify-center rounded-full bg-foreground font-mono text-[10px] font-semibold text-background transition-transform hover:scale-105"
        >
          VPS
        </a>
        {LINKS.map(([label, id]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? "true" : undefined}
            className="relative rounded-full px-2 py-2 text-[13px] transition-colors hover:text-accent sm:px-4 sm:text-sm"
          >
            {active === id && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-full bg-accent/15"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{label}</span>
          </a>
        ))}
        <button
          onClick={toggleTheme}
          aria-label="Switch between light and dark theme"
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent/15 hover:text-accent"
        >
          <LuMoon className="block dark:hidden" />
          <LuSun className="hidden dark:block" />
        </button>
      </nav>
    </div>
  );
}
