import { Suspense } from "react";
import { Bricolage_Grotesque, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "lenis/dist/lenis.css";
import { Analytics } from "@vercel/analytics/next";
import Tracker from "@/components/Tracker";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const hindi = Noto_Sans_Devanagari({
  variable: "--font-hindi",
  subsets: ["devanagari"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Veer Pratap Singh — Full-stack & AI Developer", template: "%s — Veer Pratap Singh" },
  description: "Full-stack developer building AI into real products, from React and Node.js to machine learning and agentic AI.",
  openGraph: { type: "website", siteName: "Veer Pratap Singh" },
  twitter: { card: "summary_large_image" },
};

// Runs before paint so a saved theme never flashes and a seen intro never replays.
const THEME_SCRIPT = `try{var r=document.documentElement,t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))r.classList.add("dark");if(sessionStorage.getItem("intro-seen"))r.classList.add("skip-intro")}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${hindi.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-[70] -translate-y-20 rounded-lg bg-accent px-4 py-2 text-white transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        {children}
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
