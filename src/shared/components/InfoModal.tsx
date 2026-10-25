import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import type { InfoSection, ToolEntry } from "../types";
import { buildAbout, type AboutMode } from "../about";
import { useLayoutMode } from "../layoutMode";

/** "About this tool": a short summary and the modes up front, then a list of topics; a topic opens its detail with a Back button.
 *  Given the current sub-tool (`entry`) it also writes the Question Options topic from the config, so that part is never stale.
 *  Phones get a full-screen sheet. */
export const InfoModal = ({ infoSections, onClose, title, entry, modes }: {
  infoSections: InfoSection[]; onClose: () => void; title?: string; entry?: ToolEntry; modes?: AboutMode[];
}) => {
  const about = useMemo(() => buildAbout({ infoSections, entry, modes }), [infoSections, entry, modes]);
  const [open, setOpen] = useState<string | null>(null);
  const { phone } = useLayoutMode();
  const topic = about.topics.find((t) => t.id === open) ?? null;
  return (
    <div className={`fixed inset-0 z-[100] flex ${phone ? "" : "items-center justify-center"}`} style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div
        className={`bg-white flex flex-col w-full ${phone ? "h-full" : "max-w-xl mx-4 rounded-2xl border border-slate-300 shadow-lift"}`}
        style={phone ? undefined : { height: "min(80vh, 640px)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-label="About this tool"
      >
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 flex-shrink-0">
          {topic && <button onClick={() => setOpen(null)} className="text-sm font-semibold text-blue-900 -ml-1 pr-1">‹ Back</button>}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{topic ? topic.title : "About this tool"}</h2>
            {!topic && title && <p className="text-sm text-slate-500 truncate">{title}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {topic ? (
            <div className="flex flex-col gap-4">
              {topic.items.map((i, k) => (
                <div key={`${i.label}-${k}`}>
                  <div className="text-sm font-semibold text-slate-800">{i.label}</div>
                  <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{i.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {about.summary && <p className="text-base text-slate-700 leading-relaxed">{about.summary}</p>}
              {about.modes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Ways to use it</div>
                  <div className="flex flex-col gap-1.5">
                    {about.modes.map((m) => (
                      <div key={m.label} className="text-sm"><span className="font-semibold text-slate-800">{m.label}</span><span className="text-slate-500"> · {m.sub}</span></div>
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
