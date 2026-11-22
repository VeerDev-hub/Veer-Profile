"use client";

import { openResume } from "@/lib/resume";

// A link to the PDF that opens the in-page viewer instead. Keeps the real href, so a
// middle-click, ctrl/cmd-click or a browser without JavaScript still opens the file.
export default function ResumeButton({ url, className, children }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-track="Resume"
      className={className}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openResume();
      }}
    >
      {children}
    </a>
  );
}
