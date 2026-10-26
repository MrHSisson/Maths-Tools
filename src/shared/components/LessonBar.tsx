import { useState } from "react";
import { Home, X, ChevronUp, ChevronDown } from "lucide-react";
import { PAGE_BG } from "../colors";
import { useLayoutMode } from "../layoutMode";
import type { ToolLesson } from "../lessons";

/** Lesson state the wrapper hands the shell: the menu list, the bar, and the step controls. */
export interface LessonControls {
  lessons: ToolLesson[];
  active: { lesson: ToolLesson; index: number | null } | null;
  start: (id: string) => void;
  go: (delta: number) => void;
  overview: () => void;
  exit: () => void;
}

const LESSON_KIND_LABEL: Record<ToolLesson["steps"][number]["kind"], string> = {
  teach: "Slides",
  depth: "Depth",
  whiteboard: "Whiteboard",
  example: "Worked example",
  worksheet: "Worksheet",
};

export const LessonOverview = ({ lesson, title, onOpenStep, onClose }: {
  lesson: ToolLesson;
  title: string;
  onOpenStep: (i: number) => void;
  onClose: () => void;
}) => (
  <div style={{ background: PAGE_BG, minHeight: "100vh" }}>
    <div className="bg-blue-900 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
        <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 text-white hover:bg-blue-800 px-3 py-2 rounded-lg transition-colors">
          <Home size={22} /><span className="font-semibold">Home</span>
        </button>
        <div className="text-white text-sm font-semibold truncate min-w-0">{title}</div>
        <button onClick={onClose} aria-label="Close lesson" className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors">
          <X size={22} />
        </button>
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lesson</div>
        <h1 className="text-3xl font-semibold text-slate-900 mt-1">{lesson.title}</h1>
        <p className="text-slate-600 mt-2">{lesson.summary}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lesson.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => onOpenStep(i)}
            className="text-left rounded-2xl border border-slate-300 shadow-card bg-white p-5 hover:shadow-lift transition-shadow flex gap-4 min-w-0"
          >
            <span className="shrink-0 w-9 h-9 rounded-full bg-blue-900 text-white font-semibold flex items-center justify-center">{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {LESSON_KIND_LABEL[s.kind]} · Level {s.level.slice(-1)}
              </span>
              <span className="block font-semibold text-slate-900 mt-1">{s.title}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500">Open a step to start there. The step bar moves you on from it.</p>
    </div>
  </div>
);

/** The running lesson's step bar: a card floating at the bottom-left of the viewport, so Back / Next are always in reach — on a
 *  long page, in fullscreen and in a Teach deck — rather than sitting in the header where they scroll off screen. On phone and
 *  tablet it lifts clear of the fixed bottom action bar. */
export const LessonStepBar = ({ lesson, index, controls }: { lesson: ToolLesson; index: number; controls: LessonControls }) => {
  const layout = useLayoutMode();
  const [open, setOpenState] = useState(() => { try { return localStorage.getItem("mt-lesson-bar-open") !== "0"; } catch { return true; } });
  const setOpen = (v: boolean) => { setOpenState(v); try { localStorage.setItem("mt-lesson-bar-open", v ? "1" : "0"); } catch { /* ignore */ } };
  const step = lesson.steps[index];
  const last = index === lesson.steps.length - 1;
  if (!step) return null;
  // Small on purpose, collapsible to a tiny tab, and hidden while anything is full screen (`.mt-lesson-bar` + html[data-mt-fs] in index.css),
  // so it never covers a question. The step's title is its tooltip; tapping "Step n of N" opens the lesson overview.
  const pos = { left: 12, bottom: layout.laptop ? 10 : 74, maxWidth: "calc(100vw - 24px)" } as const;
  if (!open) return (
    <button onClick={() => setOpen(true)} data-trusted-click title={`Lesson: ${lesson.title} — step ${index + 1} of ${lesson.steps.length} (show the step bar)`}
      className="mt-lesson-bar fixed z-[250] rounded-full border border-blue-800 bg-blue-900 text-white shadow-lift px-3 py-1 text-xs font-semibold flex items-center gap-1" style={pos}>
      <ChevronUp size={13} />{index + 1}/{lesson.steps.length}
    </button>
  );
  return (
    <div className="mt-lesson-bar fixed z-[250] rounded-full border border-blue-800 bg-blue-900 text-white shadow-lift pl-1.5 pr-1.5 py-1 flex items-center gap-2" style={pos} data-trusted-click>
      <button onClick={() => setOpen(false)} aria-label="Hide the step bar" title="Hide the step bar" className="p-1.5 rounded-full hover:bg-blue-800"><ChevronDown size={14} /></button>
      <button onClick={controls.overview} title={`${lesson.title} — ${step.title} (open the lesson overview)`} className="text-sm font-semibold whitespace-nowrap hover:text-blue-200">
        Step {index + 1} of {lesson.steps.length}
      </button>
      <button onClick={() => controls.go(-1)} className="px-3 py-1 rounded-full bg-blue-800 text-sm font-semibold">Back</button>
      <button onClick={() => (last ? controls.overview() : controls.go(1))} className="px-3 py-1 rounded-full bg-white text-blue-900 text-sm font-semibold">{last ? "Finish" : "Next"}</button>
      <button onClick={controls.exit} aria-label="Exit lesson" title="Leave the lesson" className="p-1.5 rounded-full hover:bg-blue-800"><X size={14} /></button>
    </div>
  );
};


