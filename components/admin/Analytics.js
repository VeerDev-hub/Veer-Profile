"use client";

import { useState, useTransition } from "react";
import { loadAnalytics } from "@/app/admin/actions";
import { RANGES } from "@/lib/analytics";

const number = new Intl.NumberFormat("en-US");
const fullDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthDate = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

const plural = (count, word) => `${number.format(count)} ${word}${count === 1 ? "" : "s"}`;
const dateLabel = (date) => (date.length === 7 ? monthDate : fullDate).format(new Date(date));

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{number.format(value)}</p>
    </div>
  );
}

function Tooltip({ point, index, total }) {
  const center = ((index + 0.5) / total) * 100;
  return (
    <div
      className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-background px-2.5 py-1.5 text-xs shadow-lg"
      style={{ left: `clamp(4.5rem, ${center}%, calc(100% - 4.5rem))` }}
    >
      <p><strong className="font-semibold">{plural(point.views, "view")}</strong> · {plural(point.visitors, "visitor")}</p>
      <p className="text-muted">{dateLabel(point.date)}</p>
    </div>
  );
}

function ViewsChart({ series, monthly }) {
  const [hovered, setHovered] = useState(null);
  const peak = Math.max(...series.map((point) => point.views), 1);

  return (
    <figure>
      <figcaption className="text-sm font-medium">Views per {monthly ? "month" : "day"}</figcaption>
      <div className="mt-3 flex gap-2">
        <div aria-hidden className="flex h-36 flex-col justify-between text-right text-xs tabular-nums text-muted">
          <span>{number.format(peak)}</span>
          <span>0</span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="relative flex h-36 border-b border-t border-line"
            onPointerLeave={() => setHovered(null)}
          >
            {series.map((point, i) => (
              <div
                key={point.date}
                onPointerEnter={() => setHovered(i)}
                className="flex h-full min-w-0 flex-1 items-end justify-center px-px"
              >
                {point.views > 0 && (
                  <div
                    className={`w-full max-w-6 rounded-t bg-chart transition-opacity ${hovered === null || hovered === i ? "" : "opacity-50"}`}
                    style={{ height: `${(point.views / peak) * 100}%` }}
                  />
                )}
              </div>
            ))}
            {hovered !== null && <Tooltip point={series[hovered]} index={hovered} total={series.length} />}
          </div>
          <div aria-hidden className="mt-1.5 flex justify-between text-xs text-muted">
            <span>{dateLabel(series[0].date)}</span>
            <span>{dateLabel(series.at(-1).date)}</span>
          </div>
        </div>
      </div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs text-muted hover:text-accent">Show as a table</summary>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="py-1 font-normal">{monthly ? "Month" : "Date"}</th>
                <th scope="col" className="py-1 text-right font-normal">Views</th>
                <th scope="col" className="py-1 text-right font-normal">Visitors</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...series].reverse().map((point) => (
                <tr key={point.date} className="border-t border-line">
                  <td className="py-1">{dateLabel(point.date)}</td>
                  <td className="py-1 text-right">{number.format(point.views)}</td>
                  <td className="py-1 text-right">{number.format(point.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function Ranked({ title, rows }) {
  const peak = rows[0]?.count || 1;
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-medium">{title}</h3>
      {rows.length === 0 && <p className="mt-2 text-sm text-muted">Nothing yet.</p>}
      {rows.length > 0 && (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li key={row.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate" title={row.name}>{row.name}</span>
                <span className="tabular-nums text-muted">{number.format(row.count)}</span>
              </div>
              <div className="mt-1 h-1 rounded-sm bg-chart" style={{ width: `${(row.count / peak) * 100}%` }} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Analytics({ initial }) {
  const [data, setData] = useState(initial);
  const [days, setDays] = useState(initial?.days ?? 30);
  const [error, setError] = useState(initial ? "" : "Analytics couldn't be loaded. Try another range or reload the page.");
  const [pending, start] = useTransition();

  const pick = (nextDays) =>
    start(async () => {
      setDays(nextDays);
      setError("");
      try {
        const result = await loadAnalytics(nextDays);
        if (result.analytics) setData(result.analytics);
        else setError(result.error);
      } catch {
        setError("The request failed. Check your connection and try again.");
      }
    });

  return (
    <>
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <button
            key={range.days}
            type="button"
            aria-pressed={days === range.days}
            disabled={pending}
            onClick={() => pick(range.days)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              days === range.days ? "border-accent text-accent" : "border-line text-muted hover:text-accent"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
      {error && <p role="status" className="text-sm text-accent">{error}</p>}
      {data && (
        <div className={`space-y-6 transition-opacity ${pending ? "opacity-50" : ""}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Page views" value={data.views} />
            <Stat label="Visitors" value={data.visitors} />
            <Stat label="Clicks" value={data.clicks} />
            <Stat label="Resume opens" value={data.resume} />
          </div>
          <ViewsChart key={data.days} series={data.series} monthly={data.monthly} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Ranked title="What people clicked" rows={data.actions} />
            <Ranked title="Top pages" rows={data.pages} />
            <Ranked title="Where visits came from" rows={data.sources} />
            <Ranked title="Countries" rows={data.countries} />
            <Ranked title="Devices" rows={data.devices} />
          </div>
        </div>
      )}
    </>
  );
}
