import { useState } from "react";
import { Info, X, ChevronRight, ChevronLeft } from "lucide-react";

/** The (i) beside the level buttons, and the pop-up it opens: what each level of this sub-tool means, the current one marked.
 *  Tap a level for more: its full description, what can be chosen at that level, and a button to switch to it. Shared by ToolShell and DecisionShell. */
export const LevelInfoButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} title="What the levels mean" aria-label="What the levels mean" className="w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-blue-900 hover:bg-slate-100">
    <Info size={18} />
  </button>
);

/** One group of choices available at a level: its title, and each choice with whether it is ticked by default. */
export interface LevelOptionGroup {
  title: string;
  /** What the group is for, one plain sentence (written in `<Tool>.about.ts`): the explainer for the group, shown under its title. */
  info?: string;
  /** `info` on an item explains that one choice (used where each choice is its own switch). */
  items: { label: string; on: boolean; info?: string }[];
}

export const LevelInfoDialog = ({ title, labels, level, onClose, optionsAt, onPickLevel }: {
  title?: string; labels: string[]; level: number; onClose: () => void;
  /** What a teacher can choose at level i (0-based); omitted → the detail view shows only the description. */
  optionsAt?: (i: number) => LevelOptionGroup[];
  /** Switch the tool to level i (0-based). */
  onPickLevel?: (i: number) => void;
}) => {
  const [open, setOpen] = useState<number | null>(null);
  const groups = open !== null ? optionsAt?.(open) ?? [] : [];
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-300 shadow-lift w-full max-w-md max-h-[85vh] overflow-y-auto p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-1.5">
            {open !== null && (
              <button onClick={() => setOpen(null)} aria-label="Back to the levels" className="-ml-1.5 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"><ChevronLeft size={18} /></button>
            )}
            <div>
              <div className="text-lg font-semibold text-slate-900">{open !== null ? `Level ${open + 1}` : "Levels"}</div>
              {title && <div className="text-sm text-slate-500">{title}</div>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        {open === null ? (
          <>
            <div className="flex flex-col gap-2">
              {labels.map((l, i) => (
                <button key={i} onClick={() => setOpen(i)} className={`text-left rounded-xl border px-3 py-2 flex items-center gap-2 hover:bg-slate-50 ${i + 1 === level ? "border-blue-900 bg-blue-50" : "border-slate-200"}`}>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Level {i + 1}{i + 1 === level ? " · now" : ""}</span>
                    <span className="block text-base text-slate-900 leading-snug">{l}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400">Tap a level for more.</div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 leading-snug">{labels[open]}</div>
            {groups.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="text-sm font-semibold text-slate-700">What you can choose at this level</div>
                {groups.map(g => (
                  <div key={g.title}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{g.title}</div>
                    {g.info && <div className="text-sm text-slate-500 leading-snug mb-1.5">{g.info}</div>}
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map(it => (
                        <span key={it.label} className={`rounded-full border px-2.5 py-0.5 text-sm ${it.on ? "border-blue-900 bg-blue-50 text-blue-900 font-semibold" : "border-slate-300 text-slate-500"}`}>{it.label}</span>
                      ))}
                    </div>
                    {g.items.some(it => it.info) && (
                      <div className="mt-1.5 flex flex-col gap-0.5">
                        {g.items.filter(it => it.info).map(it => <div key={it.label} className="text-sm text-slate-500 leading-snug"><span className="font-semibold text-slate-700">{it.label}:</span> {it.info}</div>)}
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-xs text-slate-400">Highlighted choices are ticked to start with.</div>
              </div>
            )}
            {onPickLevel && open + 1 !== level && (
              <button onClick={() => { onPickLevel(open); onClose(); }} className="self-start rounded-xl bg-blue-900 text-white font-semibold px-4 py-2">Switch to Level {open + 1}</button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
