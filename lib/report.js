import { escapeHtml, ownerEmail, sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { getAnalytics, getChatGaps } from "@/lib/store";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROWS = 5;
const number = new Intl.NumberFormat("en-US");

function change(now, before) {
  if (!before) return now ? "new this week" : "same as last week";
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return "same as last week";
  return `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs last week`;
}

function listText(title, rows) {
  if (!rows.length) return "";
  return `\n${title}\n${rows.slice(0, ROWS).map((r) => `  ${r.name}: ${r.count}`).join("\n")}\n`;
}

function listHtml(title, rows) {
  if (!rows.length) return "";
  const items = rows
    .slice(0, ROWS)
    .map((r) => `<tr><td style="padding:4px 0">${escapeHtml(r.name)}</td><td style="padding:4px 0;text-align:right;color:#6f6b5e">${number.format(r.count)}</td></tr>`)
    .join("");
  return `<h3 style="margin:24px 0 6px;font-size:14px">${title}</h3><table style="width:100%;border-collapse:collapse;font-size:14px">${items}</table>`;
}

// Last 7 days against the 7 before, plus the questions the chatbot couldn't answer.
export async function buildWeeklyReport() {
  const [week, fortnight, gaps] = await Promise.all([
    getAnalytics(7),
    getAnalytics(14),
    getChatGaps(Date.now() - 7 * DAY_MS),
  ]);
  const lastWeekViews = fortnight.series.slice(0, 7).reduce((sum, d) => sum + d.views, 0);

  const stats = [
    ["Page views", week.views, change(week.views, lastWeekViews)],
    ["Visitors", week.visitors, ""],
    ["Clicks", week.clicks, ""],
    ["Resume opens", week.resume, ""],
  ];
  const gapRows = gaps.slice(0, 8);

  const text = [
    `Your portfolio this week (${SITE_URL})`,
    "",
    ...stats.map(([label, value, note]) => `${label}: ${number.format(value)}${note ? ` (${note})` : ""}`),
    listText("Where visits came from", week.sources),
    listText("What people clicked", week.actions),
    listText("Countries", week.countries),
    gapRows.length ? `\nQuestions the chatbot couldn't answer\n${gapRows.map((q) => `  - ${q}`).join("\n")}\n` : "",
    `\nFull stats: ${SITE_URL}/admin`,
  ].join("\n");

  const tiles = stats
    .map(
      ([label, value, note]) => `<td style="padding:12px;border:1px solid #d6d1c3;border-radius:10px;width:25%">
        <div style="font-size:12px;color:#6f6b5e">${label}</div>
        <div style="font-size:24px;font-weight:600;margin-top:4px">${number.format(value)}</div>
        ${note ? `<div style="font-size:11px;color:#c2410c;margin-top:2px">${note}</div>` : ""}
      </td>`,
    )
    .join("");
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#16150f">
    <h2 style="margin:0 0 4px">Your portfolio this week</h2>
    <p style="margin:0 0 20px;color:#6f6b5e;font-size:14px">The last 7 days on ${escapeHtml(SITE_URL)}</p>
    <table style="width:100%;border-spacing:6px"><tr>${tiles}</tr></table>
    ${listHtml("Where visits came from", week.sources)}
    ${listHtml("What people clicked", week.actions)}
    ${listHtml("Countries", week.countries)}
    ${gapRows.length ? `<h3 style="margin:24px 0 6px;font-size:14px">Questions the chatbot couldn't answer</h3><ul style="margin:0;padding-left:18px;font-size:14px">${gapRows.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ul>` : ""}
    <p style="margin-top:28px"><a href="${escapeHtml(SITE_URL)}/admin" style="color:#c2410c">Open the full stats</a></p>
  </div>`;

  return { subject: `Portfolio weekly: ${number.format(week.views)} views, ${number.format(week.visitors)} visitors`, text, html };
}

export async function sendWeeklyReport() {
  const report = await buildWeeklyReport();
  return sendEmail({ to: await ownerEmail(), ...report });
}
