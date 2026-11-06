import { useState } from "react";
import { Home, Check, ArrowRightLeft, HelpCircle, FileText, ExternalLink, Lock } from "lucide-react";
import { PAGE_BG } from "../../shared/colors";
import { useLayoutMode } from "../../shared/layoutMode";
import { useDevMode, setDevMode } from "../../devMode";
import { checkDevPassword } from "../../devAccess";
import {
  CHAPTERS, GENERAL_RESOURCES, CHECK_NOTES,
  type Chapter, type Statement, type Resource, type LegacyModule, type MapStatus,
} from "./mechanicsSpec";

// Further Mechanics: its own space for the AQA 7367 mechanics specification (MA–ME), planned chapter by chapter
// before any question tools are built. Developing-tools only: the registry entry is `enabled: false`, and the page
// asks for the Developing tools password itself, so a direct address does not open it either.

type Year = "all" | "as" | "a2";

const MODULE_STYLE: Record<LegacyModule, string> = {
  M1: "bg-emerald-50 text-emerald-800 border-emerald-200",
  M2: "bg-blue-50 text-blue-800 border-blue-200",
  M3: "bg-indigo-50 text-indigo-800 border-indigo-200",
  M4: "bg-amber-50 text-amber-800 border-amber-200",
};

const STATUS: Record<MapStatus, { label: string; Icon: typeof Check; cls: string }> = {
  supported: { label: "Seen in the legacy papers", Icon: Check, cls: "text-emerald-700" },
  revised: { label: "Changed from the first map", Icon: ArrowRightLeft, cls: "text-amber-700" },
  unverified: { label: "Nothing found either way", Icon: HelpCircle, cls: "text-slate-500" },
};

const FROM_STYLE: Record<Resource["from"], string> = {
  "AQA legacy": "bg-blue-50 text-blue-800",
  "AQA Further": "bg-emerald-50 text-emerald-800",
  "Edexcel legacy": "bg-slate-100 text-slate-700",
  Other: "bg-slate-100 text-slate-700",
};

const inYear = (s: Statement, y: Year) => y === "all" || (y === "as" ? s.as : true);

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"}`}>
      {children}
    </button>
  );
}

function ResourceLink({ r }: { r: Resource }) {
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer"
      className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:border-slate-400">
      <FileText size={16} className="shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1 truncate">{r.label}</span>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${FROM_STYLE[r.from]}`}>{r.from}</span>
      <ExternalLink size={14} className="shrink-0 text-slate-400" />
    </a>
  );
}

function StatementRow({ s, year }: { s: Statement; year: Year }) {
  const st = STATUS[s.status];
  const asView = year === "as";
  return (
    <li className="border-t border-slate-200 px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-300">{s.ref}</span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${s.as ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-violet-200 bg-violet-50 text-violet-800"}`}>
          {s.as ? "AS + A2" : "A2 only"}
        </span>
        {s.legacy.map(m => (
          <span key={m} className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${MODULE_STYLE[m]}`}>Legacy {m}</span>
        ))}
        {s.legacy.length === 0 && <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">No legacy source found</span>}
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${st.cls}`} title={st.label}>
          <st.Icon size={14} aria-hidden /> {st.label}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-slate-800">{s.text}</p>
      {s.formula && <p className="mt-1 font-mono text-sm text-slate-700">{s.formula}</p>}
      {s.asLimit && (
        <p className={`mt-1.5 rounded-lg px-2.5 py-1 text-xs ${asView ? "bg-amber-50 text-amber-900" : "bg-slate-50 text-slate-600"}`}>
          <b>At AS:</b> {s.asLimit}. {!asView && "A2 adds the harder version."}
        </p>
      )}
      {(s.note || s.was) && (
        <p className="mt-1.5 text-xs text-slate-500">
          {s.was && <>First map said <b>{s.was}</b>. </>}{s.note}
        </p>
      )}
    </li>
  );
}

