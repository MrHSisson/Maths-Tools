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

  const card = (skill: SkillDef, color: string) => (
    <button key={skill.id} onClick={() => setOpenSkillId(skill.id)}
      className="group bg-white rounded-xl shadow-lg p-6 text-left transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col gap-2"
      style={{ borderLeft: `6px solid ${color}` }}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">{skill.title}</span>
        <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0 mt-1" style={{ color }}>
          {skill.slides.length} slide{skill.slides.length > 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed">{skill.description}</p>
    </button>
  );

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
                  {SKILLS.filter((s) => s.category === strand).map((s) => card(s, color))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
