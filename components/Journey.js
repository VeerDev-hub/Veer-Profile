import { LuDownload } from "react-icons/lu";
import { Reveal } from "@/components/Motion";

export default function Journey({ experience, achievements, resumeUrl }) {
  return (
    <section id="experience" className="scroll-mt-20 border-t border-line px-6 py-16 sm:px-10 sm:py-24">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-mono text-sm text-muted">Experience</h2>
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
          >
            <LuDownload aria-hidden /> Download resume
          </a>
        )}
      </div>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-10">
          {experience.map((e) => (
            <Reveal key={`${e.company}-${e.role}`}>
              <p className="font-mono text-xs text-muted">{e.period}</p>
              <h3 className="mt-2 text-3xl font-medium tracking-tight">{e.role}</h3>
              <p className="mt-1 text-accent">{e.company} · {e.place}</p>
              <ul className="mt-4 space-y-2 text-muted">
                {e.points.split("\n").filter(Boolean).map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <h3 className="text-3xl font-medium tracking-tight">Beyond work</h3>
          <ul className="mt-4 divide-y divide-line">
            {achievements.map((item) => (
              <li key={item} className="py-3 text-muted">{item}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
