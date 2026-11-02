"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LuArrowDown, LuArrowUp, LuPlus, LuTrash2 } from "react-icons/lu";
import { clearGaps, logout, saveContent, saveKnowledge } from "@/app/admin/actions";
import { HEADLINE_COLORS } from "@/lib/content";
import { ICONS } from "@/lib/icons";

const MAX_PHOTO_BYTES = 1_000_000;
const inputClass = "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const iconButton = "rounded-md p-1.5 text-muted transition-colors hover:bg-accent/15 hover:text-accent disabled:opacity-30";

function Field({ label, value, onChange, multiline, placeholder }) {
  const Control = multiline ? "textarea" : "input";
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted">{label}</span>
      <Control
        value={value}
        placeholder={placeholder}
        rows={multiline ? 3 : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function Section({ title, hint, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-lg font-medium">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ListEditor({ items, onChange, blank, addLabel, render }) {
  const set = (i, item) => onChange(items.map((x, j) => (j === i ? item : x)));
  const move = (i, by) => {
    const next = [...items];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-xl border border-line p-3">
          <div className="min-w-0 flex-1 space-y-3">{render(item, (next) => set(i, next))}</div>
          <div className="flex flex-col">
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className={iconButton}>
              <LuArrowUp />
            </button>
            <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)} className={iconButton}>
              <LuArrowDown />
            </button>
            <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))} className={iconButton}>
              <LuTrash2 />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, blank])}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted hover:border-accent hover:text-accent"
      >
        <LuPlus /> {addLabel}
      </button>
    </div>
  );
}

