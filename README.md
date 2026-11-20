# Veer Pratap Singh — Portfolio

Personal portfolio with an AI assistant that answers questions about my work, built with Next.js and JavaScript.

## Features

- Animated intro, cursor-typed headline and an interactive Three.js particle globe
- Light and dark themes, custom cursor, responsive layout
- Project pages, experience, achievements and a downloadable resume
- RAG chatbot using Gemini embeddings, with source labels and a list of unanswered questions
- Recruiter mode: paste a job description and the chatbot explains the fit, citing projects
- Command palette (Ctrl+K or /) for sections, projects, links and quick actions
- Optional Book a call button that links to a Cal.com or Calendly page
- Password-protected admin panel for editing all site content without touching code
- Contact form that delivers email through Resend
- GitHub contribution graph, read from your public GitHub profile and refreshed hourly
- Login lockout and rate limits stored in Postgres
- Built-in analytics in the admin panel for views, visitors and clicks

## Tech stack

Next.js, React, Tailwind CSS, Motion, Lenis, Three.js, Google Gemini, PostgreSQL (Neon), Resend.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run ingest               # build the starter chatbot index
npm run dev
```

Open http://localhost:3000. The admin panel is at `/admin`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Chatbot answers and embeddings |
| `ADMIN_PASSWORD` | Turns on `/admin` |
| `DATABASE_URL` | Postgres connection. Without it, data is saved to `data/site.json` |
| `RESEND_API_KEY` | Sends contact form emails |
| `CONTACT_TO` | Optional address for contact messages. Until a domain is verified in Resend, it must be your Resend account's email |
| `CONTACT_FROM` | Optional sender on a domain verified in Resend. Defaults to `onboarding@resend.dev` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for SEO links |
| `CRON_SECRET` | Protects the weekly report route. Vercel sends it to the cron job automatically |
| `ANALYTICS_TIMEZONE` | Optional timezone for daily analytics totals. Defaults to `Asia/Kolkata` |

## Analytics

The admin panel shows page views, visitors, clicks, sources, countries and devices, stored in the site's own database for one year. No cookies are set on visitors. Only production deployments record events, and your own browser is skipped once you've logged in to `/admin`.

To see which link people used, add `?ref=` to the URL you share, such as `/?ref=linkedin`. To track another element, give it a `data-track="Label"` attribute.

## Weekly report

On Vercel, `vercel.json` schedules `/api/cron/weekly-report` for Mondays at 03:30 UTC (9:00 IST). It emails the last 7 days of views, sources, clicks and unanswered chatbot questions to `CONTACT_TO`, or the email set in `/admin`. Set `CRON_SECRET` in the Vercel project, or the route refuses every call. The admin panel has a button to send one now.

## Deploy

Deploy to Vercel, set the variables above, and enable Web Analytics in the project settings. A hosted deployment needs `DATABASE_URL`, because Vercel can't write to the local file store.
