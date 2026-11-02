"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { endSession, isAdmin, passwordMatches, startSession } from "@/lib/auth";
import { defaultContent, HEADLINE_COLORS } from "@/lib/content";
import { ICONS } from "@/lib/icons";
import { tryLogin } from "@/lib/loginLock";
import { buildIndex, contentToMarkdown } from "@/lib/rag/build";
import { clearChatGaps, CONTENT_TAG, getKnowledge, readKey, writeKey } from "@/lib/store";

const MAX_PHOTO_CHARS = 1_400_000;

const text = (value, max = 500) => String(value ?? "").trim().slice(0, max);
const list = (value, max = 40) => (Array.isArray(value) ? value.slice(0, max) : []);

function safeUrl(value) {
  const url = text(value, 500);
  if (url && !/^https?:\/\//i.test(url)) throw new Error(`Links must start with http:// or https:// (${url})`);
  return url;
}

function safePath(value) {
  const url = text(value, 500);
  return url.startsWith("/") && !url.startsWith("//") ? url : safeUrl(url);
}

function cleanPhoto(value) {
  const photo = String(value ?? "");
  if (photo === defaultContent.photo) return photo;
  if (/^data:image\/(png|jpeg|webp);base64,/.test(photo) && photo.length <= MAX_PHOTO_CHARS) return photo;
  throw new Error("Photo must be a PNG, JPEG or WebP under 1 MB.");
}

function cleanContent(c) {
  const email = text(c.email, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!text(c.firstName, 60) || !text(c.lastName, 60)) throw new Error("Both name lines are required.");
  return {
    firstName: text(c.firstName, 60),
    lastName: text(c.lastName, 60),
    headline: list(c.headline, 5).map((l) => ({
      prefix: text(l.prefix, 6),
      text: text(l.text, 24),
      color: HEADLINE_COLORS.includes(l.color) ? l.color : "foreground",
    })).filter((l) => l.text),
    noteOne: text(c.noteOne, 80),
    noteTwo: text(c.noteTwo, 80),
    floatingTags: list(c.floatingTags, 3).map((t) => text(t, 24)).filter(Boolean),
    photo: cleanPhoto(c.photo),
    email,
    socials: list(c.socials, 10).map((s) => ({
      label: text(s.label, 40),
      href: safeUrl(s.href),
      handle: text(s.handle, 80),
    })).filter((s) => s.label && (s.href || s.handle)),
    resumeUrl: safePath(c.resumeUrl),
    projects: list(c.projects).map((p) => ({
      name: text(p.name, 80),
      tag: text(p.tag, 40),
      role: text(p.role, 200),
      stack: text(p.stack, 200),
      href: safeUrl(p.href),
      image: safePath(p.image),
      overview: text(p.overview, 800),
      built: text(p.built, 2000),
      outcome: text(p.outcome, 800),
    })).filter((p) => p.name),
    experience: list(c.experience, 12).map((e) => ({
      role: text(e.role, 100),
      company: text(e.company, 100),
      place: text(e.place, 60),
      period: text(e.period, 40),
      points: text(e.points, 1500),
    })).filter((e) => e.role),
    achievements: list(c.achievements, 20).map((a) => text(a, 160)).filter(Boolean),
    disciplines: list(c.disciplines, 10).map((d) => ({
      name: text(d.name, 60),
      text: text(d.text, 200),
      skills: list(d.skills).map((s) => ({
        name: text(s.name, 40),
        icon: s.icon in ICONS ? s.icon : "code",
      })).filter((s) => s.name),
    })).filter((d) => d.name),
    facts: list(c.facts, 8).map((f) => ({ value: text(f.value, 12), label: text(f.label, 80) })).filter((f) => f.value),
    suggestions: list(c.suggestions, 6).map((s) => text(s, 80)).filter(Boolean),
  };
}

export async function login(_state, formData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  try {
    const result = await tryLogin(ip, () => passwordMatches(formData.get("password")));
    if (result.ok) {
      await startSession();
      return { ok: true };
    }
    if (result.locked) {
      const unit = result.minutes === 1 ? "minute" : "minutes";
      return { locked: true, error: `Too many wrong passwords. Locked for ${result.minutes} ${unit}.` };
    }
    const unit = result.attemptsLeft === 1 ? "attempt" : "attempts";
    return { error: `Wrong password. ${result.attemptsLeft} ${unit} left.` };
  } catch (err) {
    console.error(err);
    return { error: "Login is unavailable right now." };
  }
}

export async function logout() {
  await endSession();
}

async function guarded(action) {
  if (!(await isAdmin())) return { error: "Your session expired. Reload and log in again." };
  try {
    return await action();
  } catch (err) {
    console.error(err);
    const readOnly = err.code === "EROFS" || err.code === "EACCES";
    return { error: readOnly ? "This server can't write files. Set DATABASE_URL to save edits." : err.message };
  }
}

async function rebuildChatbot(knowledge, content) {
  const index = await buildIndex(`${knowledge}\n\n${contentToMarkdown(content)}`, await readKey("rag"));
  await writeKey("rag", index);
  return index;
}

export async function saveContent(content) {
  return guarded(async () => {
    const clean = cleanContent(content);
    await writeKey("content", clean);
    updateTag(CONTENT_TAG);
    if (!process.env.GEMINI_API_KEY) return { ok: "Saved. The chatbot wasn't updated: GEMINI_API_KEY is not set." };
    try {
      await rebuildChatbot(await getKnowledge(), clean);
      return { ok: "Saved. The site and chatbot are updated." };
    } catch (err) {
      console.error(err);
      return { ok: "Saved. The site is updated, but the chatbot couldn't be rebuilt. Try again in a moment." };
    }
  });
}

export async function clearGaps() {
  return guarded(async () => {
    await clearChatGaps();
    return { ok: "Cleared." };
  });
}

export async function saveKnowledge(markdown, content) {
  return guarded(async () => {
    const source = String(markdown ?? "").slice(0, 100_000);
    if (!process.env.GEMINI_API_KEY) return { error: "GEMINI_API_KEY is not set." };
    if (!/^## /m.test(source)) return { error: 'Add at least one "## Heading" section.' };
    const index = await rebuildChatbot(source, cleanContent(content));
    await writeKey("knowledge", source);
    return { ok: `Chatbot rebuilt from ${index.chunks.length} sections.` };
  });
}