export default function AdminPanel({ initialContent, initialKnowledge, initialGaps }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [knowledge, setKnowledge] = useState(initialKnowledge);
  const [gaps, setGaps] = useState(initialGaps);
  const [status, setStatus] = useState(null);
  const [pending, start] = useTransition();
  const set = (key) => (value) => setContent((c) => ({ ...c, [key]: value }));

  const run = (action) =>
    start(async () => {
      setStatus(null);
      try {
        setStatus(await action());
      } catch {
        setStatus({ error: "The request failed. Check your connection and try again." });
      }
    });

  function pickPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setStatus({ error: "Photo must be under 1 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("photo")(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-5 pb-16 sm:p-8">
      <header className="sticky top-0 z-10 -mx-2 flex flex-wrap items-center gap-3 rounded-b-xl bg-background/90 px-2 py-3 backdrop-blur">
        <h1 className="mr-auto text-2xl font-medium tracking-tight">Site admin</h1>
        <a href="/" target="_blank" className="text-sm text-muted hover:text-accent">View site</a>
        <button
          onClick={() => start(async () => { await logout(); router.refresh(); })}
          className="text-sm text-muted hover:text-accent"
        >
          Log out
        </button>
        <button
          disabled={pending}
          onClick={() => run(() => saveContent(content))}
          className="rounded-lg bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Working…" : "Save changes"}
        </button>
        {status && (
          <p role="status" className={`w-full text-sm ${status.error ? "text-accent" : "text-muted"}`}>
            {status.error || status.ok}
          </p>
        )}
      </header>

      <Section title="Profile">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name, first line" value={content.firstName} onChange={set("firstName")} />
          <Field label="Name, second line" value={content.lastName} onChange={set("lastName")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Hero note, left" value={content.noteOne} onChange={set("noteOne")} />
          <Field label="Hero note, right" value={content.noteTwo} onChange={set("noteTwo")} />
        </div>
        <Field label="Email" value={content.email} onChange={set("email")} />
        <Field label="Resume link (leave empty to hide the button)" value={content.resumeUrl} onChange={set("resumeUrl")} />
        <label className="block space-y-1">
          <span className="text-xs text-muted">Photo (transparent PNG works best, under 1 MB)</span>
          <span className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.photo} alt="" className="size-14 shrink-0 rounded-full bg-background object-cover" />
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickPhoto} className="min-w-0 flex-1 text-sm" />
          </span>
        </label>
      </Section>

      <Section title="Hero headline" hint="Keep each line short so it stays large.">
        <ListEditor
          items={content.headline}
          onChange={set("headline")}
          blank={{ prefix: "", text: "", color: "foreground" }}
          addLabel="Add line"
          render={(line, update) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_3fr_2fr]">
              <Field label="Prefix" value={line.prefix} onChange={(prefix) => update({ ...line, prefix })} />
              <Field label="Text" value={line.text} onChange={(text) => update({ ...line, text })} />
              <label className="block space-y-1">
                <span className="text-xs text-muted">Color</span>
                <select value={line.color} onChange={(e) => update({ ...line, color: e.target.value })} className={inputClass}>
                  {HEADLINE_COLORS.map((color) => <option key={color}>{color}</option>)}
                </select>
              </label>
            </div>
          )}
        />
        <ListEditor
          items={content.floatingTags}
          onChange={set("floatingTags")}
          blank=""
          addLabel="Add floating tag"
          render={(tag, update) => <Field label="Floating tag (first three show)" value={tag} onChange={update} />}
        />
      </Section>

      <Section title="Social links">
        <ListEditor
          items={content.socials}
          onChange={set("socials")}
          blank={{ label: "", href: "" }}
          addLabel="Add link"
          render={(s, update) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <Field label="Label" value={s.label} onChange={(label) => update({ ...s, label })} />
              <Field label="URL" value={s.href} placeholder="https://" onChange={(href) => update({ ...s, href })} />
            </div>
          )}
        />
      </Section>

      <Section title="Projects">
        <ListEditor
          items={content.projects}
          onChange={set("projects")}
          blank={{ name: "", tag: "", role: "", stack: "", href: "", image: "", overview: "", built: "", outcome: "" }}
          addLabel="Add project"
          render={(p, update) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" value={p.name} onChange={(name) => update({ ...p, name })} />
                <Field label="Tag" value={p.tag} onChange={(tag) => update({ ...p, tag })} />
              </div>
              <Field label="One-line description" value={p.role} onChange={(role) => update({ ...p, role })} />
              <Field label="Tech stack" value={p.stack} onChange={(stack) => update({ ...p, stack })} />
              <Field label="Link (leave empty for none)" value={p.href} placeholder="https://" onChange={(href) => update({ ...p, href })} />
              <Field label="Screenshot path or URL" value={p.image} onChange={(image) => update({ ...p, image })} />
              <Field label="Overview" multiline value={p.overview} onChange={(overview) => update({ ...p, overview })} />
              <Field label="What I built (one point per line)" multiline value={p.built} onChange={(built) => update({ ...p, built })} />
              <Field label="Outcome" multiline value={p.outcome} onChange={(outcome) => update({ ...p, outcome })} />
            </>
          )}
        />
      </Section>

      <Section title="Experience">
        <ListEditor
          items={content.experience}
          onChange={set("experience")}
          blank={{ role: "", company: "", place: "", period: "", points: "" }}
          addLabel="Add entry"
          render={(e, update) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Role" value={e.role} onChange={(role) => update({ ...e, role })} />
                <Field label="Company or school" value={e.company} onChange={(company) => update({ ...e, company })} />
                <Field label="Place" value={e.place} onChange={(place) => update({ ...e, place })} />
                <Field label="Period" value={e.period} onChange={(period) => update({ ...e, period })} />
              </div>
              <Field label="Points (one per line)" multiline value={e.points} onChange={(points) => update({ ...e, points })} />
            </>
          )}
        />
      </Section>

      <Section title="Achievements">
        <ListEditor
          items={content.achievements}
          onChange={set("achievements")}
          blank=""
          addLabel="Add achievement"
          render={(a, update) => <Field label="Achievement" value={a} onChange={update} />}
        />
      </Section>

      <Section title="Skills">
        <ListEditor
          items={content.disciplines}
          onChange={set("disciplines")}
          blank={{ name: "", text: "", skills: [] }}
          addLabel="Add group"
          render={(d, update) => (
            <>
              <Field label="Group name" value={d.name} onChange={(name) => update({ ...d, name })} />
              <Field label="Description" value={d.text} onChange={(text) => update({ ...d, text })} />
              <ListEditor
                items={d.skills}
                onChange={(skills) => update({ ...d, skills })}
                blank={{ name: "", icon: "code" }}
                addLabel="Add skill"
                render={(s, updateSkill) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Skill" value={s.name} onChange={(name) => updateSkill({ ...s, name })} />
                    <label className="block space-y-1">
                      <span className="text-xs text-muted">Icon</span>
                      <select value={s.icon} onChange={(e) => updateSkill({ ...s, icon: e.target.value })} className={inputClass}>
                        {Object.keys(ICONS).map((key) => <option key={key}>{key}</option>)}
                      </select>
                    </label>
                  </div>
                )}
              />
            </>
          )}
        />
      </Section>

      <Section title="Numbers">
        <ListEditor
          items={content.facts}
          onChange={set("facts")}
          blank={{ value: "", label: "" }}
          addLabel="Add number"
          render={(f, update) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_3fr]">
              <Field label="Value" value={f.value} onChange={(value) => update({ ...f, value })} />
              <Field label="Label" value={f.label} onChange={(label) => update({ ...f, label })} />
            </div>
          )}
        />
      </Section>

      <Section title="Chat suggestions">
        <ListEditor
          items={content.suggestions}
          onChange={set("suggestions")}
          blank=""
          addLabel="Add suggestion"
          render={(s, update) => <Field label="Question" value={s} onChange={update} />}
        />
      </Section>

      <Section
        title="Chatbot knowledge"
        hint='Saving the sections above updates the chatbot automatically. Use this box for extra background. Start each topic with "## Heading".'
      >
        <textarea
          value={knowledge}
          onChange={(e) => setKnowledge(e.target.value)}
          rows={16}
          aria-label="Chatbot knowledge"
          className={`${inputClass} font-mono text-xs`}
        />
        <button
          disabled={pending}
          onClick={() => run(() => saveKnowledge(knowledge, content))}
          className="rounded-lg border border-accent px-4 py-2 text-sm text-accent disabled:opacity-50"
        >
          {pending ? "Working…" : "Save and rebuild chatbot"}
        </button>
      </Section>

      <Section title="Questions the chatbot couldn't answer" hint="Add the missing facts to the knowledge box above.">
        {gaps.length === 0 && <p className="text-sm text-muted">Nothing yet.</p>}
        {gaps.length > 0 && (
          <>
            <ul className="space-y-1 text-sm">
              {gaps.map((question, i) => <li key={i}>{question}</li>)}
            </ul>
            <button
              disabled={pending}
              onClick={() => run(async () => {
                const result = await clearGaps();
                if (result.ok) setGaps([]);
                return result;
              })}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-accent disabled:opacity-50"
            >
              Clear list
            </button>
          </>
        )}
      </Section>
    </main>
  );
}
