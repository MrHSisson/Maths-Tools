import { useEffect } from "react";
import { X } from "lucide-react";
import { SlideDeck, type TeachingSlide } from "../TeachingDeck";
import { loadKaTeX } from "../katex";
import { LCM_SKILL } from "./lcm";
import { LCM_PRIME_FACTORS_SKILL } from "./lcm-prime-factors";

// ─────────────────────────────────────────────────────────────────────────────
// SKILL LIBRARY — small, reusable slide sequences that each teach ONE core
// skill pedagogically, on hand-picked model-friendly exemplar numbers.
//
// A worked-example step links a skill by marking a term in its prose label:
//   mStep("Find the common denominator — the [[lcm|LCM]] of 11 and 13:", "143")
// In the dev-gated Worked Example the term renders underlined; clicking it
// plays the skill's slides in an overlay, then returns to the same step. The
// question's own numbers never enter the skill — the skill teaches the idea on
// friendly numbers, the worked example applies it.
//
// Adding a skill: create src/shared/skills/<id>.ts exporting a SkillDef, add it
// to SKILLS below, and list it in CLAUDE.md's skill table. Keep it to 3–6
// slides, one level deep (skill slides never link to other skills), and only
// use exemplar numbers that display well.
// ─────────────────────────────────────────────────────────────────────────────

export interface SkillDef {
  id: string;           // kebab-case, referenced by [[id|term]] markers; variants use <base>-<method> (e.g. lcm-prime-factors)
  title: string;        // variants of one skill share the SAME title — the /skills page groups on it
  method?: string;      // variant label when a skill is taught more than one way, e.g. "From times tables"
  description: string;  // one sentence, shown on the Skill Library card
  category: string;     // landing-page strand name (Number, Algebra, …)
  slides: TeachingSlide[];
}

export const SKILLS: SkillDef[] = [
  LCM_SKILL,
  LCM_PRIME_FACTORS_SKILL,
];

export const getSkill = (id: string): SkillDef | undefined => SKILLS.find((s) => s.id === id);

// ── SkillLabel — renders prose that may contain [[skill-id|term]] markers ─────
// Without onOpenSkill (or for an unknown id) the bare term renders as plain
// text, so classic mode and stale links degrade silently.

const NAVY = "#1e3a8a";
const MARKER_SPLIT_RE = /(\[\[[a-z0-9-]+\|[^\]]+\]\])/g;
const MARKER_RE = /^\[\[([a-z0-9-]+)\|([^\]]+)\]\]$/;

export function SkillLabel({ text, onOpenSkill }: { text: string; onOpenSkill?: (id: string) => void }) {
  return (
    <>
      {text.split(MARKER_SPLIT_RE).map((part, i) => {
        const m = MARKER_RE.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const [, id, term] = m;
        const skill = getSkill(id);
        if (!onOpenSkill || !skill) return <span key={i}>{term}</span>;
        return (
          <button key={i} onClick={() => onOpenSkill(id)} title={`Open skill: ${skill.title}`}
            className="font-semibold hover:opacity-75 transition-opacity"
            style={{
              color: NAVY, textDecoration: "underline dotted", textDecorationThickness: 2,
              textUnderlineOffset: 4, background: "none", border: "none", padding: 0,
              cursor: "pointer", font: "inherit",
            }}>
            {term}
          </button>
        );
      })}
    </>
  );
}

// ── SkillOverlay — plays a skill's slides in a modal, then returns ────────────

export function SkillOverlay({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const skill = getSkill(skillId);
  useEffect(() => { loadKaTeX(); }, []);
  if (!skill) return null;
  // Near-fullscreen: the slim dimmed rim is what says "overlay" — the rest of
  // the viewport belongs to the teaching surface.
  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 300, background: "rgba(15, 23, 42, 0.55)", padding: 12 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: 1200, height: "100%", backgroundColor: "#f5f3f0", padding: 12 }}>
        <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
          <span className="text-sm font-bold uppercase tracking-wider" style={{ color: NAVY }}>
            Skill — {skill.title}{skill.method ? ` (${skill.method.toLowerCase()})` : ""}
          </span>
          <button onClick={onClose} title="Back to the question"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1" style={{ minHeight: 0 }}>
          <SlideDeck slides={skill.slides} color={NAVY} onEscape={onClose} onDone={onClose} fill />
        </div>
      </div>
    </div>
  );
}
