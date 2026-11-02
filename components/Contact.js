import ContactForm from "@/components/ContactForm";
import { Reveal } from "@/components/Motion";

export default function Contact({ email, socials, name }) {
  return (
    <footer id="contact" className="scroll-mt-20 px-6 pb-28 pt-16 sm:px-10 sm:pt-28">
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono text-sm text-muted">Get in touch</p>
          <h2 className="mt-4 text-5xl font-medium leading-tight tracking-tight sm:text-6xl">
            Let&apos;s build something<span className="text-accent">.</span>
          </h2>
          <a href={`mailto:${email}`} className="mt-6 inline-block text-base text-muted sm:text-lg transition-colors hover:text-accent">
            {email}
          </a>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm email={email} />
        </Reveal>
      </div>
      <div className="mt-20 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-muted">
        <span>{name}</span>
        <span className="-my-2 flex gap-4">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="py-2 hover:text-accent">
              {s.label}
            </a>
          ))}
        </span>
      </div>
    </footer>
  );
}
