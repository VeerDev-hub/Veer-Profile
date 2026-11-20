import { LuArrowUpRight } from "react-icons/lu";
import ContributionGraph from "@/components/ContributionGraph";
import { getContributions } from "@/lib/github";

export default async function GitHubActivity({ username }) {
  if (!username) return null;
  const data = await getContributions(username);
  if (!data) return null;

  return (
    <section id="github" className="scroll-mt-20 border-t border-line px-6 py-16 sm:px-10 sm:py-24">
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-mono text-sm text-muted">GitHub activity</h2>
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noreferrer"
          data-track="GitHub graph"
          className="group flex items-center gap-1 text-sm text-muted transition-colors hover:text-accent"
        >
          @{username}
          <LuArrowUpRight aria-hidden className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>
      <ContributionGraph total={data.total} weeks={data.weeks} />
    </section>
  );
}
