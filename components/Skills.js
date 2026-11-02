"use client";

import { motion } from "motion/react";
import { Reveal } from "@/components/Motion";
import { ICONS } from "@/lib/icons";

function SkillTile({ skill, index }) {
  const { Icon, color } = ICONS[skill.icon] || ICONS.code;
  return (
    <motion.li
      className="group flex min-w-0 flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: index * 0.06 }}
    >
      <motion.span
        whileHover={{ scale: 1.15, rotate: -6 }}
        transition={{ type: "spring", stiffness: 400, damping: 12 }}
        className="flex size-14 items-center justify-center rounded-2xl sm:size-16 border border-background/15 bg-background/5 transition-colors group-hover:bg-background/10"
      >
        <span className="skill-float block text-3xl" style={{ animationDelay: `${index * -0.45}s`, color: color || undefined }}>
          <Icon aria-hidden />
        </span>
      </motion.span>
      <span className="text-center text-[11px] leading-tight opacity-70 sm:text-xs transition-opacity group-hover:opacity-100">{skill.name}</span>
    </motion.li>
  );
}

export default function Skills({ disciplines, facts }) {
  return (
    <section id="skills" className="scroll-mt-20 bg-foreground px-6 py-16 sm:py-24 text-background sm:px-10">
      <h2 className="mb-12 font-mono text-sm opacity-60">What I work with</h2>
      <div className="space-y-12 sm:space-y-16">
        {disciplines.map((d) => (
          <div key={d.name} className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-10">
            <Reveal>
              <h3 className="text-4xl font-medium tracking-tight sm:text-5xl">{d.name}</h3>
              <p className="mt-3 max-w-xs opacity-70">{d.text}</p>
            </Reveal>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-x-2 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] sm:gap-y-6">
              {d.skills.map((skill, i) => (
                <SkillTile key={skill.name} skill={skill} index={i} />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-20 grid grid-cols-2 gap-8 border-t border-background/20 pt-10 lg:grid-cols-4">
        {facts.map((f, i) => (
          <Reveal key={f.label} delay={i * 0.08}>
            <p className="text-5xl font-medium tracking-tight text-accent-inverse">{f.value}</p>
            <p className="mt-2 text-sm opacity-70">{f.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
