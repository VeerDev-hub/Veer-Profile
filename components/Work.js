import Link from "next/link";
import { Reveal } from "@/components/Motion";
import { projectSlug } from "@/lib/content";

export default function Work({ projects }) {
  return (
    <section id="work" className="scroll-mt-20 px-6 py-16 sm:px-10 sm:py-24">
      <h2 className="mb-10 font-mono text-sm text-muted">Selected work</h2>
      <div className="border-t border-line">
        {projects.map((p) => (
          <Reveal key={p.name}>
            <Link href={`/projects/${projectSlug(p)}`} data-track={`Project: ${p.name}`} className="group grid gap-2 border-b border-line py-7 lg:grid-cols-[1.2fr_1fr_8rem] lg:items-baseline lg:gap-8">
              <h3 className="text-4xl font-medium tracking-tight transition duration-500 ease-out group-hover:translate-x-3 group-hover:text-accent sm:text-5xl">
                {p.name}
              </h3>
              <div>
                <p>{p.role}</p>
                <p className="mt-1 font-mono text-xs text-muted">{p.stack}</p>
              </div>
              <span className="font-mono text-xs text-muted lg:text-right">{p.tag}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
