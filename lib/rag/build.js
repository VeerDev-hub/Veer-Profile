import { GoogleGenAI } from "@google/genai";

export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";

// Unchanged sections reuse their embedding, so saving stays fast and light on quota.
export async function buildIndex(markdown, previous) {
  const known = new Map(
    previous?.model === EMBED_MODEL ? previous.chunks.map((c) => [`${c.source}\n${c.content}`, c.embedding]) : [],
  );
  const chunks = markdown
    .split(/^## /m)
    .filter((s) => s.trim())
    .map((section) => {
      const [title, ...body] = section.split("\n");
      return { source: title.trim(), content: body.join("\n").trim() };
    });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const chunk of chunks) {
    const text = `${chunk.source}\n${chunk.content}`;
    if (known.has(text)) {
      chunk.embedding = known.get(text);
      continue;
    }
    const res = await ai.models.embedContent({ model: EMBED_MODEL, contents: text });
    chunk.embedding = res.embeddings[0].values;
  }
  return { model: EMBED_MODEL, chunks };
}

export function contentToMarkdown(content) {
  const sections = content.projects.map((p) =>
    [
      `## Site: ${p.name}`,
      `${p.role}. Type: ${p.tag}. Built with: ${p.stack}.`,
      p.overview,
      p.built,
      p.outcome,
      p.href && `Link: ${p.href}`,
    ].filter(Boolean).join("\n"),
  );
  // Retrieval only sees a few sections, so "what has Veer built" needs one complete list.
  const projectList = content.projects.map((p) => `${p.name}: ${p.role}.`).join("\n");
  sections.push(`## Site: All projects\nThe ${content.projects.length} projects on this site:\n${projectList}`);
  if (content.experience.length) {
    const lines = content.experience.map((e) => `${e.role} at ${e.company}, ${e.place}, ${e.period}. ${e.points}`);
    sections.push(`## Site: Experience\n${lines.join("\n")}`);
  }
  if (content.achievements.length) {
    sections.push(`## Site: Achievements\n${content.achievements.join("\n")}`);
  }
  if (content.resumeUrl) {
    sections.push(`## Site: Resume\nVisitors can download the resume here: ${content.resumeUrl}. There is also a Resume button at the top of this site.`);
  }
  const skills = content.disciplines.map((d) => `${d.name}: ${d.skills.map((s) => s.name).join(", ")}.`);
  sections.push(`## Site: Skills\n${skills.join("\n")}`);
  return sections.join("\n\n");
}
