import { Fragment, useMemo, useState } from "react";
import { Search, SlidersHorizontal, ChevronDown, ChevronRight, Columns, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import {
  TOOLS, FEATURES, KINDS, AVAILABILITY_LABEL, availabilityOf,
  type ToolFacts, type Availability, type FeatureKey, type Kind,
} from "./facts";
import { STATUS_OPTIONS, REVIEW_OPTIONS, type Note, type NoteStore } from "./notes";
import { AVAIL_DOT, Dot, PageHead, Status, panel } from "./ui";

type Tri = "has" | "missing" | undefined;
type SortKey = "scheme" | "name" | "state";
const STATE_ORDER: Availability[] = ["live", "dev"];

// The code says whether a tool is on the site (availability); the note says where we think it is (plan).
// When they say the same thing, show it once.
const SAME_AS_AVAILABILITY: Record<Availability, string[]> = { live: ["live"], dev: ["in-development"] };
const planAdds = (a: Availability, status?: string) => !!status && !SAME_AS_AVAILABILITY[a].includes(status);
const planLabel = (s?: string) => STATUS_OPTIONS.find(o => o.value === s)?.label;
const hasList = (t: ToolFacts) => FEATURES.filter(f => t[f.key] && f.key !== "tests" && f.key !== "spec").map(f => f.label);

type ColKey = "state" | "has";
const COLUMNS: { key: ColKey; label: string }[] = [{ key: "state", label: "State" }, { key: "has", label: "Has" }];

/** The dots in the Matrix view: what a finished tool is expected to have. */
const MATRIX_NOTE_COLS: { key: string; label: string; hint: string; has: (n?: Note) => boolean }[] = [
  { key: "rev", label: "Reviewed", hint: "Marked as reviewed", has: n => n?.review === "done" },
];

/** useState that remembers per device (a convenience only: it works without storage). */
function usePersisted<T>(key: string, init: T): [T, (v: T | ((p: T) => T)) => void] {
  const [v, setV] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : init; } catch { return init; }
  });
  const set = (next: T | ((p: T) => T)) => setV(p => {
    const n = typeof next === "function" ? (next as (p: T) => T)(p) : next;
    try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* storage unavailable */ }
    return n;
  });
  return [v, set];
}

const AvailLabel = ({ t }: { t: ToolFacts }) => { const a = availabilityOf(t); return <Status colour={AVAIL_DOT[a]} label={AVAILABILITY_LABEL[a]} />; };

function ToolCard({ t, note, hideStrand, onOpen }: { t: ToolFacts; note?: Note; hideStrand?: boolean; onOpen: () => void }) {
  const a = availabilityOf(t);
  const has = hasList(t);
  return (
    <button onClick={onOpen} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900">{t.name}</div>
          <div className="text-xs text-slate-500">{hideStrand ? "" : `${t.category} · `}{t.shell}</div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <AvailLabel t={t} />
          {planAdds(a, note?.status) && <span className="text-xs text-slate-500">Plan: {planLabel(note?.status)}</span>}
        </div>
      </div>
      {has.length > 0 && <p className="mt-2 text-xs text-slate-500">{has.join(" · ")}</p>}
    </button>
  );
}

