import ChatWidget from "@/components/ChatWidget";
import Contact from "@/components/Contact";
import Cursor from "@/components/Cursor";
import Hero from "@/components/Hero";
import Journey from "@/components/Journey";
import { SmoothScroll } from "@/components/Motion";
import Nav from "@/components/Nav";
import Preloader from "@/components/Preloader";
import Skills from "@/components/Skills";
import Work from "@/components/Work";
import { SITE_URL } from "@/lib/site";
import { getContent } from "@/lib/store";

export default async function Home() {
  const content = await getContent();
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${content.firstName} ${content.lastName}`,
    url: SITE_URL,
    jobTitle: "Full-stack Developer",
    sameAs: content.socials.map((s) => s.href),
  };
  return (
    <SmoothScroll>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }}
      />
      <Preloader />
      <Cursor />
      <Nav />
      <main id="main">
        <Hero content={content} />
        <Work projects={content.projects} />
        <Journey experience={content.experience} achievements={content.achievements} resumeUrl={content.resumeUrl} />
        <Skills disciplines={content.disciplines} facts={content.facts} />
      </main>
      <Contact email={content.email} socials={content.socials} name={`${content.firstName} ${content.lastName}`} />
      <ChatWidget suggestions={content.suggestions} photo={content.photo} name={content.firstName.split(" ")[0]} />
    </SmoothScroll>
  );
}
