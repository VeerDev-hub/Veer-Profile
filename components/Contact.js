import ContactForm from "@/components/ContactForm";
import { Reveal } from "@/components/Motion";

export default function Contact({ email }) {
  return (
    <section id="contact" className="scroll-mt-20 px-6 py-16 sm:px-10 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono text-sm text-muted">Get in touch</p>
          <h2 className="mt-4 text-5xl font-medium leading-tight tracking-tight sm:text-6xl">
            Let&apos;s build something<span className="text-accent">.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm email={email} />
        </Reveal>
      </div>
    </section>
  );
}
