import { Home, Info } from "lucide-react";
import { PAGE_BG } from "../colors";
import { WordFilterPanel } from "./WordFilters";
import type { WordFilter } from "./words";

/** The setup page every maths-words game shares: filters on the left, game options and Start on the right. */
export function SetupScreen({ title, subtitle, filter, onFilter, available, needed, startLabel, onStart, onInfo, children }: {
  title: string; subtitle: string; filter: WordFilter; onFilter: (f: WordFilter) => void;
  available: number; needed: number; startLabel: string; onStart: () => void; onInfo: () => void; children?: React.ReactNode;
}) {
  const ok = available >= needed;
  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:bg-white">
            <Home size={20} /> Home
          </button>
          <button onClick={onInfo} aria-label="Information" className="p-2 rounded-xl text-slate-500 hover:bg-white"><Info size={20} /></button>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-1">{title}</h1>
        <p className="text-slate-500 mb-5">{subtitle}</p>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-300 shadow-card bg-white p-5">
            <WordFilterPanel filter={filter} onChange={onFilter} />
          </section>
          <section className="rounded-2xl border border-slate-300 shadow-card bg-white p-5 flex flex-col">
            {children}
            <div className="mt-auto pt-6">
              {!ok && (
                <p className="text-sm text-amber-700 mb-2">
                  Only {available} usable words with these choices — add a topic, level or clue type (this game needs {needed}).
                </p>
              )}
              <button disabled={!ok} onClick={onStart}
                className="w-full rounded-xl bg-blue-900 text-white font-semibold py-3 text-lg disabled:opacity-40">
                {startLabel}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
