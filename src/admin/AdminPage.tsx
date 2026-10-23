import { Fragment, useEffect, useMemo, useState } from "react";
import { Home, Search, ExternalLink, X, RefreshCw, Check, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { PAGE_BG } from "../shared/colors";
import { useLayoutMode } from "../shared/layoutMode";
import { useDevMode, setDevMode } from "../devMode";
import { checkDevPassword } from "../devAccess";
import {
  TOOLS, FEATURES, KINDS, AVAILABILITY_LABEL, availabilityOf,
  type ToolFacts, type Availability, type FeatureKey, type Kind,
} from "./facts";
import {
  STATUS_OPTIONS, REVIEW_OPTIONS, TEXT_FIELDS, emptyStore,
  type Note, type NoteStore, type NoteTextField,
} from "./notes";
import { loadNotes, saveNote, type NotesMode } from "./notesApi";

const AVAIL_STYLE: Record<Availability, string> = {
  live: "bg-emerald-100 text-emerald-800",
  dev: "bg-amber-100 text-amber-800",
  hidden: "bg-slate-200 text-slate-700",
  parked: "bg-violet-100 text-violet-800",
};
const STATUS_STYLE: Record<string, string> = {
  idea: "bg-sky-100 text-sky-800", "in-development": "bg-amber-100 text-amber-800",
  ready: "bg-emerald-100 text-emerald-800", live: "bg-emerald-100 text-emerald-800", shelved: "bg-slate-200 text-slate-700",
};
const TEXT_LABEL: Record<NoteTextField, { label: string; hint: string }> = {
  inDevelopment: { label: "In development", hint: "What is being built right now" },
  wantsToChange: { label: "What we want to change", hint: "Improvements, gaps, things to fix" },
  differsFrom: { label: "Differs from / adds to the standard", hint: "How it departs from the usual tool, or what it adds" },
  representation: { label: "Representation", hint: "The picture(s) agreed for this tool, in plain words" },
  openQuestions: { label: "Open questions", hint: "Decisions we still need to make" },
};

const pill = "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";
const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const first = (n?: Note) => n?.inDevelopment || n?.wantsToChange || n?.openQuestions || "";

type Tri = "has" | "missing" | undefined;

// The code says whether a tool is on the site (availability); the note says where we think it is (plan).
// When they say the same thing, show it once.
const SAME_AS_AVAILABILITY: Record<Availability, string[]> = { live: ["live"], dev: ["in-development"], hidden: ["shelved"], parked: ["shelved"] };
type SortKey = "scheme" | "name" | "state";
const STATE_ORDER: Availability[] = ["live", "dev", "hidden", "parked"];

/** What is worth picking up next on a tool, from the notes and the code. */
function nextUp(t: ToolFacts, n: Note | undefined): { score: number; reasons: string[] } {
  const a = availabilityOf(t);
  const reasons: string[] = []; let score = 0;
  const add = (pts: number, why: string) => { score += pts; reasons.push(why); };
  const hint = (why: string) => { if (score > 0) reasons.push(why); }; // housekeeping: shown, but never enough on its own
  if (n?.status === "ready" && a !== "live") add(4, "Ready to go live");
  if (n?.openQuestions?.trim()) add(3, "Open questions");
  if (n?.wantsToChange?.trim()) add(2, "Changes planned");
  if (n?.status === "in-development" || n?.inDevelopment?.trim()) add(2, "In progress");
  if (a === "live" && (!n?.review || n.review === "not-started")) hint("Not reviewed");
  if (a !== "parked" && !n?.representationAgreed) hint("No agreed picture");
  return { score, reasons };
}
const planAdds = (a: Availability, status?: string) => !!status && !SAME_AS_AVAILABILITY[a].includes(status);

export default function AdminPage() {
  const devMode = useDevMode();
  const { phone } = useLayoutMode();
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);

  const [store, setStore] = useState<NoteStore>(emptyStore());
  const [mode, setMode] = useState<NotesMode>("local");
  const [problem, setProblem] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [kind, setKind] = useState<Kind>("tool");
  const [view, setView] = useState<"list" | "next">("list");
  const [sort, setSort] = useState<SortKey>("scheme");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [strand, setStrand] = useState("all");
  const [avail, setAvail] = useState<Availability | "all">("all");
  const [shell, setShell] = useState("all");
  const [feat, setFeat] = useState<Partial<Record<FeatureKey, Tri>>>({});
  const [agreedRep, setAgreedRep] = useState<Tri>(undefined);
  const [attention, setAttention] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const r = await loadNotes();
    setStore(r.store); setMode(r.mode); setProblem(r.problem); setLoading(false);
  };
  useEffect(() => { if (devMode) void refresh(); }, [devMode]);

  const scoped = useMemo(() => TOOLS.filter(t => t.kind === kind), [kind]);
  const strands = useMemo(() => [...new Set(scoped.map(t => t.category))], [scoped]);
  const shells = useMemo(() => [...new Set(scoped.map(t => t.shell))], [scoped]);
  const kindCounts = useMemo(() => Object.fromEntries(KINDS.map(k => [k.key, TOOLS.filter(t => t.kind === k.key).length])) as Record<Kind, number>, []);
  const kindInfo = KINDS.find(k => k.key === kind)!;
  const isTool = kind === "tool";
  const noteOf = (id: string): Note | undefined => store.tools[id];
  const needsAttention = (id: string) => !!(noteOf(id)?.wantsToChange?.trim() || noteOf(id)?.openQuestions?.trim());

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter(t => {
      const n = store.tools[t.id];
      if (strand !== "all" && t.category !== strand) return false;
      if (avail !== "all" && availabilityOf(t) !== avail) return false;
      if (shell !== "all" && t.shell !== shell) return false;
      for (const f of FEATURES) {
        const want = feat[f.key];
        if (want === "has" && !t[f.key]) return false;
        if (want === "missing" && t[f.key]) return false;
      }
      if (agreedRep === "has" && !n?.representationAgreed) return false;
      if (agreedRep === "missing" && n?.representationAgreed) return false;
      if (attention && !(n?.wantsToChange?.trim() || n?.openQuestions?.trim())) return false;
      if (q && ![t.name, t.id, t.description, t.category, t.group ?? "", ...Object.values(n ?? {}).filter(v => typeof v === "string") as string[]]
        .some(s => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [scoped, query, strand, avail, shell, feat, agreedRep, attention, store]);

  const groups = useMemo(() => {
    if (sort === "name") return [{ name: "", items: [...rows].sort((a, b) => a.name.localeCompare(b.name)) }];
    if (sort === "state") return [{ name: "", items: [...rows].sort((a, b) => STATE_ORDER.indexOf(availabilityOf(a)) - STATE_ORDER.indexOf(availabilityOf(b))) }];
    const by = new Map<string, ToolFacts[]>();
    rows.forEach(t => by.set(t.category, [...(by.get(t.category) ?? []), t]));
    return [...by].map(([name, items]) => ({ name: by.size > 1 ? name : "", items }));
  }, [rows, sort]);
  const nextRows = useMemo(() => rows
    .map(t => ({ t, ...nextUp(t, store.tools[t.id]) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name)), [rows, store]);
  const filterCount = (strand !== "all" ? 1 : 0) + (shell !== "all" ? 1 : 0) + (agreedRep ? 1 : 0) + Object.values(feat).filter(Boolean).length;

  const counts = useMemo(() => {
    const c: Record<Availability, number> = { live: 0, dev: 0, hidden: 0, parked: 0 };
    scoped.forEach(t => { c[availabilityOf(t)]++; });
    return c;
  }, [scoped]);
  const attentionCount = scoped.filter(t => needsAttention(t.id)).length;
  const noRepCount = scoped.filter(t => availabilityOf(t) !== "parked" && !store.tools[t.id]?.representationAgreed).length;

  const cycle = (k: FeatureKey) => setFeat(f => ({ ...f, [k]: f[k] === undefined ? "has" : f[k] === "has" ? "missing" : undefined }));
  const filtersOn = query || strand !== "all" || avail !== "all" || shell !== "all" || attention || agreedRep || Object.values(feat).some(Boolean);
  const pickKind = (k: Kind) => { setKind(k); setStrand("all"); setShell("all"); setFeat({}); setAgreedRep(undefined); };
  const clearAll = () => { setQuery(""); setStrand("all"); setAvail("all"); setShell("all"); setFeat({}); setAgreedRep(undefined); setAttention(false); };

  // ── Locked ────────────────────────────────────────────────────────────────
  if (!devMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: PAGE_BG }}>
        <form
          onSubmit={e => { e.preventDefault(); if (checkDevPassword(password)) setDevMode(true); else setWrong(true); }}
          className="w-full max-w-sm rounded-2xl border border-slate-300 shadow-card bg-white p-6 flex flex-col gap-3"
        >
          <h1 className="text-2xl font-semibold text-slate-900">Tools dashboard</h1>
          <p className="text-sm text-slate-500">Enter the Developing tools password to continue.</p>
          <input type="password" autoFocus value={password} onChange={e => { setPassword(e.target.value); setWrong(false); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" aria-label="Password" />
          {wrong && <p className="text-sm text-red-600">That password is not right.</p>}
          <div className="flex justify-between">
            <button type="button" onClick={() => { window.location.href = "/"; }} className="px-3 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100">Home</button>
            <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-blue-900 text-white">Unlock</button>
          </div>
        </form>
      </div>
    );
  }

  const chipBtn = (on: boolean) => `rounded-full border px-3 py-1 text-sm font-semibold ${on ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`;
  const sel = TOOLS.find(t => t.id === selected) ?? null;

  const statCard = (label: string, value: number, on: boolean, onClick: () => void, tone = "text-slate-900") => (
    <button onClick={onClick} className={`rounded-2xl border p-4 text-left shadow-card ${on ? "border-sky-500 bg-sky-50" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
      <div className={`text-3xl font-semibold ${tone}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </button>
  );

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:bg-white"><Home size={20} />Home</button>
          <button onClick={() => void refresh()} className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:bg-white"><RefreshCw size={18} className={loading ? "animate-spin" : ""} />Refresh</button>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">Tools dashboard</h1>
        <p className="text-slate-500 mb-3">
          {kindCounts.tool} teaching tools, plus {TOOLS.length - kindCounts.tool} other things (sandboxes, games, generators, internal pages) kept apart so they don't count as tools.
        </p>

        <div className="flex flex-wrap gap-x-5 border-b border-slate-300 mb-1" role="tablist">
          {KINDS.map(k => (
            <button key={k.key} role="tab" aria-selected={kind === k.key} title={k.hint} onClick={() => pickKind(k.key)}
              className={`-mb-px pb-2 pt-1 text-sm font-semibold border-b-2 ${kind === k.key ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              {k.label} <span className="font-normal text-slate-400">{kindCounts[k.key]}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500 mb-4">{kindInfo.hint}.</p>

        {mode === "local" && !loading && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div className="text-sm">
              <b>Notes are saved on this device only.</b> The shared notes service isn't connected{problem ? ` (${problem})` : ""}, so what you write here won't be seen by Claude or other devices yet.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          {statCard("Live", counts.live, avail === "live", () => setAvail(avail === "live" ? "all" : "live"), "text-emerald-700")}
          {statCard("In development", counts.dev, avail === "dev", () => setAvail(avail === "dev" ? "all" : "dev"), "text-amber-700")}
          {statCard("Hidden", counts.hidden, avail === "hidden", () => setAvail(avail === "hidden" ? "all" : "hidden"))}
          {statCard("Parked", counts.parked, avail === "parked", () => setAvail(avail === "parked" ? "all" : "parked"), "text-violet-700")}
          {statCard("Need attention", attentionCount, attention, () => setAttention(!attention), "text-rose-700")}
          {isTool
            ? statCard("No agreed representation", noRepCount, agreedRep === "missing", () => setAgreedRep(agreedRep === "missing" ? undefined : "missing"))
            : statCard("Total", scoped.length, false, () => setAvail("all"))}
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 flex-1 min-w-[220px]">
              <Search size={16} className="text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${kindInfo.label.toLowerCase()} and notes`} className="outline-none text-sm w-full bg-transparent" />
            </label>
            <button onClick={() => setShowFilters(v => !v)} aria-expanded={showFilters}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${showFilters || filterCount ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
              <SlidersHorizontal size={16} />Filters
              {filterCount > 0 && <span className="rounded-full bg-sky-700 text-white text-xs px-1.5 min-w-[1.25rem] text-center">{filterCount}</span>}
            </button>
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)} disabled={view === "next"} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-40" aria-label="Order">
              <option value="scheme">By strand</option>
              <option value="name">A–Z</option>
              <option value="state">By state</option>
            </select>
          </div>
          {showFilters && (
            <div className="rounded-2xl border border-slate-300 shadow-card bg-white p-4 flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <select value={strand} onChange={e => setStrand(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" aria-label="Strand">
                  <option value="all">All strands</option>
                  {strands.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={shell} onChange={e => setShell(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white" aria-label="Shell">
                  <option value="all">Any shell</option>
                  {shells.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {isTool && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500 mr-1">Features:</span>
                  {FEATURES.map(f => (
                    <button key={f.key} title={`${f.hint}. Click to cycle: has → missing → any`} onClick={() => cycle(f.key)} className={chipBtn(!!feat[f.key])}>
                      {feat[f.key] === "has" ? "✓ " : feat[f.key] === "missing" ? "✗ " : ""}{f.label}
                    </button>
                  ))}
                  <button title="Click to cycle: agreed → not agreed → any" onClick={() => setAgreedRep(agreedRep === undefined ? "has" : agreedRep === "has" ? "missing" : undefined)} className={chipBtn(!!agreedRep)}>
                    {agreedRep === "has" ? "✓ " : agreedRep === "missing" ? "✗ " : ""}Agreed representation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex gap-1 rounded-xl bg-slate-200/70 p-1" role="tablist">
            {([["list", "All"], ["next", "Next up"]] as const).map(([v, label]) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${view === v ? "bg-white text-slate-900 shadow-card" : "text-slate-600 hover:text-slate-900"}`}>{label}</button>
            ))}
          </div>
          <div className="text-sm text-slate-500">
            {view === "next" ? `${nextRows.length} worth a look` : `${rows.length} of ${scoped.length} ${kindInfo.label.toLowerCase()}`}
            {filtersOn && <button onClick={clearAll} className="ml-3 font-semibold text-sky-800 hover:underline">Clear filters</button>}
          </div>
        </div>
        {view === "next" && <p className="text-sm text-slate-500 mb-3">The most useful things to pick up, from the notes: open questions, planned changes, tools ready to go live, and tools not yet reviewed.</p>}

        {view === "next" ? (
          <div className="grid gap-3 md:grid-cols-2">
            {nextRows.map(r => <ToolCard key={r.t.id} t={r.t} note={noteOf(r.t.id)} reasons={r.reasons} onOpen={() => setSelected(r.t.id)} />)}
            {nextRows.length === 0 && <div className="rounded-2xl border border-slate-300 bg-white p-8 text-center text-slate-500 md:col-span-2">Nothing flagged here. Add notes to a tool and it will show up.</div>}
          </div>
        ) : phone ? (
          <div className="flex flex-col gap-3">
            {groups.map(g => (
              <div key={g.name} className="flex flex-col gap-3">
                {g.name && <h2 className="text-sm font-semibold text-slate-500 mt-2">{g.name} <span className="font-normal text-slate-400">{g.items.length}</span></h2>}
                {g.items.map(t => <ToolCard key={t.id} t={t} note={noteOf(t.id)} onOpen={() => setSelected(t.id)} />)}
              </div>
            ))}
            {rows.length === 0 && <p className="text-center text-slate-500 py-8">Nothing matches these filters.</p>}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-300 shadow-card bg-white overflow-clip">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 sticky top-0 z-10 shadow-[0_1px_0_0_theme(colors.slate.200)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tool</th>
                  <th className="px-3 py-3 font-semibold">State</th>
                  <th className="px-3 py-3 font-semibold">Has</th>
                  <th className="px-3 py-3 font-semibold">Representation</th>
                  <th className="px-3 py-3 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <Fragment key={g.name || "all"}>
                    {g.name && (
                      <tr className="bg-slate-50/80 border-t border-slate-200">
                        <td colSpan={5} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.name} <span className="font-normal normal-case text-slate-400">· {g.items.length}</span></td>
                      </tr>
                    )}
                    {g.items.map(t => {
                      const n = noteOf(t.id);
                      const a = availabilityOf(t);
                      return (
                        <tr key={t.id} onClick={() => setSelected(t.id)} className="border-t border-slate-200 hover:bg-sky-50 cursor-pointer align-top">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{t.name}</div>
                            <div className="text-xs text-slate-500">{t.group ? `${t.group} · ` : ""}{t.shell}{t.subTools ? ` · ${t.subTools} sub-tool${t.subTools > 1 ? "s" : ""}` : ""}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap items-center gap-1 max-w-[190px]">
                              <span className={`${pill} ${AVAIL_STYLE[a]}`}>{AVAILABILITY_LABEL[a]}</span>
                              {planAdds(a, n?.status) && <span title="Plan status (from the notes)" className={`${pill} ${STATUS_STYLE[n!.status!]}`}>Plan: {STATUS_OPTIONS.find(o => o.value === n!.status)?.label}</span>}
                              {n?.review && n.review !== "not-started" && <span className={`${pill} bg-slate-100 text-slate-600`}>{REVIEW_OPTIONS.find(o => o.value === n.review)?.label}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[230px]">
                              {FEATURES.filter(f => t[f.key] && f.key !== "tests" && f.key !== "spec").map(f => <span key={f.key} className="inline-block rounded-md bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">{f.label}</span>)}
                              {!FEATURES.some(f => t[f.key] && f.key !== "tests" && f.key !== "spec") && <span className="text-slate-300">—</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 max-w-[200px]">
                            {n?.representation
                              ? <span className="text-slate-700">{n.representationAgreed && <Check size={14} className="inline text-emerald-600 mr-1" />}{n.representation}</span>
                              : t.representations.length > 0
                                ? <span className="text-slate-400">{t.representations.join(", ")}</span>
                                : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-3 text-slate-600 max-w-[300px]">
                            <div className="line-clamp-2">{first(n) || <span className="text-slate-300">—</span>}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Nothing matches these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sel && (
        <Detail
          key={sel.id} t={sel} note={noteOf(sel.id)} mode={mode} phone={phone}
          onClose={() => setSelected(null)}
          onSave={async fields => { setStore(await saveNote(mode, store, sel.id, fields, "Harry")); }}
        />
      )}
    </div>
  );
}

function ToolCard({ t, note, reasons, onOpen }: { t: ToolFacts; note?: Note; reasons?: string[]; onOpen: () => void }) {
  const a = availabilityOf(t);
  return (
    <button onClick={onOpen} className="text-left rounded-2xl border border-slate-300 shadow-card bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900">{t.name}</div>
          <div className="text-xs text-slate-500">{t.category} · {t.shell}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`${pill} ${AVAIL_STYLE[a]}`}>{AVAILABILITY_LABEL[a]}</span>
          {planAdds(a, note?.status) && <span className={`${pill} ${STATUS_STYLE[note!.status!]}`}>Plan: {STATUS_OPTIONS.find(o => o.value === note!.status)?.label}</span>}
        </div>
      </div>
      {reasons && reasons.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">{reasons.map(r => <span key={r} className={`${pill} bg-rose-50 text-rose-800`}>{r}</span>)}</div>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {FEATURES.filter(f => t[f.key] && f.key !== "tests" && f.key !== "spec").map(f => <span key={f.key} className={`${pill} bg-slate-100 text-slate-700`}>{f.label}</span>)}
      </div>
      {first(note) && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{first(note)}</p>}
    </button>
  );
}

function Detail({ t, note, mode, phone, onClose, onSave }: {
  t: ToolFacts; note?: Note; mode: NotesMode; phone: boolean; onClose: () => void; onSave: (f: Partial<Note>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Note>({ ...note });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const a = availabilityOf(t);

  const changed = (Object.keys(draft) as (keyof Note)[])
    .filter(k => k !== "updatedAt" && k !== "updatedBy" && draft[k] !== note?.[k]);
  const set = <K extends keyof Note>(k: K, v: Note[K]) => { setDraft(d => ({ ...d, [k]: v })); setSaved(false); };

  const save = async () => {
    setSaving(true); setError("");
    try {
      const fields: Record<string, unknown> = {};
      changed.forEach(k => { fields[k] = draft[k]; });
      await onSave(fields as Partial<Note>);
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save"); }
    setSaving(false);
  };

  const field = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white";
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/30" onClick={onClose}>
      <div className={`bg-white h-full overflow-y-auto shadow-lift ${phone ? "w-full" : "w-full max-w-xl"}`} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{t.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`${pill} ${AVAIL_STYLE[a]}`}>{AVAILABILITY_LABEL[a]}</span>
              <a href={t.path} target="_blank" rel="noreferrer" className="text-sm text-sky-800 hover:underline inline-flex items-center gap-1">Open tool <ExternalLink size={13} /></a>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          <p className="text-slate-600 text-sm">{t.description}</p>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">What the code says</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Kind</dt><dd>{KINDS.find(k => k.key === t.kind)?.label}</dd>
              <dt className="text-slate-500">Strand</dt><dd>{t.category}{t.group ? ` · ${t.group}` : ""}</dd>
              <dt className="text-slate-500">Shell</dt><dd>{t.shell}</dd>
              {t.subTools != null && <><dt className="text-slate-500">Sub-tools</dt><dd>{t.subTools}</dd></>}
              <dt className="text-slate-500">Size</dt><dd>{t.lines.toLocaleString()} lines</dd>
              <dt className="text-slate-500">Route</dt><dd>{t.path}</dd>
            </dl>
            {t.kind === "tool" && <div className="flex flex-wrap gap-2 mt-3">
              {FEATURES.map(f => (
                <span key={f.key} title={f.hint} className={`${pill} ${t[f.key] ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400 line-through"}`}>{f.label}</span>
              ))}
            </div>}
            {t.representations.length > 0 && (
              <p className="text-sm text-slate-600 mt-3"><span className="text-slate-500">Pictures used in the code:</span> {t.representations.join(", ")}</p>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900">Notes</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-600" title="Where we think this tool is. Separate from whether it is on the site, which is read from the code.">Plan status
                <select value={draft.status ?? ""} onChange={e => set("status", (e.target.value || undefined) as Note["status"])} className={`${field} mt-1`}>
                  <option value="">Not set</option>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-600">Review
                <select value={draft.review ?? "not-started"} onChange={e => set("review", e.target.value as Note["review"])} className={`${field} mt-1`}>
                  {REVIEW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            {TEXT_FIELDS.map(k => (
              <label key={k} className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{TEXT_LABEL[k].label}</span>
                <span className="text-slate-400"> — {TEXT_LABEL[k].hint}</span>
                <textarea value={draft[k] ?? ""} onChange={e => set(k, e.target.value)} rows={k === "representation" ? 2 : 3} className={`${field} mt-1`} />
                {k === "representation" && (
                  <span className="flex items-center gap-2 mt-2 text-slate-700">
                    <input type="checkbox" checked={!!draft.representationAgreed} onChange={e => set("representationAgreed", e.target.checked)} />
                    Agreed
                  </span>
                )}
              </label>
            ))}
          </section>

          <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-5 px-5 py-3 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {error ? <span className="text-red-600">{error}</span>
                : saved ? <span className="text-emerald-700 inline-flex items-center gap-1"><Check size={14} />Saved{mode === "local" ? " on this device" : ""}</span>
                : note?.updatedAt ? `Last edited by ${note.updatedBy} on ${when(note.updatedAt)}` : "No notes yet"}
            </div>
            <button disabled={changed.length === 0 || saving} onClick={() => void save()}
              className="rounded-xl bg-blue-900 text-white font-semibold px-5 py-2 disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
