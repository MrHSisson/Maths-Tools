import { useEffect, useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import { PRINT_TEMPLATES, printTemplate, templateHtml } from "./printGrid";

// The print page: pick a blank template on the left, see the A4 sheet as it will print on the right, and print it. Opened from the burger menu.

const MM = 3.7795; // CSS px per mm

export default function PrintTemplates({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState(PRINT_TEMPLATES[0].id);
  const t = PRINT_TEMPLATES.find((x) => x.id === id)!;
  const pageW = (t.orientation === "portrait" ? 210 : 297) * MM, pageH = (t.orientation === "portrait" ? 297 : 210) * MM;
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const fit = () => setScale(Math.min((el.clientWidth - 24) / pageW, (el.clientHeight - 24) / pageH, 1));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageW, pageH]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[400] flex flex-col" style={{ backgroundColor: "#f8f9fb" }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div>
          <div className="text-lg font-semibold text-slate-900">Print templates</div>
          <div className="text-sm text-slate-500">Blank squared grids and boxes, 50 × 20 squares each, for students to plot histograms and Gantt charts by hand.</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"><X size={20} /></button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 p-4">
        <div className="md:w-72 shrink-0 flex md:flex-col gap-2 overflow-auto">
          {PRINT_TEMPLATES.map((x) => (
            <button key={x.id} onClick={() => setId(x.id)} className={`text-left rounded-xl border px-3 py-2.5 bg-white min-w-[11rem] ${x.id === id ? "border-blue-900 ring-1 ring-blue-900" : "border-slate-300 hover:bg-slate-50"}`}>
              <div className="font-semibold text-slate-900 text-sm">{x.label}</div>
              <div className="text-xs text-slate-500 leading-snug mt-0.5">{x.hint}</div>
            </button>
          ))}
          <button onClick={() => printTemplate(t)} data-trusted-click className="md:mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 text-white font-semibold px-4 py-3 hover:bg-blue-800 min-w-[8rem]">
            <Printer size={18} /> Print
          </button>
        </div>
        <div ref={host} className="flex-1 min-w-0 min-h-0 rounded-2xl border border-slate-300 shadow-card bg-slate-100 flex items-center justify-center overflow-hidden">
          <div style={{ width: pageW * scale, height: pageH * scale }} className="shadow-lift bg-white">
            <iframe title="Preview" srcDoc={templateHtml(t)} style={{ width: pageW, height: pageH, border: 0, transform: `scale(${scale})`, transformOrigin: "0 0", pointerEvents: "none", background: "#fff" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
