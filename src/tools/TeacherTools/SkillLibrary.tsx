import { useEffect, useState } from "react";
import { Home, BookOpen } from "lucide-react";
import { SKILLS, SkillOverlay, loadKaTeX, type SkillDef } from "../../shared";

// ─────────────────────────────────────────────────────────────────────────────
// SKILL LIBRARY — browse every skill in src/shared/skills and play its slides.
//
// This is the review surface for the skill decks that worked-example steps link
// to via [[skill-id|term]] markers. Cards are grouped by landing-page strand;
// clicking one plays the skill in the same overlay the worked example uses.
// Registered with enabled:false, so it only appears on the landing page in
// Developing-tools mode while the skills feature matures.
// ─────────────────────────────────────────────────────────────────────────────

// Strand accent colours (matches the landing-page category palette).
const STRAND_COLORS: Record<string, string> = {
  "Number": "#0891b2",              // cyan-600
  "Algebra": "#9333ea",             // purple-600
  "Ratio & Proportion": "#059669",  // emerald-600
  "Geometry": "#d97706",            // amber-600
  "Probability & Statistics": "#db2777", // pink-600
};

export default function App() {
  const [openSkillId, setOpenSkillId] = useState<string | null>(null);
  useEffect(() => { loadKaTeX(); }, []);

  const strands = [...new Set(SKILLS.map((s) => s.category))];

  // Variants of one skill (LCM from times tables / from prime factors) share a
  // title — they render as ONE card with a clickable row per method.
  const groupByTitle = (skills: SkillDef[]): SkillDef[][] => {
    const groups: SkillDef[][] = [];
    for (const s of skills) {
      const g = groups.find((grp) => grp[0].title === s.title);
      if (g) g.push(s); else groups.push([s]);
    }
    return groups;
  };

  const slideCount = (s: SkillDef) => `${s.slides.length} slide${s.slides.length > 1 ? "s" : ""}`;

  const card = (variants: SkillDef[], color: string) => {
    const primary = variants[0];
    if (variants.length === 1 && !primary.method) {
      return (
        <button key={primary.id} onClick={() => setOpenSkillId(primary.id)}
          className="group bg-white rounded-xl shadow-lg p-6 text-left transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col gap-2"
          style={{ borderLeft: `6px solid ${color}` }}>
          <div className="flex items-start justify-between gap-3">
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{primary.title}</span>
            <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0 mt-1" style={{ color }}>{slideCount(primary)}</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{primary.description}</p>
        </button>
      );
    }
    return (
      <div key={primary.title} className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-3"
        style={{ borderLeft: `6px solid ${color}` }}>
        <div className="flex items-start justify-between gap-3">
          <span className="text-xl font-bold text-gray-900">{primary.title}</span>
          <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0 mt-1" style={{ color }}>
            {variants.length} method{variants.length > 1 ? "s" : ""}
          </span>
        </div>
        {variants.map((v) => (
          <button key={v.id} onClick={() => setOpenSkillId(v.id)}
            className="group text-left rounded-lg border-2 border-gray-200 hover:border-blue-900 p-3 transition-colors flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-bold text-sm group-hover:text-blue-900 transition-colors" style={{ color }}>{v.method ?? v.title}</span>
              <span className="text-xs text-gray-400 font-semibold flex-shrink-0">{slideCount(v)}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{v.description}</p>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-blue-900 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <button onClick={() => { window.location.href = "/"; }}
            className="flex items-center gap-2 text-white hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
            <Home size={24} /><span className="font-semibold text-lg">Home</span>
          </button>
          <div className="flex items-center gap-2 text-blue-200">
            <BookOpen size={20} />
            <span className="font-semibold">{SKILLS.length} skill{SKILLS.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>
      {openSkillId && <SkillOverlay skillId={openSkillId} onClose={() => setOpenSkillId(null)} />}
      <div className="min-h-screen p-8" style={{ backgroundColor: "#f5f3f0" }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-4" style={{ color: "#000" }}>Skill Library</h1>
          <p className="text-center text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
            Every core skill, taught in a short slide sequence. These are the drill-downs
            linked from worked-example steps — click a card to play one.
          </p>
          {strands.map((strand) => {
            const color = STRAND_COLORS[strand] ?? "#475569";
            return (
              <section key={strand} className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold" style={{ color }}>{strand}</h2>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupByTitle(SKILLS.filter((s) => s.category === strand)).map((g) => card(g, color))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