export function ToolsSection({ store, phone, onOpen }: { store: NoteStore; phone: boolean; onOpen: (id: string) => void }) {
  const [kind, setKind] = useState<Kind>("tool");
  const [view, setView] = useState<"list" | "matrix">("list");
  const [collapsed, setCollapsed] = usePersisted<string[]>("mt-admin-collapsed", []);
  const [cols, setCols] = usePersisted<Record<ColKey, boolean>>("mt-admin-cols", { state: true, has: true });
  const [showCols, setShowCols] = useState(false);
  const [sort, setSort] = useState<SortKey>("scheme");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [strand, setStrand] = useState("all");
  const [avail, setAvail] = useState<Availability | "all">("all");
  const [shell, setShell] = useState("all");
  const [feat, setFeat] = useState<Partial<Record<FeatureKey, Tri>>>({});

  const scoped = useMemo(() => TOOLS.filter(t => t.kind === kind), [kind]);
  const strands = useMemo(() => [...new Set(scoped.map(t => t.category))], [scoped]);
  const shells = useMemo(() => [...new Set(scoped.map(t => t.shell))], [scoped]);
  const kindCounts = useMemo(() => Object.fromEntries(KINDS.map(k => [k.key, TOOLS.filter(t => t.kind === k.key).length])) as Record<Kind, number>, []);
  const kindInfo = KINDS.find(k => k.key === kind)!;
  const isTool = kind === "tool";
  const noteOf = (id: string): Note | undefined => store.tools[id];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter(t => {
      if (strand !== "all" && t.category !== strand) return false;
      if (avail !== "all" && availabilityOf(t) !== avail) return false;
      if (shell !== "all" && t.shell !== shell) return false;
      for (const f of FEATURES) {
        const want = feat[f.key];
        if (want === "has" && !t[f.key]) return false;
        if (want === "missing" && t[f.key]) return false;
      }
      if (q && ![t.name, t.id, t.description, t.category, t.group ?? ""].some(s => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [scoped, query, strand, avail, shell, feat]);

  const groups = useMemo(() => {
    if (sort === "name") return [{ name: "", items: [...rows].sort((a, b) => a.name.localeCompare(b.name)) }];
    if (sort === "state") return [{ name: "", items: [...rows].sort((a, b) => STATE_ORDER.indexOf(availabilityOf(a)) - STATE_ORDER.indexOf(availabilityOf(b))) }];
    const by = new Map<string, ToolFacts[]>();
    rows.forEach(t => by.set(t.category, [...(by.get(t.category) ?? []), t]));
    return [...by].map(([name, items]) => ({ name: by.size > 1 ? name : "", items }));
  }, [rows, sort]);
  const colCount = 1 + COLUMNS.filter(c => cols[c.key]).length;
  const matrixCols = useMemo(() => [
    ...FEATURES.filter(f => f.key !== "tests").map(f => ({ key: f.key as string, label: f.label, hint: f.hint, has: (t: ToolFacts, _n?: Note) => !!t[f.key] })),
    ...MATRIX_NOTE_COLS.map(c => ({ key: c.key, label: c.label, hint: c.hint, has: (_t: ToolFacts, n?: Note) => c.has(n) })),
  ], []);
  const isCollapsed = (name: string) => !!name && collapsed.includes(name);
  const toggle = (name: string) => setCollapsed(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  const filterCount = (strand !== "all" ? 1 : 0) + (shell !== "all" ? 1 : 0) + (avail !== "all" ? 1 : 0) + Object.values(feat).filter(Boolean).length;
  const live = scoped.filter(t => t.enabled).length;

  const cycle = (k: FeatureKey) => setFeat(f => ({ ...f, [k]: f[k] === undefined ? "has" : f[k] === "has" ? "missing" : undefined }));
  const filtersOn = query || filterCount > 0;
  const pickKind = (k: Kind) => { setKind(k); setStrand("all"); setShell("all"); setFeat({}); };
  const clearAll = () => { setQuery(""); setStrand("all"); setAvail("all"); setShell("all"); setFeat({}); };

  const sel = "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
  const groupHead = (name: string, n: number) => (
    <>{isCollapsed(name) ? <ChevronRight size={14} className="inline -mt-0.5 mr-1" /> : <ChevronDown size={14} className="inline -mt-0.5 mr-1" />}{name} <span className="font-normal normal-case text-slate-400">· {n}</span></>
  );

  return (
    <div>
      <PageHead title="Tools" sub={`${live} live · ${scoped.length - live} not live`} />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="order-1 flex basis-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 sm:flex-1 sm:basis-auto sm:min-w-[220px]">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${kindInfo.label.toLowerCase()}`} className="w-full bg-transparent text-sm outline-none" />
          </label>
          <select value={kind} onChange={e => pickKind(e.target.value as Kind)} title={kindInfo.hint} aria-label="What to show"
            className={`order-2 min-w-0 flex-1 font-semibold text-slate-800 sm:flex-none ${sel}`}>
            {KINDS.map(k => <option key={k.key} value={k.key}>{k.label} ({kindCounts[k.key]})</option>)}
          </select>
          <button onClick={() => setShowFilters(v => !v)} aria-expanded={showFilters}
            className={`order-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${showFilters || filterCount ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
            <SlidersHorizontal size={16} />Filters{filterCount > 0 && <span className="min-w-[1.25rem] rounded-full bg-sky-700 px-1.5 text-center text-xs text-white">{filterCount}</span>}
          </button>
          {view === "list" && !phone && (
            <div className="relative order-4">
              <button onClick={() => setShowCols(v => !v)} aria-expanded={showCols} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Columns size={16} />Columns
              </button>
              {showCols && (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lift">
                  {COLUMNS.map(c => (
                    <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                      <input type="checkbox" checked={cols[c.key]} onChange={e => setCols(p => ({ ...p, [c.key]: e.target.checked }))} />{c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className={`order-5 hidden sm:block ${sel}`} aria-label="Order">
            <option value="scheme">By strand</option>
            <option value="name">A–Z</option>
            <option value="state">By state</option>
          </select>
        </div>
        {showFilters && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap gap-3">
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className={`sm:hidden ${sel}`} aria-label="Order">
                <option value="scheme">Order: by strand</option>
                <option value="name">Order: A–Z</option>
                <option value="state">Order: by state</option>
              </select>
              <select value={avail} onChange={e => setAvail(e.target.value as Availability | "all")} className={sel} aria-label="State">
                <option value="all">Live or not</option>
                <option value="live">Live</option>
                <option value="dev">Not live</option>
              </select>
              <select value={strand} onChange={e => setStrand(e.target.value)} className={sel} aria-label="Strand">
                <option value="all">All strands</option>
                {strands.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={shell} onChange={e => setShell(e.target.value)} className={sel} aria-label="Shell">
                <option value="all">Any shell</option>
                {shells.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {isTool && (
              <div>
                <div className="mb-2 text-sm text-slate-500">Features (click to cycle: has, missing, any)</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  {FEATURES.map(f => (
                    <button key={f.key} title={f.hint} onClick={() => cycle(f.key)}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-50 ${feat[f.key] ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                      {feat[f.key] === "has" ? <Dot on label={f.label} /> : feat[f.key] === "missing" ? <span className="inline-block h-3 w-3 rounded-full bg-red-400" aria-label={`Missing ${f.label}`} /> : <Dot on={false} label={f.label} />}
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex w-full gap-1 rounded-xl bg-slate-200/70 p-1 sm:w-auto" role="tablist">
          {([["list", "List"], ["matrix", "Matrix"]] as const).map(([v, label]) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1 text-sm font-semibold sm:flex-none ${view === v ? "bg-white text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>{label}</button>
          ))}
        </div>
        <div className="flex w-full items-center whitespace-nowrap text-sm text-slate-500 sm:w-auto">
          {groups.some(g => g.name) && (
            <>
              <button onClick={() => setCollapsed(groups.map(g => g.name).filter(Boolean))} className="mr-2 inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900"><ChevronsDownUp size={15} />Collapse</button>
              <button onClick={() => setCollapsed([])} className="mr-auto inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 sm:mr-3"><ChevronsUpDown size={15} />Expand</button>
            </>
          )}
          {`${rows.length} of ${scoped.length} ${kindInfo.label.toLowerCase()}`}
          {filtersOn && <button onClick={clearAll} className="ml-3 font-semibold text-sky-800 hover:underline">Clear filters</button>}
        </div>
      </div>

      {view === "list" && phone ? (
        <div className="flex flex-col gap-3">
          {groups.map(g => (
            <div key={g.name || "all"} className="flex flex-col gap-3">
              {g.name && (
                <button onClick={() => toggle(g.name)} aria-expanded={!isCollapsed(g.name)} className="mt-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{groupHead(g.name, g.items.length)}</button>
              )}
              {!isCollapsed(g.name) && g.items.map(t => <ToolCard key={t.id} t={t} note={noteOf(t.id)} hideStrand={!!g.name} onOpen={() => onOpen(t.id)} />)}
            </div>
          ))}
          {rows.length === 0 && <p className="py-8 text-center text-slate-500">Nothing matches these filters.</p>}
        </div>
      ) : view === "matrix" ? (
        phone ? (
          <div className="space-y-4">
            {groups.map(g => (
              <div key={g.name || "all"}>
                {g.name && <button onClick={() => toggle(g.name)} className="mb-1.5 flex w-full items-center text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{groupHead(g.name, g.items.length)}</button>}
                {!isCollapsed(g.name) && <div className="space-y-2">
                  {g.items.map(t => {
                    const n = noteOf(t.id);
                    const has = matrixCols.filter(c => c.has(t, n));
                    const lacks = matrixCols.filter(c => !c.has(t, n));
                    return (
                      <button key={t.id} onClick={() => onOpen(t.id)} className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-slate-300">
                        <div className="font-semibold text-slate-900">{t.name} <span className="text-xs font-normal text-slate-400">{has.length} of {matrixCols.length}</span></div>
                        {has.length > 0 && <p className="mt-1.5 text-xs text-slate-700">{has.map(c => c.label).join(" · ")}</p>}
                        {lacks.length > 0 && <p className="mt-1 text-xs text-slate-400">Missing: {lacks.map(c => c.label).join(" · ")}</p>}
                      </button>
                    );
                  })}
                </div>}
              </div>
            ))}
            {rows.length === 0 && <p className="py-8 text-center text-slate-500">Nothing matches these filters.</p>}
          </div>
        ) : (
          <div className={`${panel} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                <tr>
                  <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left align-bottom font-semibold">Tool</th>
                  {matrixCols.map(c => (
                    <th key={c.key} title={c.hint} className="px-1 py-3 align-bottom font-semibold">
                      <span className="mx-auto block rotate-180 whitespace-nowrap text-xs [writing-mode:vertical-rl]">{c.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <Fragment key={g.name || "all"}>
                    {g.name && (
                      <tr className="cursor-pointer border-t border-slate-200 bg-slate-50/80" onClick={() => toggle(g.name)}>
                        <td colSpan={matrixCols.length + 1} className="sticky left-0 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{groupHead(g.name, g.items.length)}</td>
                      </tr>
                    )}
                    {!isCollapsed(g.name) && g.items.map(t => {
                      const n = noteOf(t.id);
                      return (
                        <tr key={t.id} onClick={() => onOpen(t.id)} className="cursor-pointer border-t border-slate-200 hover:bg-sky-50">
                          <td className="sticky left-0 whitespace-nowrap bg-white px-4 py-2 font-semibold text-slate-900">{t.name}</td>
                          {matrixCols.map(c => <td key={c.key} className="px-1 py-2 text-center"><Dot on={c.has(t, n)} label={c.label} /></td>)}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
                {rows.length > 0 && (
                  <tr className="border-t-2 border-slate-300 bg-slate-50 text-xs font-semibold text-slate-600">
                    <td className="sticky left-0 bg-slate-50 px-4 py-2">Have it</td>
                    {matrixCols.map(c => <td key={c.key} className="px-1 py-2 text-center" title={`${rows.filter(t => c.has(t, noteOf(t.id))).length} of ${rows.length}`}>{rows.filter(t => c.has(t, noteOf(t.id))).length}</td>)}
                  </tr>
                )}
                {rows.length === 0 && <tr><td colSpan={matrixCols.length + 1} className="px-4 py-10 text-center text-slate-500">Nothing matches these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className={panel}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Tool</th>
                {cols.state && <th className="px-3 py-3 font-semibold">State</th>}
                {cols.has && <th className="px-3 py-3 font-semibold">Has</th>}
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <Fragment key={g.name || "all"}>
                  {g.name && (
                    <tr className="cursor-pointer border-t border-slate-200 bg-slate-50/80 hover:bg-slate-100" onClick={() => toggle(g.name)}>
                      <td colSpan={colCount} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{groupHead(g.name, g.items.length)}</td>
                    </tr>
                  )}
                  {!isCollapsed(g.name) && g.items.map(t => {
                    const n = noteOf(t.id);
                    const a = availabilityOf(t);
                    return (
                      <tr key={t.id} onClick={() => onOpen(t.id)} className="cursor-pointer border-t border-slate-200 align-top hover:bg-sky-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{t.name}</div>
                          <div className="text-xs text-slate-500">{t.group ? `${t.group} · ` : ""}{t.shell}{t.subTools ? ` · ${t.subTools} sub-tool${t.subTools > 1 ? "s" : ""}` : ""}</div>
                        </td>
                        {cols.state && (
                          <td className="whitespace-nowrap px-3 py-3">
                            <AvailLabel t={t} />
                            {(planAdds(a, n?.status) || (n?.review && n.review !== "not-started")) && (
                              <div className="mt-0.5 text-xs text-slate-500">
                                {planAdds(a, n?.status) && <>Plan: {planLabel(n?.status)}</>}
                                {planAdds(a, n?.status) && n?.review && n.review !== "not-started" && " · "}
                                {n?.review && n.review !== "not-started" && REVIEW_OPTIONS.find(o => o.value === n.review)?.label}
                              </div>
                            )}
                          </td>
                        )}
                        {cols.has && <td className="px-3 py-3 text-xs text-slate-600">{hasList(t).join(" · ") || <span className="text-slate-300">—</span>}</td>}
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
              {rows.length === 0 && <tr><td colSpan={colCount} className="px-4 py-10 text-center text-slate-500">Nothing matches these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
