"use client";

import { useState } from "react";
import { LuCheck, LuCopy, LuExternalLink, LuLink } from "react-icons/lu";
import { SiDiscord, SiGithub, SiInstagram, SiX } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";

const ICONS = {
  github: SiGithub,
  linkedin: FaLinkedin,
  instagram: SiInstagram,
  discord: SiDiscord,
  x: SiX,
  twitter: SiX,
};

const rowClass = "group flex w-full items-center gap-3 py-1.5 text-left transition-colors hover:text-accent";

function Badge({ label }) {
  const Icon = ICONS[label.toLowerCase()] || LuLink;
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-accent">
      <Icon aria-hidden />
    </span>
  );
}

function CopyHandle({ label, handle }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(handle);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const Hint = copied ? LuCheck : LuCopy;
  return (
    <button onClick={copy} aria-label={`Copy ${label} username ${handle}`} className={rowClass}>
      <Badge label={label} />
      <span role="status">{copied ? "Copied!" : label}</span>
      <Hint aria-hidden className="text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export default function SocialLinks({ socials }) {
  return (
    <ul className="space-y-1">
      {socials.map((s) => (
        <li key={s.label}>
          {s.href ? (
            <a href={s.href} target="_blank" rel="noreferrer" className={rowClass}>
              <Badge label={s.label} />
              {s.label}
              <LuExternalLink aria-hidden className="text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ) : (
            <CopyHandle label={s.label} handle={s.handle} />
          )}
        </li>
      ))}
    </ul>
  );
}
