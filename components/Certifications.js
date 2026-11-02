import { LuArrowUpRight } from "react-icons/lu";
import { Reveal } from "@/components/Motion";
import { ICONS } from "@/lib/icons";

function Card({ cert }) {
  const { Icon, color } = ICONS[cert.logo] || ICONS.award;
  const Tag = cert.href ? "a" : "div";
  const link = cert.href
    ? { href: cert.href, target: "_blank", rel: "noreferrer", "data-track": `Certificate: ${cert.name}` }
    : {};
  return (
    <Tag
      {...link}
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-accent"
    >
      <span
        className="flex size-14 items-center justify-center rounded-xl border border-line bg-background text-3xl transition-transform duration-300 group-hover:scale-105"
        style={{ color: color || undefined }}
      >
        <Icon aria-hidden />
      </span>
      <h3 className="mt-5 text-lg font-medium leading-snug tracking-tight">{cert.name}</h3>
      {cert.issuer && <p className="mt-1 text-sm text-muted">{cert.issuer}</p>}
      {cert.href && (
        <span className="mt-auto flex items-center gap-1 pt-4 text-sm text-accent">
          View certificate
          <LuArrowUpRight aria-hidden className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      )}
    </Tag>
  );
}

export default function Certifications({ certifications }) {
  if (!certifications.length) return null;
  return (
    <section id="certifications" className="scroll-mt-20 border-t border-line px-6 py-16 sm:px-10 sm:py-24">
      <h2 className="mb-10 font-mono text-sm text-muted">Certifications</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {certifications.map((cert, i) => (
          <li key={cert.name}>
            <Reveal delay={i * 0.08} className="h-full">
              <Card cert={cert} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
