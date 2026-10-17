import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { ShellChooser, ShellOption, ShellSubTool } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// TopicChooser — everything about WHAT is being practised (course, practice type, topic) in one container at the top of the page.
// Collapsed it is a single row (‹ topic ›  ▾) so it costs almost nothing while practising; opened it expands in place into filters and
// grouped topic tiles. Picking a tile collapses it again. The toolbar (level, question options, New Question) is not part of it.
// ═══════════════════════════════════════════════════════════════════════════

export default function TopicChooser({ chooser, filters, options, tabs, subTool, onFilter, onTopic, narrow, startOpen }: {
  chooser: ShellChooser;
  filters: ShellOption[];
  options: Record<string, string>;
  tabs: ShellSubTool[];
  subTool: string;
  onFilter: (key: string, value: string) => void;
  onTopic: (key: string) => void;
  narrow: boolean;
  startOpen: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const idx = tabs.findIndex((t) => t.key === subTool);
  const current = tabs[idx];
  const step = (d: number) => { if (tabs.length) onTopic(tabs[(idx + d + tabs.length) % tabs.length].key); };
  const filterText = filters.map((o) => o.choices.find((c) => c.value === options[o.key])?.label).filter(Boolean).join(" · ");
  const arrow = "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-blue-900 hover:bg-slate-100 active:bg-slate-200";

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-card min-w-0">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button onClick={() => step(-1)} aria-label="Previous topic" className={arrow}><ChevronLeft size={20} /></button>
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex-1 min-w-0 flex items-center justify-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 text-center">
          <span className="min-w-0 leading-tight">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">{filterText}</span>
            <span className="block text-base font-semibold text-slate-900 truncate">{current?.label ?? "Choose a topic"}</span>
          </span>
          <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform" style={{ transform: open ? "rotate(180deg)" : undefined }} />
        </button>
        <button onClick={() => step(1)} aria-label="Next topic" className={arrow}><ChevronRight size={20} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.25s ease" }}>
        <div style={{ overflow: "hidden" }}>
          <div className="border-t border-slate-200 px-3 sm:px-5 py-4 flex flex-col gap-4" style={narrow ? { maxHeight: "68dvh", overflowY: "auto" } : undefined}>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {filters.map((o) => (
                <div key={o.key} className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
                  {o.choices.map((c) => (
                    <button key={c.value} onClick={() => onFilter(o.key, c.value)}
                      className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors ${options[o.key] === c.value ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>{c.label}</button>
                  ))}
                </div>
              ))}
            </div>
            {chooser.groups.map((g) => {
              const items = g.keys.map((k) => tabs.find((t) => t.key === k)).filter((t): t is ShellSubTool => !!t);
              if (!items.length) return null;
              return (
                <div key={g.title}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{g.title}</div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: narrow ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fill, minmax(190px, 1fr))" }}>
                    {items.map((t) => (
                      <button key={t.key} onClick={() => { onTopic(t.key); setOpen(false); }}
                        className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${t.key === subTool ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-300 text-slate-900 hover:bg-slate-50"}`}>
                        <span className="block font-semibold text-sm leading-snug">{t.label}</span>
                        {t.blurb && <span className={`block text-xs leading-snug mt-0.5 ${t.key === subTool ? "text-blue-100" : "text-slate-500"}`}>{t.blurb}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
