import { projectSlug } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { getContent } from "@/lib/store";

export default async function sitemap() {
  const { projects } = await getContent();
  return [
    { url: SITE_URL, priority: 1 },
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${projectSlug(p)}`, priority: 0.7 })),
  ];
}
