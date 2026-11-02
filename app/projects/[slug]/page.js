import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft, LuArrowUpRight } from "react-icons/lu";
import { projectSlug } from "@/lib/content";
import { getContent } from "@/lib/store";

async function findProject(params) {
  const { slug } = await params;
  const { projects } = await getContent();
  return projects.find((p) => projectSlug(p) === slug);
}

export async function generateStaticParams() {
  const { projects } = await getContent();
  return projects.map((p) => ({ slug: projectSlug(p) }));
}

export async function generateMetadata({ params }) {
  const project = await findProject(params);
  if (!project) return {};
  return { title: project.name, description: project.role };
}

function Block({ title, children }) {
  return (
    <section className="grid gap-2 border-t border-line py-7 md:grid-cols-[10rem_1fr] md:gap-8">
      <h2 className="font-mono text-sm text-muted">{title}</h2>
      <div className="text-lg leading-relaxed">{children}</div>
    </section>
  );
}

async function Project({ params }) {
  const project = await findProject(params);
  if (!project) notFound();
  return (
    <>
      <p className="font-mono text-xs text-muted">{project.tag}</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-7xl">
        {project.name}<span className="text-accent">.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-xl text-muted">{project.role}</p>
      {project.href && (
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          data-track={`Project site: ${project.name}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-medium text-white transition-transform hover:scale-105"
        >
          View project <LuArrowUpRight aria-hidden />
        </a>
      )}
      {project.image && (
        <Image
          src={project.image}
          alt={`Screenshot of ${project.name}`}
          width={1280}
          height={800}
          sizes="(min-width: 960px) 896px, 100vw"
          className="mt-10 rounded-2xl border border-line"
        />
      )}
      <div className="mt-10">
        {project.overview && <Block title="Overview"><p>{project.overview}</p></Block>}
        {project.built && (
          <Block title="What I built">
            <ul className="list-disc space-y-2 pl-5">
              {project.built.split("\n").filter(Boolean).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </Block>
        )}
        {project.outcome && <Block title="Outcome"><p>{project.outcome}</p></Block>}
        <Block title="Stack"><p>{project.stack}</p></Block>
      </div>
    </>
  );
}

export default function ProjectPage({ params }) {
  return (
    <main id="main" className="mx-auto max-w-4xl px-6 py-12 sm:py-20">
      <Link href="/#work" className="mb-10 inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
        <LuArrowLeft aria-hidden /> All projects
      </Link>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Project params={params} />
      </Suspense>
    </main>
  );
}