function ChapterCard({ c, year }: { c: Chapter; year: Year }) {
  const rows = c.statements.filter(s => inYear(s, year));
  if (rows.length === 0) return null;
  return (
    <section id={c.id} className="rounded-2xl border border-slate-300 bg-white shadow-card">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-3 pt-4">
        <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-sm font-semibold text-emerald-300">{c.id}</span>
        <h2 className="text-xl font-semibold text-slate-900">{c.name}</h2>
        <span className="text-sm text-slate-500">{rows.length} of {c.statements.length} statements · {c.statements.every(s => !s.as) ? "A2 only" : c.statements.every(s => s.as) ? "AS + A2" : "AS + A2, with later items A2 only"}</span>
        <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Tool: not built yet</span>
      </header>
      <ul className="border-t border-slate-200">{rows.map(s => <StatementRow key={s.ref} s={s} year={year} />)}</ul>
      <details className="border-t border-slate-200 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Question banks for this chapter ({c.resources.length})</summary>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">{c.resources.map(r => <ResourceLink key={r.url} r={r} />)}</div>
      </details>
    </section>
  );
}

function Gate() {
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: PAGE_BG }}>
      <form onSubmit={e => { e.preventDefault(); if (checkDevPassword(password)) setDevMode(true); else setWrong(true); }}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-slate-300 bg-white p-6 shadow-card">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900"><Lock size={20} /> Further Mechanics</h1>
        <p className="text-sm text-slate-500">This space is in development. Enter the Developing tools password to continue.</p>
        <input type="password" autoFocus value={password} onChange={e => { setPassword(e.target.value); setWrong(false); }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900" aria-label="Password" />
        {wrong && <p className="text-sm text-red-600">That password is not right.</p>}
        <div className="flex justify-between">
          <button type="button" onClick={() => { window.location.href = "/"; }} className="rounded-lg px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100">Home</button>
          <button type="submit" className="rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white">Unlock</button>
        </div>
      </form>
    </div>
  );
}

export default function FurtherMechanics() {
  const devMode = useDevMode();
  const { phone } = useLayoutMode();
  const [year, setYear] = useState<Year>("all");
  const [chapter, setChapter] = useState<Chapter["id"] | "all">("all");
  if (!devMode) return <Gate />;

  const all = CHAPTERS.flatMap(c => c.statements);
  const asCount = all.filter(s => s.as).length;
  const shown = CHAPTERS.filter(c => chapter === "all" || c.id === chapter);

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className={`mx-auto max-w-5xl ${phone ? "px-4 py-4" : "px-6 py-8"}`}>
        <button onClick={() => { window.location.href = "/"; }} className="mb-4 inline-flex items-center gap-2 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <Home size={18} /> Home
        </button>
        <h1 className="text-3xl font-semibold text-slate-900">Further Mechanics</h1>
        <p className="mt-1 text-sm text-slate-500">
          AQA A-level Further Mathematics 7367, optional application 1 (MA–ME), with the AS 7366 split and a link back to the older AQA mechanics papers. In development.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[["Statements", all.length], ["In AS (Year 1)", asCount], ["A2 only (Year 2)", all.length - asCount]].map(([label, n]) => (
            <div key={label} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-card">
              <div className="text-2xl font-semibold text-slate-900">{n}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Year">
            <Pill on={year === "all"} onClick={() => setYear("all")}>A-level (all)</Pill>
            <Pill on={year === "as"} onClick={() => setYear("as")}>AS content only</Pill>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Chapter">
            <Pill on={chapter === "all"} onClick={() => setChapter("all")}>All chapters</Pill>
            {CHAPTERS.map(c => <Pill key={c.id} on={chapter === c.id} onClick={() => setChapter(c.id)}>{c.id} {c.name}</Pill>)}
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {shown.map(c => <ChapterCard key={c.id} c={c} year={year} />)}
        </div>

        {chapter === "all" && (
          <>
            <section className="mt-8 rounded-2xl border border-slate-300 bg-white p-4 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Checking the first legacy map</h2>
              <p className="mt-1 text-xs text-slate-500">{CHECK_NOTES.date}. {CHECK_NOTES.method}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                {CHECK_NOTES.findings.map(f => <li key={f}>{f}</li>)}
              </ul>
            </section>
            <section className="mt-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">Whole-course resources</h2>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">{GENERAL_RESOURCES.map(r => <ResourceLink key={r.url} r={r} />)}</div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
