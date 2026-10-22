import { Home, Info } from "lucide-react";
import { PAGE_BG } from "../colors";
import { TopicsSection, LevelSection, CluesSection } from "./WordFilters";
import type { WordFilter } from "./words";

const card = "rounded-2xl border border-slate-300 shadow-card bg-white p-5";

/**
 * The setup page every maths-words game shares: topics across the top, then three even cards
 * (level, clues, the game's own options), then a full-width Start button.
 */
export function SetupScreen({ title, subtitle, filter, onFilter, available, needed, startLabel, onStart, onInfo, actions, optionsTitle, children }: {
  title: string; subtitle: string; filter: WordFilter; onFilter: (f: WordFilter) => void;
  available: number; needed: number; startLabel: string; onStart: () => void; onInfo: () => void;
  actions?: React.ReactNode; optionsTitle?: string; children?: React.ReactNode;
}) {
  const ok = available >= needed;
  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:bg-white">
            <Home size={20} /> Home
          </button>
          <div className="flex items-center gap-1">
            {actions}
            <button onClick={onInfo} aria-label="Information" className="p-2 rounded-xl text-slate-500 hover:bg-white"><Info size={20} /></button>
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-1">{title}</h1>
        <p className="text-slate-500 mb-5">{subtitle}</p>

        <div className="flex flex-col gap-5">
          <section className={card}><TopicsSection filter={filter} onChange={onFilter} /></section>
          <div className={`grid gap-5 ${children ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
            <section className={card}><LevelSection filter={filter} onChange={onFilter} /></section>
            <section className={card}><CluesSection filter={filter} onChange={onFilter} /></section>
            {children && (
              <section className={card}>
                {optionsTitle && <h2 className="font-semibold text-slate-900 mb-3">{optionsTitle}</h2>}
                {children}
              </section>
            )}
          </div>
          <div>
            {!ok && (
              <p className="text-sm text-amber-700 mb-2">
                Only {available} usable words with these choices — add a topic, level or clue type (this game needs {needed}).
              </p>
            )}
            <button disabled={!ok} onClick={onStart}
              className="w-full rounded-2xl bg-blue-900 text-white font-semibold py-4 text-xl shadow-lift disabled:opacity-40">
              {startLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
