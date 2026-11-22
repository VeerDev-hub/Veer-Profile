"use client";

import { useState } from "react";
import Image from "next/image";
import { LuPlay } from "react-icons/lu";
import { track } from "@/lib/track";

// Accepts a Google Drive share link (…/file/d/<id>/view, …?id=<id>) or a bare file id.
function driveId(link) {
  const match = /\/d\/([\w-]{20,})/.exec(link) || /[?&]id=([\w-]{20,})/.exec(link) || /^([\w-]{20,})$/.exec(link.trim());
  return match?.[1];
}

// Shows the thumbnail and title first. The Drive player only loads once someone asks for it,
// so the page stays fast and Drive isn't contacted for visitors who never press play.
export default function ProjectTrailer({ name, image, video }) {
  const [playing, setPlaying] = useState(false);
  const id = video ? driveId(video) : null;

  if (!id) {
    return image ? (
      <Image
        src={image}
        alt={`Screenshot of ${name}`}
        width={1280}
        height={720}
        sizes="(min-width: 960px) 896px, 100vw"
        className="aspect-video w-full rounded-2xl border border-line bg-black object-contain"
      />
    ) : null;
  }

  if (playing) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-black">
        <iframe
          src={`https://drive.google.com/file/d/${id}/preview`}
          title={`${name} trailer`}
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          className="size-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        track(`Trailer: ${name}`);
        setPlaying(true);
      }}
      aria-label={`Play the ${name} trailer`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black text-left"
    >
      {image && (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 960px) 896px, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      )}
      {/* The cover already carries the project's name, so the overlay is just a play control
          in the corner, away from the logo. */}
      <span
        aria-hidden
        className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-accent py-2 pl-2.5 pr-4 text-sm font-medium text-white shadow-lg shadow-black/40 transition-transform group-hover:scale-105 sm:bottom-5 sm:left-5 sm:py-2.5 sm:pl-3 sm:pr-5 sm:text-base"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-white/20 sm:size-8">
          <LuPlay className="translate-x-px" />
        </span>
        Watch trailer
      </span>
    </button>
  );
}
