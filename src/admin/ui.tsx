import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Availability } from "./facts";

/** A filled dot = has it; a hollow one = does not. Shape as well as colour, so it reads without colour. */
export function Dot({ on, label }: { on: boolean; label: string }) {
  return on
    ? <span role="img" aria-label={`Has ${label}`} className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
    : <span role="img" aria-label={`No ${label}`} className="inline-block h-3 w-3 rounded-full border-2 border-slate-300" />;
}

/** A small coloured dot and a plain word: the only status marker the dashboard uses. */
export function Status({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-600">
      <span className={`h-2 w-2 rounded-full ${colour}`} aria-hidden />{label}
    </span>
  );
}

export const AVAIL_DOT: Record<Availability, string> = { live: "bg-emerald-500", dev: "bg-amber-500" };

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** A side panel for detail, so lists stay short and nothing expands inline. Escape or a click outside closes it. */
export function Drawer({ title, sub, onClose, footer, children }: {
  title: string; sub?: ReactNode; onClose: () => void; footer?: ReactNode; children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/30" onClick={onClose}>
      <aside role="dialog" aria-label={title} onClick={e => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-lift">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            {sub && <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-slate-200 bg-white px-5 py-3">{footer}</footer>}
      </aside>
    </div>
  );
}

/** A list row that opens a drawer. */
export const panel = "overflow-hidden rounded-2xl border border-slate-200 bg-white";
