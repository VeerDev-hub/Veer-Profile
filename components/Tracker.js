"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sendEvent, track } from "@/lib/track";

const isAdminPage = () => location.pathname.startsWith("/admin");

// Counts page views and clicks on any element marked with data-track.
export default function Tracker() {
  const pathname = usePathname();
  const landing = useRef(true);

  useEffect(() => {
    if (isAdminPage() || navigator.webdriver) return;
    const params = new URLSearchParams(location.search);
    sendEvent({
      type: "view",
      page: pathname,
      landing: landing.current,
      referrer: landing.current ? params.get("ref") || params.get("utm_source") || document.referrer : "",
    });
    landing.current = false;
  }, [pathname]);

  useEffect(() => {
    function onClick(e) {
      const name = e.target.closest?.("[data-track]")?.dataset.track;
      if (name && !isAdminPage() && !navigator.webdriver) track(name);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
