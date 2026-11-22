import Image from "next/image";
import { LuCalendarClock } from "react-icons/lu";
import HeroHeadline from "@/components/HeroHeadline";
import ParticleField from "@/components/ParticleField";
import ResumeButton from "@/components/ResumeButton";

export default function Hero({ content }) {
  const greeting = content.firstName.split(" ")[0];
  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 pb-10 pt-24 text-center">
      <ParticleField />

      <div className="hero-photo relative mb-5 flex items-center gap-3">
        <span className="block size-14 overflow-hidden rounded-full bg-accent/20 ring-1 ring-line sm:size-16">
          <Image
            src={content.photo}
            alt={`Portrait of ${content.firstName} ${content.lastName}`}
            width={640}
            height={640}
            loading="eager"
            sizes="128px"
            unoptimized={content.photo.startsWith("data:")}
            className="translate-y-[6%] scale-110"
          />
        </span>
        <span className="rounded-full border border-line bg-surface/70 px-5 py-2.5 text-lg backdrop-blur-sm sm:text-xl">
          Hello, I&apos;m {greeting}
        </span>
      </div>

      <HeroHeadline headline={content.headline} tags={content.floatingTags} />

      <div className="hero-pop relative mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <p className="font-mono text-sm text-muted">{"// "}{content.noteOne}</p>
        <a
          href="#contact"
          data-track="Let's Connect"
          className="flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-5 py-2.5 font-medium backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
        >
          <span className="relative flex size-2.5">
            <span className="chat-ping absolute inset-0 rounded-full bg-emerald-500" />
            <span className="relative size-2.5 rounded-full bg-emerald-500" />
          </span>
          Let&apos;s Connect
        </a>
        {content.bookingUrl && (
          <a
            href={content.bookingUrl}
            target="_blank"
            rel="noreferrer"
            data-track="Book a call"
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-medium text-white transition-transform hover:scale-105"
          >
            <LuCalendarClock aria-hidden /> Book a call
          </a>
        )}
        {content.resumeUrl && (
          <ResumeButton
            url={content.resumeUrl}
            className="rounded-full border border-line bg-surface/70 px-5 py-2.5 font-medium backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            Resume
          </ResumeButton>
        )}
        <p className="font-mono text-sm text-muted">{"// "}{content.noteTwo}</p>
      </div>
    </section>
  );
}
