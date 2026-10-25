import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import type { InfoSection, ToolConfig } from "../types";
import { buildAbout, type AboutModel } from "../about";
import { useLayoutMode } from "../layoutMode";

const Detail = ({ items }: { items: { label: string; detail: string }[] }) => (
  <div className="flex flex-col gap-3">
    {items.map((i, k) => (
      <div key={`${i.label}-${k}`}>
        <div className="text-sm font-semibold text-slate-800">{i.label}</div>
        <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{i.detail}</p>
      </div>
    ))}
  </div>
);

/** "About this tool": what the tool is for, then each sub-tool with its purpose, what its levels mean and what its Question Options do.
 *  With a `config` all of that is read from it (the same level text as the level (i)); without one (games, CS topics) it shows the
 *  hand-written notes. A sub-tool opens its detail with a Back button; phones get a full-screen sheet. */
export const InfoModal = ({ infoSections, onClose, title, config, current, model }: {
  infoSections: InfoSection[]; onClose: () => void; title?: string; config?: ToolConfig; current?: string;
  /** a ready-made content model (the Decision shell builds its own from its sub-tools); otherwise it is built from `config` or the notes */
  model?: AboutModel;
}) => {
  const about = useMemo(() => model ?? buildAbout({ infoSections, config }), [infoSections, config, model]);
  const [open, setOpen] = useState<string | null>(null);
  const { phone } = useLayoutMode();
  const single = about.subTools.length === 1 ? about.subTools[0] : null;
  const sub = about.subTools.find((t) => t.key === open) ?? null;
  const topic = about.topics.find((t) => t.id === open) ?? null;

  const subBody = (t: typeof about.subTools[number]) => (
    <div className="flex flex-col gap-5">
      {t.purpose && <p className="text-base text-slate-700 leading-relaxed">{t.purpose}</p>}
      {t.levels.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Levels</div>
          <div className="flex flex-col gap-2">
            {t.levels.map((l, i) => (
              <div key={i} className="flex gap-3 text-sm"><span className="font-semibold text-slate-800 w-14 flex-shrink-0">Level {i + 1}</span><span className="text-slate-600 leading-relaxed">{l}</span></div>
            ))}
          </div>
        </div>
      )}
      {t.options.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Question Options</div>
          <Detail items={t.options} />
        </div>
      )}
    </div>
  );

  return (
    <div className={`fixed inset-0 z-[100] flex ${phone ? "" : "items-center justify-center"}`} style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div
        className={`bg-white flex flex-col w-full ${phone ? "h-full" : "max-w-xl mx-4 rounded-2xl border border-slate-300 shadow-lift"}`}
        style={phone ? undefined : { height: "min(80vh, 680px)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-label="About this tool"
      >
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 flex-shrink-0">
          {(sub || topic) && <button onClick={() => setOpen(null)} className="text-sm font-semibold text-blue-900 -ml-1 pr-1">‹ Back</button>}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{sub ? sub.name : topic ? topic.title : "About this tool"}</h2>
            {!sub && !topic && title && <p className="text-sm text-slate-500 truncate">{title}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {sub ? subBody(sub) : topic ? <Detail items={topic.items} /> : (
            <div className="flex flex-col gap-5">
              {about.summary && <p className="text-base text-slate-700 leading-relaxed">{about.summary}</p>}
              {single && subBody(single)}
              {about.subTools.length > 1 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">What it covers</div>
                  <div className="flex flex-col rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                    {about.subTools.map((t) => (
                      <button key={t.key} onClick={() => setOpen(t.key)} className="flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 min-h-[44px]">
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-slate-800">{t.name}{t.key === current && <span className="ml-2 text-xs font-medium text-blue-900">this tab</span>}</span>
                          {t.purpose && <span className="block text-sm text-slate-500 leading-snug">{t.purpose}</span>}
                        </span>
                        <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {about.topics.length > 0 && (
                <div className="flex flex-col rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                  {about.topics.map((t) => (
                    <button key={t.id} onClick={() => setOpen(t.id)} className="flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 min-h-[44px]">
                      {t.icon && <span className="text-lg">{t.icon}</span>}
                      <span className="flex-1 text-sm font-semibold text-slate-800">{t.title}</span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2 bg-blue-900 text-white rounded-xl font-semibold text-sm hover:bg-blue-800">Close</button>
        </div>
      </div>
    </div>
  );
};
