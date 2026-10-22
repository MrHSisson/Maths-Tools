import { PACKS, CLUE_KINDS, KEY_STAGES, type WordFilter, type PackId, type ClueKind, type Ks } from "./words";

const chip = (on: boolean) =>
  `text-left rounded-2xl border p-4 transition-colors ${on ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-white hover:bg-slate-50"}`;

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

/** The three word filters every maths-words game shares: topic packs, key stages and clue types. */
export function WordFilterPanel({ filter, onChange, children }: {
  filter: WordFilter; onChange: (f: WordFilter) => void; children?: React.ReactNode;
}) {
  return (
    <>
      <h2 className="font-semibold text-slate-900 mb-3">Topics</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {PACKS.map(p => (
          <button key={p.id} className={chip(filter.packs.includes(p.id))}
            onClick={() => onChange({ ...filter, packs: toggle<PackId>(filter.packs, p.id) })}>
            <div className="font-semibold text-slate-900">{p.name}</div>
            <div className="text-sm text-slate-500">{p.blurb}</div>
          </button>
        ))}
      </div>
      <h2 className="font-semibold text-slate-900 mt-6 mb-3">Level</h2>
      <div className="grid gap-3 grid-cols-3">
        {KEY_STAGES.map(k => (
          <button key={k.id} className={chip(filter.ks.includes(k.id))}
            onClick={() => onChange({ ...filter, ks: toggle<Ks>(filter.ks, k.id) })}>
            <div className="font-semibold text-slate-900">{k.name}</div>
            <div className="text-sm text-slate-500">{k.blurb}</div>
          </button>
        ))}
      </div>
      <h2 className="font-semibold text-slate-900 mt-6 mb-3">Clues</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {CLUE_KINDS.map(k => (
          <button key={k.id} className={chip(filter.kinds.includes(k.id))}
            onClick={() => onChange({ ...filter, kinds: toggle<ClueKind>(filter.kinds, k.id) })}>
            <div className="font-semibold text-slate-900">{k.name}</div>
            <div className="text-sm text-slate-500">{k.blurb}</div>
          </button>
        ))}
      </div>
      {children}
    </>
  );
}

export const optionChip = chip;
