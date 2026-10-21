import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { ToolLesson } from "../lessons";

// The lessons page: every lesson this tool offers as a card, opened from the burger menu's "Lessons…" item
// (instead of listing each lesson in the menu). Picking a card opens that lesson's overview.

const KIND_LABEL: Record<ToolLesson["steps"][number]["kind"], string> = {
  teach: "Slides", depth: "Depth", whiteboard: "Whiteboard", example: "Worked example", worksheet: "Worksheet",
};

export function LessonsPage({ title, lessons, onPick, onClose }: {
  title: string;
  lessons: ToolLesson[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[400] flex flex-col overflow-auto" style={{ backgroundColor: "#f8f9fb" }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-slate-900">Lessons</div>
          <div className="text-sm text-slate-500 truncate">{title} — pick a lesson to see its steps.</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 shrink-0"><X size={20} /></button>
      </div>
      <div className="max-w-5xl w-full mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
        {lessons.map(l => (
          <button key={l.id} onClick={() => onPick(l.id)} className="text-left rounded-2xl border border-slate-300 shadow-card bg-white p-5 hover:shadow-lift transition-shadow flex flex-col gap-2 min-w-0">
            <span className="font-semibold text-slate-900 text-lg">{l.title}</span>
            <span className="text-sm text-slate-600">{l.summary}</span>
            <span className="text-xs text-slate-500 mt-1">
              {l.steps.length} steps · {[...new Set(l.steps.map(s => KIND_LABEL[s.kind]))].join(", ")}
            </span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
