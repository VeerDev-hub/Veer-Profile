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
const hintClass = "shrink-0 text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100";

function Badge({ label }) {
  const Icon = ICONS[label.toLowerCase()] || LuLink;
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-accent">
      <Icon aria-hidden />
    </span>
  );
}

// Copies the username, and opens the app too when there's a link.
function CopyHandle({ social }) {
  const { label, href, handle } = social;
  const [copied, setCopied] = useState(false);
  const Tag = href ? "a" : "button";
  const link = href ? { href, target: "_blank", rel: "noreferrer" } : {};
  const Hint = copied ? LuCheck : LuCopy;

  function copy() {
    navigator.clipboard?.writeText(handle).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }, () => {});
  }

  return (
    <Tag {...link} onClick={copy} data-track={`Social: ${label}`} aria-label={`${label}: copy username ${handle}`} className={rowClass}>
      <Badge label={label} />
      <span className="min-w-0">
        <span className="block" role="status">{copied ? "Copied!" : label}</span>
        <span className="block truncate text-xs text-muted">{handle}</span>
      </span>
      <Hint aria-hidden className={hintClass} />
    </Tag>
  );
}

export default function SocialLinks({ socials }) {
  return (
    <ul className="space-y-1">
      {socials.map((s) => (
        <li key={s.label}>
          {s.handle ? (
            <CopyHandle social={s} />
          ) : (
            <a href={s.href} target="_blank" rel="noreferrer" data-track={`Social: ${s.label}`} className={rowClass}>
              <Badge label={s.label} />
              {s.label}
              <LuExternalLink aria-hidden className={hintClass} />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
