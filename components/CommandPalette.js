"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  LuBriefcase,
  LuCalendarClock,
  LuCopy,
  LuCornerDownLeft,
  LuFileText,
  LuFolder,
  LuHash,
  LuLink,
  LuMessageCircle,
  LuSearch,
  LuSparkles,
  LuSunMoon,
} from "react-icons/lu";
import { scrollToId } from "@/components/Motion";
import { projectSlug } from "@/lib/content";
import { toggleTheme } from "@/lib/theme";
import { track } from "@/lib/track";

const OPEN_EVENT = "open-palette";
export const openPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));
// Opens the chat widget, optionally asking a question or starting the job-fit check.
export const openChat = (detail = {}) => window.dispatchEvent(new CustomEvent("open-chat", { detail }));

const SECTIONS = [
  ["Work", "work", "projects portfolio"],
  ["Experience", "experience", "internship education achievements"],
  ["Certifications", "certifications", "aws ibm courses"],
  ["Skills", "skills", "tech stack tools languages"],
  ["GitHub activity", "github", "contributions commits code"],
  ["Contact", "contact", "email message hire"],
];

function buildItems({ projects, email, resumeUrl, bookingUrl, socials }, go) {
  const items = [
    {
      group: "Actions",
      label: "Check my fit for a job",
      hint: "Paste a job description",
      icon: LuSparkles,
      keywords: "recruiter hiring role match jd",
      run: () => openChat({ mode: "fit" }),
    },
    { group: "Actions", label: "Ask the assistant", icon: LuMessageCircle, keywords: "chat ai bot question", run: () => openChat() },
    {
      group: "Actions",
      label: "Copy email address",
      hint: email,
      icon: LuCopy,
      keywords: "mail contact",
      run: async () => {
        await navigator.clipboard?.writeText(email);
        return "Email copied";
      },
    },
    resumeUrl && {
      group: "Actions",
      label: "Open resume",
      icon: LuFileText,
      keywords: "cv pdf download",
      run: () => window.open(resumeUrl, "_blank", "noopener"),
    },
    bookingUrl && {
      group: "Actions",
      label: "Book a call",
      icon: LuCalendarClock,
      keywords: "meeting schedule calendar interview",
      run: () => window.open(bookingUrl, "_blank", "noopener"),
    },
    { group: "Actions", label: "Switch theme", icon: LuSunMoon, keywords: "dark light mode", run: () => toggleTheme() },
    ...SECTIONS.filter(([, id]) => document.getElementById(id)).map(([label, id, keywords]) => ({
      group: "Go to",
      label,
      icon: LuHash,
      keywords,
      run: () => scrollToId(id),
    })),
    ...projects.map((p) => ({
      group: "Projects",
      label: p.name,
      hint: p.tag,
      icon: LuFolder,
      keywords: `${p.role} ${p.stack}`,
      run: () => go(`/projects/${projectSlug(p)}`),
    })),
    ...socials
      .filter((s) => s.href)
      .map((s) => ({
        group: "Links",
        label: s.label,
        hint: s.handle,
        icon: s.label.toLowerCase() === "linkedin" ? LuBriefcase : LuLink,
        keywords: "social profile",
        run: () => window.open(s.href, "_blank", "noopener"),
      })),
  ];
  return items.filter(Boolean);
}

function matches(item, query) {
  const haystack = `${item.label} ${item.group} ${item.keywords || ""} ${item.hint || ""}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export default function CommandPalette(props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState("");
  const [items, setItems] = useState([]);
  const listRef = useRef(null);
  const returnFocus = useRef(null);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const results = useMemo(() => {
    const found = items.filter((item) => matches(item, query));
    const question = query.trim();
    if (question.length > 2) {
      found.push({
        group: "Ask",
        label: `Ask the assistant: “${question}”`,
        icon: LuMessageCircle,
        run: () => openChat({ question }),
      });
    }
    return found;
  }, [items, query]);

  useEffect(() => {
    const show = () => {
      returnFocus.current = document.activeElement;
      setItems(buildItems(props, router.push));
      setQuery("");
      setActive(0);
      setNotice("");
      setOpen(true);
    };
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (openRef.current) setOpen(false);
        else show();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, [props, router]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function close() {
    setOpen(false);
    returnFocus.current?.focus?.();
  }

  async function choose(item) {
    if (!item) return;
    track(`Palette: ${item.group}`);
    const message = await item.run();
    if (message) {
      setNotice(message);
      setTimeout(close, 900);
    } else {
      close();
    }
  }

  function onKeyDown(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[55] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search and quick actions"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/30"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <LuSearch aria-hidden className="shrink-0 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[active] ? `palette-${active}` : undefined}
                placeholder="Search projects, sections, or ask a question…"
                className="min-w-0 flex-1 bg-transparent py-4 text-base outline-none"
              />
              <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">Esc</kbd>
            </div>

            <ul id="palette-list" ref={listRef} role="listbox" data-lenis-prevent className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches.</li>}
              {results.map((item, i) => {
                const heading = i === 0 || results[i - 1].group !== item.group ? item.group : null;
                const Icon = item.icon;
                return (
                  <li key={`${item.group}-${item.label}`} role="presentation">
                    {heading && <p className="px-3 pb-1 pt-3 font-mono text-[11px] text-muted first:pt-1">{heading}</p>}
                    <div
                      id={`palette-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(item)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        i === active ? "bg-accent/15 text-accent" : ""
                      }`}
                    >
                      <Icon aria-hidden className="shrink-0 text-base" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.hint && <span className="hidden truncate text-xs text-muted sm:block">{item.hint}</span>}
                      {i === active && <LuCornerDownLeft aria-hidden className="shrink-0 text-xs" />}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[11px] text-muted">
              <span role="status">{notice || "↑↓ to move · Enter to open"}</span>
              <span className="hidden sm:inline">Ctrl K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
