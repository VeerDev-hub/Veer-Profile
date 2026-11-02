# Veer Pratap Singh — Portfolio

Personal portfolio with an AI assistant that answers questions about my work, built with Next.js and JavaScript.

## Features

- Animated intro, cursor-typed headline and an interactive Three.js particle globe
- Light and dark themes, custom cursor, responsive layout
- Project pages, experience, achievements and a downloadable resume
- RAG chatbot using Gemini embeddings, with source labels and a list of unanswered questions
- Password-protected admin panel for editing all site content without touching code
- Contact form that delivers email through Resend
- Login lockout and rate limits stored in Postgres

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
| `CONTACT_TO` | Optional address for contact messages |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for SEO links |

## Deploy

Deploy to Vercel, set the variables above, and enable Web Analytics in the project settings. A hosted deployment needs `DATABASE_URL`, because Vercel can't write to the local file store.
