"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

const LEVELS = ["bg-line/70", "bg-accent/30", "bg-accent/55", "bg-accent/80", "bg-accent"];
const WAVE_MS = 9; // Delay per step of the diagonal wave across the grid.
const number = new Intl.NumberFormat("en-US");
const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// A label where each month starts, skipped when it would crowd the previous one.
function monthLabels(weeks) {
  let lastMonth = "";
  let lastAt = -3;
  return weeks.map((week, w) => {
    const first = week.find(Boolean);
    const key = first?.date.slice(0, 7);
    if (!key || key === lastMonth) return "";
    lastMonth = key;
    if (w - lastAt < 3) return "";
    lastAt = w;
    return month.format(new Date(first.date));
  });
}

function CountUp({ value, start }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!start || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (n) => {
        if (ref.current) ref.current.textContent = number.format(Math.round(n));
      },
    });
    return () => controls.stop();
  }, [start, value]);
  return <span ref={ref}>{number.format(value)}</span>;
}

export default function ContributionGraph({ total, weeks }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState(null);
  const labels = monthLabels(weeks);
  const busiest = weeks.flat().filter(Boolean).reduce((best, d) => (d.count > (best?.count ?? 0) ? d : best), null);

  // Cells stay visible until JavaScript runs, so the graph never disappears without it.
  useEffect(() => {
    ref.current.dataset.armed = "";
  }, []);

  return (
    <div ref={ref} data-inview={inView || undefined} className="contrib">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-6xl font-medium tracking-tight tabular-nums sm:text-8xl">
            <CountUp value={total} start={inView} />
            <span className="text-accent">.</span>
          </p>
          <p className="mt-2 text-muted">contributions in the last year</p>
        </div>
        <p aria-live="polite" className="min-h-5 font-mono text-xs text-muted sm:text-right">
          {hovered
            ? `${hovered.count} contribution${hovered.count === 1 ? "" : "s"} on ${longDate.format(new Date(hovered.date))}`
            : busiest && `Busiest day: ${busiest.count} on ${longDate.format(new Date(busiest.date))}`}
        </p>
      </div>

      {/* Reversed so narrow screens start scrolled to the newest weeks. */}
      <div aria-hidden className="mt-10 flex flex-row-reverse overflow-x-auto pb-3">
        <div
          className="grid w-full min-w-[46rem] shrink-0 gap-[3px] sm:gap-1"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
          onPointerLeave={() => setHovered(null)}
        >
          {weeks.map((week, w) => (
            <div key={w} className="flex flex-col gap-[3px] sm:gap-1">
              <span className="h-5 w-0 whitespace-nowrap font-mono text-[10px] leading-none text-muted sm:text-xs">
                {labels[w]}
              </span>
              {week.map((day, d) =>
                day ? (
                  <span
                    key={day.date}
                    onPointerEnter={() => setHovered(day)}
                    className={`contrib-cell aspect-square w-full rounded-[3px] sm:rounded-[4px] ${LEVELS[day.level] || LEVELS[0]} ${day.level === 4 ? "contrib-hot" : ""}`}
                    style={{ "--d": `${(w + d) * WAVE_MS}ms` }}
                  />
                ) : (
                  <span key={d} className="aspect-square w-full" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-muted sm:text-xs">
        Less
        {LEVELS.map((level) => <span key={level} className={`size-3 rounded-[3px] ${level}`} />)}
        More
      </div>
    </div>
  );
}
