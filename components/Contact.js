import { LuArrowUpRight, LuCalendarClock } from "react-icons/lu";
import ContactForm from "@/components/ContactForm";
import { Reveal } from "@/components/Motion";

export default function Contact({ email, bookingUrl }) {
  return (
    <section id="contact" className="scroll-mt-20 px-6 py-16 sm:px-10 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono text-sm text-muted">Get in touch</p>
          <h2 className="mt-4 text-5xl font-medium leading-tight tracking-tight sm:text-6xl">
            Let&apos;s build something<span className="text-accent">.</span>
          </h2>
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              data-track="Book a call"
              className="group mt-8 flex max-w-sm items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-2xl text-accent">
                <LuCalendarClock aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Prefer to talk?</span>
                <span className="block text-sm text-muted">Book a call at a time that suits you</span>
              </span>
              <LuArrowUpRight aria-hidden className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </a>
          )}
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm email={email} />
        </Reveal>
      </div>
    </section>
  );
}
