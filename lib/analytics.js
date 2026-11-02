export const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
];

const MONTHLY_FROM_DAYS = 90;
const TOP_ROWS = 12;

// Days roll over at midnight here, not at UTC midnight on the server.
const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: process.env.ANALYTICS_TIMEZONE || "Asia/Kolkata",
}).format;

const regions = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code) => (/^[A-Z]{2}$/.test(code) ? regions.of(code) : "Unknown");

function daysBack(today, count) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - count);
  return date.toISOString().slice(0, 10);
}

function top(events, pick) {
  const counts = new Map();
  for (const event of events) {
    const name = pick(event);
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, TOP_ROWS);
}

export function summarize(events, days, now) {
  const today = dayKey(now);
  const first = daysBack(today, days - 1);
  const dated = events.map((event) => ({ ...event, day: dayKey(event.at) })).filter((e) => e.day >= first && e.day <= today);
  const views = dated.filter((e) => e.type === "view");
  const clicks = dated.filter((e) => e.type === "click");
  const visits = views.filter((e) => e.source);

  const monthly = days > MONTHLY_FROM_DAYS;
  const bucketOf = (day) => (monthly ? day.slice(0, 7) : day);
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(bucketOf(daysBack(today, i)), { views: 0, visitors: new Set() });
  }
  for (const view of views) {
    const bucket = buckets.get(bucketOf(view.day));
    bucket.views += 1;
    bucket.visitors.add(view.visitor);
  }

  return {
    days,
    monthly,
    views: views.length,
    visitors: new Set(views.map((e) => e.visitor)).size,
    clicks: clicks.length,
    resume: clicks.filter((e) => e.name === "Resume").length,
    series: [...buckets].map(([date, b]) => ({ date, views: b.views, visitors: b.visitors.size })),
    pages: top(views, (e) => e.name),
    actions: top(clicks, (e) => e.name),
    sources: top(visits, (e) => e.source),
    devices: top(visits, (e) => e.device),
    countries: top(visits, (e) => countryName(e.country)),
  };
}
