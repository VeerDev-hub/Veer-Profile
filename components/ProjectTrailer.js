"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { LuPlay } from "react-icons/lu";
import { track } from "@/lib/track";
import { trailerSources } from "@/lib/trailers";

// Shows the cover first. Nothing is downloaded until someone presses play, so the page stays fast.
export default function ProjectTrailer({ name, image, video }) {
  const [playing, setPlaying] = useState(false);
  const [useEmbed, setUseEmbed] = useState(false);
  const [square, setSquare] = useState(false);
  const videoRef = useRef(null);
  const sources = trailerSources(video);

  if (!sources) {
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

  const file = useEmbed ? null : sources.file;

  function play() {
    track(`Trailer: ${name}`);
    setPlaying(true);
    // Started inside the tap itself: iPhones block sound if playback starts any later.
    // If it's still refused, the player's own controls are showing by then.
    videoRef.current?.play().catch(() => {});
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line bg-black ${
        playing && square ? "aspect-square sm:aspect-video" : "aspect-video"
      }`}
    >
      {file && (
        <video
          ref={videoRef}
          src={file}
          preload="none"
          poster={playing ? image || undefined : undefined}
          playsInline
          controls={playing}
          aria-label={`${name} trailer`}
          onLoadedMetadata={(e) => setSquare(e.currentTarget.videoWidth <= e.currentTarget.videoHeight)}
          onError={() => setUseEmbed(true)}
          className="absolute inset-0 size-full object-contain"
        />
      )}
      {playing && !file && (
        <iframe
          src={sources.embed}
          title={`${name} trailer`}
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      )}
      {!playing && (
        <button
          type="button"
          onClick={play}
          aria-label={`Play the ${name} trailer`}
          className="group absolute inset-0 block size-full overflow-hidden bg-black text-left"
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
      )}
    </div>
  );
}
