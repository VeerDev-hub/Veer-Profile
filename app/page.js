import Certifications from "@/components/Certifications";
import ChatWidget from "@/components/ChatWidget";
import CommandPalette from "@/components/CommandPalette";
import Contact from "@/components/Contact";
import Cursor from "@/components/Cursor";
import Footer from "@/components/Footer";
import GitHubActivity from "@/components/GitHubActivity";
import Hero from "@/components/Hero";
import Journey from "@/components/Journey";
import { SmoothScroll } from "@/components/Motion";
import Nav from "@/components/Nav";
import Preloader from "@/components/Preloader";
import Skills from "@/components/Skills";
import Work from "@/components/Work";
import { githubUsername } from "@/lib/github";
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
    sameAs: content.socials.map((s) => s.href).filter(Boolean),
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
        <Journey
          experience={content.experience}
          achievements={content.achievements}
          resumeUrl={content.resumeUrl}
        />
        <Certifications certifications={content.certifications} />
        <Skills disciplines={content.disciplines} facts={content.facts} />
        <GitHubActivity username={githubUsername(content.socials)} />
        <Contact email={content.email} bookingUrl={content.bookingUrl} />
      </main>
      <Footer content={content} />
      <CommandPalette
        projects={content.projects}
        email={content.email}
        resumeUrl={content.resumeUrl}
        bookingUrl={content.bookingUrl}
        socials={content.socials}
      />
      <ChatWidget suggestions={content.suggestions} photo={content.photo} name={content.firstName.split(" ")[0]} />
    </SmoothScroll>
  );
}
