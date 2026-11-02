import { LuArrowUp } from "react-icons/lu";
import { Reveal } from "@/components/Motion";
import SocialLinks from "@/components/SocialLinks";

const EXPLORE = [
  ["Work", "#work"],
  ["Experience", "#experience"],
  ["Skills", "#skills"],
  ["Contact", "#contact"],
];

function Heading({ children }) {
  return <h2 className="mb-4 font-mono text-xs text-muted">{children}</h2>;
}

export default function Footer({ content }) {
  const name = `${content.firstName} ${content.lastName}`;
  return (
    <footer className="overflow-hidden border-t border-line px-6 pb-10 pt-14 sm:px-10">
      <div className="grid grid-cols-2 gap-10 lg:grid-cols-[2fr_1fr_1fr]">
        <Reveal className="col-span-2 lg:col-span-1">
          <p className="max-w-sm text-2xl font-medium leading-snug tracking-tight">{content.noteOne}.</p>
          <a
            href={`mailto:${content.email}`}
            data-track="Email link"
            className="mt-4 inline-block text-muted transition-colors hover:text-accent"
          >
            {content.email}
          </a>
        </Reveal>

        <Reveal delay={0.08}>
          <nav aria-label="Footer">
            <Heading>Explore</Heading>
            <ul className="space-y-1">
              {EXPLORE.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="group inline-flex items-center py-1 transition-colors hover:text-accent">
                    <span className="h-px w-0 bg-accent transition-all duration-300 group-hover:mr-2 group-hover:w-4" />
                    {label}
                  </a>
                </li>
              ))}
              {content.resumeUrl && (
                <li>
                  <a
                    href={content.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-track="Resume"
                    className="group inline-flex items-center py-1 transition-colors hover:text-accent"
                  >
                    <span className="h-px w-0 bg-accent transition-all duration-300 group-hover:mr-2 group-hover:w-4" />
                    Resume
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </Reveal>

        <Reveal delay={0.16}>
          <Heading>Connect</Heading>
          <SocialLinks socials={content.socials} />
        </Reveal>
      </div>

      <Reveal>
        <p
          aria-hidden
          className="footer-name mt-14 whitespace-nowrap text-center text-[8.6vw] font-bold uppercase leading-none tracking-tighter"
        >
          {name}
        </p>
      </Reveal>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 pr-20 font-mono text-xs text-muted">
        <span>© {name}</span>
        <a href="#main" className="group flex items-center gap-1.5 py-1 transition-colors hover:text-accent">
          Back to top
          <LuArrowUp aria-hidden className="transition-transform group-hover:-translate-y-0.5" />
        </a>
      </div>
    </footer>
  );
}
