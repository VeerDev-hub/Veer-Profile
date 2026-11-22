"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LuDownload, LuX } from "react-icons/lu";
import { track } from "@/lib/track";

// pdf.js and its worker are only fetched the first time someone opens the resume.
let pdfjsPromise;
function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), {
      type: "module",
    });
    return pdfjs;
  });
  return pdfjsPromise;
}

// Draws every page to a canvas, then lays the PDF's own links over it so they stay clickable.
function Pages({ url, onError }) {
  const ref = useRef(null);
  const [pages, setPages] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let task;
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        if (cancelled) return;
        task = pdfjs.getDocument({ url });
        const doc = await task.promise;
        const width = Math.min(ref.current?.clientWidth || 800, 900);
        const ratio = Math.min(window.devicePixelRatio || 1, 2) * 1.5; // extra resolution for pinch-zoom
        const rendered = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport }).promise;
          const links = (await page.getAnnotations())
            .filter((a) => a.subtype === "Link" && a.url)
            .map((a) => {
              const [x1, y1] = viewport.convertToViewportPoint(a.rect[0], a.rect[1]);
              const [x2, y2] = viewport.convertToViewportPoint(a.rect[2], a.rect[3]);
              return {
                url: a.url,
                left: (Math.min(x1, x2) / viewport.width) * 100,
                top: (Math.min(y1, y2) / viewport.height) * 100,
                width: (Math.abs(x2 - x1) / viewport.width) * 100,
                height: (Math.abs(y2 - y1) / viewport.height) * 100,
              };
            });
          rendered.push({ src: canvas.toDataURL("image/png"), ratio: viewport.width / viewport.height, links });
        }
        if (!cancelled) setPages(rendered);
      } catch (err) {
        if (cancelled) return; // closing the viewer mid-render aborts the task; that isn't an error
        console.error(err);
        onError();
      }
    })();
    return () => {
      cancelled = true;
      task?.destroy();
    };
  }, [url, onError]);

  return (
    <div ref={ref} className="mx-auto w-full max-w-3xl space-y-4">
      {pages
        ? pages.map((p, i) => (
            <div key={i} className="relative overflow-hidden rounded-sm bg-white shadow-2xl shadow-black/40" style={{ aspectRatio: p.ratio }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a generated data URL, nothing for next/image to optimise */}
              <img src={p.src} alt={i === 0 ? "Resume" : `Resume, page ${i + 1}`} className="size-full select-none" draggable={false} />
              {p.links.map((l) => (
                <a
                  key={`${l.url}-${l.top}-${l.left}`}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={l.url.replace(/^mailto:/, "")}
                  className="absolute rounded-sm hover:bg-accent/15"
                  style={{ left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` }}
                />
              ))}
            </div>
          ))
        : (
          <div className="aspect-[8.5/11] w-full animate-pulse rounded-sm bg-white/90 shadow-2xl shadow-black/40" aria-label="Loading resume" />
        )}
    </div>
  );
}

export default function ResumeViewer({ url, name }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef(null);
  const onError = useCallback(() => setFailed(true), []);
  const fileName = `${name.replace(/\s+/g, "-")}-Resume.pdf`;

  useEffect(() => {
    const onOpen = () => {
      setFailed(false);
      setOpen(true);
      track("Resume viewed");
    };
    window.addEventListener("open-resume", onOpen);
    return () => window.removeEventListener("open-resume", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${name}'s resume`}
          data-lenis-prevent
          className="fixed inset-0 z-[60] flex flex-col bg-black/75 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3 text-white sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{name}</p>
              <p className="text-xs text-white/60">Resume · PDF</p>
            </div>
            <a
              href={url}
              download={fileName}
              data-track="Resume download"
              className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
            >
              <LuDownload aria-hidden /> <span>Download<span className="hidden sm:inline"> PDF</span></span>
            </a>
            <button
              ref={closeRef}
              onClick={() => setOpen(false)}
              aria-label="Close resume"
              className="flex size-9 items-center justify-center rounded-full text-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LuX />
            </button>
          </div>
          <motion.div
            className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6 sm:py-8"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            {failed ? (
              <div className="mx-auto mt-16 max-w-sm text-center text-white">
                <p className="font-medium">The preview couldn&apos;t load.</p>
                <a href={url} download={fileName} className="mt-3 inline-flex items-center gap-2 text-accent underline">
                  <LuDownload aria-hidden /> Download the PDF instead
                </a>
              </div>
            ) : (
              <Pages url={url} onError={onError} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
