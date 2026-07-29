// ═══════════════════════════════════════════════════════════════════════════════
// CSShell — the reusable Computer Science revision shell.
//
// A knowledge/revision sub-topic is authored as one `CSTopic` data object (see
// types.ts) and rendered with `<CSShell topic={…} />`. The shell owns everything
// the student sees around the content: the header, the desktop top-tabs and mobile
// bottom nav, the burger menu (beyond-spec toggle, hints toggle, topic info), the
// topic-info modal, the beyond-spec filtering, the Quiz/Spot sub-toggle, the exam
// section chips, and the routing that renders the six modes + LearnMode. All topic
// content (glossary, spec descriptions, cards, exam, …) is supplied via the single
// `topic` prop; the shell wraps everything in a <TopicProvider>. See docs/architecture/CS_SHELL_PLAN.md.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import {
  Home, Menu, X,
  BookOpen, Layers, CheckSquare, PenLine, FileText, Info, GraduationCap,
} from "lucide-react";
import {
  NAVY, TAB_SHADOW, useIsMobile,
  BeyondBadge, SegRow, registerTooltip, TooltipOverlay,
  TopicProvider,
  LearnMode, FlashcardMode, StudyMode, QuizMode, SpotMistakeMode, FillInMode, ExamMode,
  type CSTooltip, type CSTopic, type InfoSection,
} from "../cs";

// ─────────────────────────────────────────────────────────────────────────────
// INFO MODAL — the topic-info overlay opened from the burger menu.
// ─────────────────────────────────────────────────────────────────────────────

