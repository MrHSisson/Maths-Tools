import { Info, X } from "lucide-react";

/** The (i) beside the level buttons, and the pop-up it opens: what each level of this sub-tool means, the current one marked. Shared by ToolShell and DecisionShell. */
export const LevelInfoButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} title="What the levels mean" aria-label="What the levels mean" className="w-8 h-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-blue-900 hover:bg-slate-100">
    <Info size={18} />
  </button>
);

export const LevelInfoDialog = ({ title, labels, level, onClose }: { title?: string; labels: string[]; level: number; onClose: () => void }) => (
  <div className="fixed inset-0 z-[400] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={onClose}>
    <div className="bg-white rounded-2xl border border-slate-300 shadow-lift w-full max-w-md p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">Levels</div>
          {title && <div className="text-sm text-slate-500">{title}</div>}
        </div>
        <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="flex flex-col gap-2">
        {labels.map((l, i) => (
          <div key={i} className={`rounded-xl border px-3 py-2 ${i + 1 === level ? "border-blue-900 bg-blue-50" : "border-slate-200"}`}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Level {i + 1}{i + 1 === level ? " · now" : ""}</div>
            <div className="text-base text-slate-900 leading-snug">{l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
