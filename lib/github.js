import { cacheLife } from "next/cache";

export function githubUsername(socials) {
  const href = socials.find((s) => /github\.com/i.test(s.href))?.href;
  return href?.match(/github\.com\/([A-Za-z0-9-]+)/i)?.[1] ?? null;
}

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

// Reads the public calendar GitHub shows on profile pages, so no token is needed.
// Returns null if GitHub is unreachable or the markup changes, and the section hides.
export async function getContributions(username) {
  "use cache";
  cacheLife("hours");
  try {
    const res = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: { "User-Agent": "portfolio-site" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const counts = new Map();
    for (const [, id, label] of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
      counts.set(id, Number(label.match(/^(\d[\d,]*) contribution/)?.[1].replace(/,/g, "") ?? 0));
    }
    const days = [...html.matchAll(/<td[^>]*\bdata-date="[^"]+"[^>]*>/g)]
      .map(([tag]) => ({
        date: attr(tag, "data-date"),
        level: Number(attr(tag, "data-level")) || 0,
        count: counts.get(attr(tag, "id")) ?? 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (days.length < 7) return null;

    // Columns are Sunday-to-Saturday weeks, like GitHub's own graph.
    const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
    const weeks = [];
    days.forEach((day, i) => {
      const w = Math.floor((i + offset) / 7);
      (weeks[w] ??= Array(7).fill(null))[(i + offset) % 7] = day;
    });
    return { total: days.reduce((sum, d) => sum + d.count, 0), weeks };
  } catch (err) {
    console.error("GitHub contributions failed:", err.message);
    return null;
  }
}
