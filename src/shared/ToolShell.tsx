import { useState, useEffect } from "react";
import { useDevMode } from "../devMode";
import { lessonStepParams, lessonOverviewParams, readLessonFromUrl, setupParams, type ToolLesson, type TeachHandoff } from "./lessons";
import { LessonOverview, LessonStepBar, type LessonControls } from "./components/LessonBar";
import { ToolShellCore, type ToolShellProps } from "./ToolShellCore";

export type { ToolShellProps } from "./ToolShellCore";

// ── Lessons wrapper ─────────────────────────────────────────────────────────
// Every tool still exports ToolShell. When a tool passes `lessons`, a lesson opens on its overview
// screen (one card per step). Opening a card writes that step's shareable link and remounts the shell,
// so the shell opens exactly that setup (no per-tool state plumbing). Tools without lessons render
// the core directly, as before.
export const ToolShell = ({ lessons: lessonsProp, ...props }: ToolShellProps) => {
  // Lessons sit behind Developing-tools mode, like Teach. With the mode off there are no lessons at all:
  // no menu section, no lesson bar, and an open lesson closes.
  const devMode = useDevMode();
  const lessons = devMode ? lessonsProp : undefined;
  const [active, setActive] = useState<{ id: string; step: number | null } | null>(() =>
    readLessonFromUrl(lessonsProp, typeof window === "undefined" ? "" : window.location.search));
  const [revision, setRevision] = useState(0);
  const lesson = active && lessons ? lessons.find(l => l.id === active.id) ?? null : null;
  const index = active?.step ?? null;

  const writeUrl = (p: URLSearchParams) => {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${p}`);
  };
  const showOverview = (l: ToolLesson) => { writeUrl(lessonOverviewParams(l)); setActive({ id: l.id, step: null }); };
  const showStep = (l: ToolLesson, i: number) => {
    writeUrl(lessonStepParams(l, i));
    setActive({ id: l.id, step: i });
    setRevision(r => r + 1);
  };
  const exit = () => {
    const p = new URLSearchParams(window.location.search);
    p.delete("lesson");
    p.delete("step");
    const qs = p.toString();
    window.history.replaceState(window.history.state, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    setActive(null);
  };
  useEffect(() => { if (!devMode && active) exit(); }, [devMode, active]);
  // A Teach slide's hand-off: open the Whiteboard / Worksheet / Depth set up as the link says (a remount, like a lesson step).
  const handoff = (to: TeachHandoff) => {
    const p = setupParams(to.tool, to.step);
    let stepNo = active?.step ?? null;
    if (active && lesson && stepNo !== null) {
      // The hand-off lands on the lesson's own step for that activity (the Worksheet after the deck), so the step bar moves with it.
      const same = (st: ToolLesson["steps"][number]) => st.kind === to.step.kind && (st.tool ?? lesson.tool) === to.tool;
      const at = lesson.steps.findIndex((st, i) => i > stepNo! && same(st));
      if (at >= 0) stepNo = at;
    }
    if (active) { p.set("lesson", active.id); if (stepNo !== null) p.set("step", String(stepNo)); }
    writeUrl(p);
    if (active && stepNo !== null && stepNo !== active.step) setActive({ id: active.id, step: stepNo });
    setRevision(r => r + 1);
  };
  const lessonControls: LessonControls | undefined = lessons?.length ? {
    lessons,
    active: lesson ? { lesson, index } : null,
    start: (id) => { const l = lessons.find(x => x.id === id); if (l) showOverview(l); },
    go: (delta) => {
      if (!lesson || index === null) return;
      const next = index + delta;
      if (next < 0) showOverview(lesson);
      else showStep(lesson, Math.min(lesson.steps.length - 1, next));
    },
    overview: () => { if (lesson) showOverview(lesson); },
    exit,
  } : undefined;

  if (lesson && index === null) {
    return <LessonOverview lesson={lesson} title={props.config.pageTitle} onOpenStep={(i) => showStep(lesson, i)} onClose={exit} />;
  }
  const bar = lesson && index !== null && lessonControls ? <LessonStepBar lesson={lesson} index={index} controls={lessonControls} /> : null;
  return <><ToolShellCore key={revision} {...props} lessonControls={lessonControls} onHandoff={handoff} />{bar}</>;
};