const InfoModal = ({ title, sections, onClose }: { title: string; sections: InfoSection[]; onClose: () => void }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #f3f4f6" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#111827", margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ minWidth: 44, minHeight: 44, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} color="#6b7280" /></button>
      </div>
      <div style={{ overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 22 }}>
        {sections.map(s => (
          <div key={s.title}>
            <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e3a8a", margin: "0 0 10px" }}>{s.title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {s.items.map(item => (
                <div key={item.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "#374151", margin: "0 0 2px" }}>{item.label}</p>
                  <p style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// NAV — compact top segmented (desktop) / fixed bottom bar (mobile)
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVITIES = [
  { key: "learn",     label: "Learn",  icon: GraduationCap, blurb: "Taught walkthroughs with a diagram — start here to understand it before testing yourself." },
  { key: "study",     label: "Study",  icon: BookOpen,    blurb: "Read the question-and-answer cards — recognition, low effort." },
  { key: "flashcard", label: "Cards",  icon: Layers,      blurb: "Active recall — answer before you flip." },
  { key: "quiz",      label: "Quiz",   icon: CheckSquare, blurb: "MCQ warm-up — a high score here isn't exam-readiness." },
  { key: "fillin",    label: "Fill",   icon: PenLine,     blurb: "Tap a term, then tap a slot to place it." },
  { key: "exam",      label: "Exam",   icon: FileText,    blurb: "Real J277 formats, tariffs and synoptic questions." },
] as const;

const EXAM_SECTIONS = [
  { key: "all", label: "All" },
  { key: "mcq", label: "MCQ" },
  { key: "state", label: "State" },
  { key: "short", label: "Short" },
  { key: "scenario", label: "Scenario" },
  { key: "extended", label: "Extended" },
  { key: "synoptic", label: "Synoptic" },
];

type Activity = (typeof ACTIVITIES)[number];

const BottomNav = ({ activities, activity, setActivity }: { activities: Activity[]; activity: string; setActivity: (a: string) => void }) => (
  <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: "#fff", borderTop: "1px solid #e5e7eb", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", display: "flex", paddingBottom: "env(safe-area-inset-bottom)" }}>
    {activities.map(a => {
      const active = activity === a.key; const Icon = a.icon;
      return (
        <button key={a.key} onClick={() => setActivity(a.key)}
          style={{ flex: 1, minWidth: 0, minHeight: 56, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? "#1e3a8a" : "#9ca3af", padding: "6px 1px" }}>
          <Icon size={19} strokeWidth={active ? 2.4 : 2} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700 }}>{a.label}</span>
        </button>
      );
    })}
  </div>
);

const DesktopTabs = ({ activities, activity, setActivity }: { activities: Activity[]; activity: string; setActivity: (a: string) => void }) => (
  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
    {activities.map(a => {
      const active = activity === a.key; const Icon = a.icon;
      return (
        <button key={a.key} onClick={() => setActivity(a.key)}
          style={{ minHeight: 48, display: "flex", alignItems: "center", gap: 8, padding: "0 22px", borderRadius: 12, fontWeight: 700, fontSize: "1.05rem", border: "none", cursor: "pointer", transition: "all 0.15s",
            background: active ? NAVY : "#fff", color: active ? "#fff" : "#1f2937", boxShadow: TAB_SHADOW }}>
          <Icon size={18} /> {a.label}
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// CSShell — the whole tool, driven by a single topic prop.
// ─────────────────────────────────────────────────────────────────────────────

export const CSShell = ({ topic }: { topic: CSTopic }) => {
  const isMobile = useIsMobile();

  // Which activities this topic actually provides — the nav auto-hides the rest
  // (an activity with no backing content is dropped). A topic authors data only;
  // omitting e.g. `myths` or `cloze` hides Spot / Fill without any extra config.
  const hasMcq  = topic.cards.length > 0;
  const hasSpot = topic.myths.length > 0;
  const has: Record<string, boolean> = {
    learn:     topic.lessons.length > 0,
    study:     topic.cards.length > 0,
    flashcard: topic.cards.length > 0,
    quiz:      hasMcq || hasSpot,
    fillin:    topic.cloze.length > 0,
    exam:      topic.exam.length > 0 || topic.synoptic.length > 0,
  };
  const activities = ACTIVITIES.filter(a => has[a.key]);

  const [activity, setActivity] = useState<string>(() => activities[0]?.key ?? "learn");
  const [examSection, setExamSection] = useState("all");
  const [quizMode, setQuizMode] = useState(() => (hasMcq ? "mcq" : "spot"));   // "mcq" | "spot"
  const [showHints, setShowHints] = useState(true);
  const [showBeyond, setShowBeyond] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tip, setTip] = useState<CSTooltip | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { registerTooltip(setTip); return () => registerTooltip(null); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const heading = `${topic.id} ${topic.title}`;
  const cards = topic.cards.filter(c => showBeyond || !c.beyondSpec);
  const cloze = topic.cloze.filter(c => showBeyond || !c.beyondSpec);
  const exam = topic.exam.filter(q => showBeyond || !q.beyondSpec);
  const activeBlurb = activity === "quiz" && quizMode === "spot"
    ? "Spot the mistake — judge each statement, then read the correction. Targets the classic traps."
    : (ACTIVITIES.find(a => a.key === activity)?.blurb ?? "");
  const contentKey = `${activity}-${examSection}-${quizMode}-${showBeyond}`;

  // Quiz sub-toggle: only offer the sub-modes the topic can back (cards → MCQ,
  // myths → Spot). Hidden entirely when only one is available.
  const quizOptions = [
    ...(hasMcq  ? [{ key: "mcq",  label: "Multiple choice" }] : []),
    ...(hasSpot ? [{ key: "spot", label: "Spot the mistake" }] : []),
  ];

  // Exam-section chips: keep only sections with questions (plus "All"). Derived
  // from the full exam pool so toggling "Beyond spec" never removes a chip.
  const examFormats = new Set<string>(topic.exam.map(q => q.format));
  const examSections = EXAM_SECTIONS.filter(s =>
    s.key === "all" || (s.key === "synoptic" ? topic.synoptic.length > 0 : examFormats.has(s.key)));

  return (
    <TopicProvider value={{ glossary: topic.glossary, specDescriptions: topic.specTags }}>
      {tip && <TooltipOverlay tip={tip} onClose={() => setTip(null)} />}

      {/* Header */}
      <div className="bg-blue-900 shadow-lg" style={{ position: "sticky", top: 0, zIndex: 95 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "6px 10px" : "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { window.location.href = "/"; }} className="text-white hover:bg-blue-800 rounded-lg transition-colors" style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 10px" }}>
            <Home size={24} /><span className="font-semibold" style={{ fontSize: "1.1rem" }}>Home</span>
          </button>
          <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(o => !o)} className="text-white hover:bg-blue-800 rounded-lg transition-colors" style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
              {menuOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", minWidth: 240, zIndex: 100, overflow: "hidden" }}>
                  <button onClick={() => { setInfoOpen(true); setMenuOpen(false); }} style={{ width: "100%", minHeight: 48, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}><Info size={16} color="#9ca3af" /> Topic information</button>
                  <label style={{ width: "100%", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 16px", cursor: "pointer" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>Beyond spec</span>
                    <div onClick={e => { e.preventDefault(); setShowBeyond(v => !v); }} style={{ width: 44, height: 24, borderRadius: 12, background: showBeyond ? "#1e3a8a" : "#d1d5db", position: "relative", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "transform 0.2s", transform: showBeyond ? "translateX(24px)" : "translateX(4px)" }} />
                    </div>
                  </label>
                </div>
              )}
            </div>
        </div>
      </div>

      {infoOpen && <InfoModal title={heading} sections={topic.info} onClose={() => setInfoOpen(false)} />}

      {/* Page */}
      <div style={{ minHeight: "100vh", backgroundColor: "#f5f3f0", padding: isMobile ? "14px 12px 84px" : "24px 20px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Page title — big centred heading + divider, matching the maths tools */}
          <h1 style={{ textAlign: "center", fontWeight: 800, color: "#000", margin: isMobile ? "2px 0 8px" : "4px 0 12px", fontSize: isMobile ? "1.7rem" : "3rem", lineHeight: 1.12 }}>
            {heading}
          </h1>
          <div style={{ height: 1, background: "#d1d5db", maxWidth: 880, margin: isMobile ? "0 auto 14px" : "0 auto 22px" }} />

          {/* Desktop tabs (mobile uses bottom bar) — hidden when a topic offers one activity */}
          {!isMobile && activities.length > 1 && (
            <div style={{ marginBottom: 18 }}>
              <DesktopTabs activities={activities} activity={activity} setActivity={setActivity} />
            </div>
          )}

          {/* Beyond-spec banner */}
          {showBeyond && (
            <div style={{ maxWidth: 720, margin: "0 auto 12px", background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <BeyondBadge /><span style={{ fontSize: "0.8rem", color: "#92400e", fontWeight: 600 }}>content included — not required for {topic.id}</span>
            </div>
          )}

          {/* Activity blurb — makes the rigor of each mode explicit */}
          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#6b7280", fontWeight: 500, margin: "0 auto 14px", maxWidth: 560, lineHeight: 1.5 }}>{activeBlurb}</p>

          {/* Quiz sub-controls — MCQ warm-up vs Spot-the-Mistake (only when both exist) */}
          {activity === "quiz" && quizOptions.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <SegRow options={quizOptions} value={quizMode} onChange={setQuizMode} />
            </div>
          )}

          {/* Exam / mode sub-controls */}
          {activity === "exam" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <SegRow options={examSections} value={examSection} onChange={setExamSection} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div onClick={() => setShowHints(v => !v)} style={{ width: 44, height: 24, borderRadius: 12, background: showHints ? "#1e3a8a" : "#d1d5db", position: "relative" }}>
                  <div style={{ position: "absolute", top: 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "transform 0.2s", transform: showHints ? "translateX(24px)" : "translateX(4px)" }} />
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>Hints</span>
              </label>
            </div>
          )}

          {/* Content */}
          {activity === "learn"     && <LearnMode     key={contentKey} lessons={topic.lessons} scenes={topic.scenes} />}
          {activity === "study"     && <StudyMode     key={contentKey} cards={cards} />}
          {activity === "flashcard" && <FlashcardMode key={contentKey} cards={cards} />}
          {activity === "quiz"      && (quizMode === "spot"
            ? <SpotMistakeMode key={contentKey} myths={topic.myths} />
            : <QuizMode        key={contentKey} cards={cards} />)}
          {activity === "fillin"    && <FillInMode    key={contentKey} exercises={cloze} />}
          {activity === "exam"      && <ExamMode      key={contentKey} questions={exam} synoptic={topic.synoptic} section={examSection} showHints={showHints} />}

        </div>
      </div>

      {isMobile && activities.length > 1 && <BottomNav activities={activities} activity={activity} setActivity={setActivity} />}
    </TopicProvider>
  );
};
