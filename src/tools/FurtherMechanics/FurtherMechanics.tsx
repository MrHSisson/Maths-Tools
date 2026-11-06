import { useEffect, useState } from "react";
import { Home, ChevronLeft, ChevronRight, Info, FileText, ExternalLink, Lock } from "lucide-react";
import { PAGE_BG } from "../../shared/colors";
import { useLayoutMode } from "../../shared/layoutMode";
import { useDevMode, setDevMode } from "../../devMode";
import { checkDevPassword } from "../../devAccess";
import { CHAPTERS, GENERAL_RESOURCES, CHECK_NOTES, type Chapter, type Resource, type Statement } from "./mechanicsSpec";

// Further Mechanics: the landing page for the AQA 7367 mechanics option (MA–ME). Five chapters; a chapter opens to its
// specification statements and the older papers it draws on. Developing-tools only: the registry entry is `enabled: false`
// and the page asks for the Developing tools password itself, so a direct address does not open it either.

type Year = "a2" | "as";
type View = { kind: "home" } | { kind: "chapter"; id: Chapter["id"] } | { kind: "papers" };

const card = "rounded-2xl border border-slate-300 bg-white shadow-card";
const tag = "rounded-md px-1.5 py-0.5 text-xs font-semibold";

const inYear = (s: Statement, y: Year) => y === "a2" || s.as;

function Gate() {
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: PAGE_BG }}>
      <form onSubmit={e => { e.preventDefault(); if (checkDevPassword(password)) setDevMode(true); else setWrong(true); }}
        className={`${card} flex w-full max-w-sm flex-col gap-3 p-6`}>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900"><Lock size={20} /> Further Mechanics</h1>
        <p className="text-sm text-slate-500">This is in development. Enter the Developing tools password to continue.</p>
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

function ResourceLink({ r }: { r: Resource }) {
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer"
      className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 hover:border-slate-400 hover:bg-slate-50">
      <FileText size={16} className="shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1 truncate">{r.label}</span>
      <span className="shrink-0 text-xs text-slate-400">{r.from}</span>
      <ExternalLink size={14} className="shrink-0 text-slate-300" />
    </a>
  );
}

function StatementRow({ s }: { s: Statement }) {
  const [open, setOpen] = useState(false);
  const note = [s.was ? `The first map said ${s.was}.` : "", s.note ?? ""].join(" ").trim();
  return (
    <li className="px-4 py-3.5 sm:px-5">
      <div className="flex gap-3">
        <span className="mt-0.5 h-fit shrink-0 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">{s.ref}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug text-slate-900">{s.text}</p>
          {s.formula && <p className="mt-1 font-mono text-sm text-slate-600">{s.formula}</p>}
          {s.asLimit && <p className="mt-1 text-sm text-slate-500">At AS: {s.asLimit}.</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`${tag} ${s.as ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-900"}`}>{s.as ? "AS + A2" : "A2 only"}</span>
            {s.legacy.map(m => <span key={m} className={`${tag} bg-slate-100 text-slate-600`}>Legacy {m}</span>)}
            {s.legacy.length === 0 && <span className={`${tag} bg-slate-50 text-slate-400`}>No legacy source</span>}
            {note && (
              <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={`About ${s.ref}'s legacy link`}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${open ? "bg-blue-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-blue-900"}`}>
                <Info size={16} />
              </button>
            )}
          </div>
          {open && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{note}</p>}
        </div>
      </div>
    </li>
  );
}

export default function FurtherMechanics() {
  const devMode = useDevMode();
  const { phone } = useLayoutMode();
  const [year, setYear] = useState<Year>("a2");
  const [view, setView] = useState<View>({ kind: "home" });
  const [aboutOpen, setAboutOpen] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  if (!devMode) return <Gate />;

  const back = () => setView({ kind: "home" });
  const chapter = view.kind === "chapter" ? CHAPTERS.find(c => c.id === view.id) : undefined;

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className={`mx-auto max-w-5xl ${phone ? "px-4 py-4" : "px-6 py-8"}`}>
        {view.kind === "home" ? (
          <button onClick={() => { window.location.href = "/"; }} className="mb-3 inline-flex items-center gap-2 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <Home size={18} /> Home
          </button>
        ) : (
          <button onClick={back} className="mb-3 inline-flex items-center gap-1 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <ChevronLeft size={18} /> Further Mechanics
          </button>
        )}

        {view.kind === "home" && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">Further Mechanics</h1>
                <p className="mt-1 text-slate-500">AQA A-level Further Mathematics</p>
              </div>
              <button type="button" onClick={() => setAboutOpen(o => !o)} aria-expanded={aboutOpen} aria-label="About this page"
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${aboutOpen ? "bg-blue-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-blue-900"}`}>
                <Info size={20} />
              </button>
            </div>
            {aboutOpen && (
              <p role="note" className="mt-3 rounded-xl bg-slate-900 p-3 text-sm leading-snug text-white">
                The mechanics option of AQA 7367 (sections MA to ME), planned chapter by chapter. Each chapter lists the specification statements, which are in AS and which are A2 only, and the older AQA papers they draw on. No question tools are built yet.
              </p>
            )}

            <div className="mt-6 flex gap-6 border-b border-slate-200" role="tablist" aria-label="Year">
              {([["a2", "A-level"], ["as", "AS"]] as [Year, string][]).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={year === k} onClick={() => setYear(k)}
                  className={`-mb-px border-b-2 pb-3 text-base font-semibold transition-colors ${year === k ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CHAPTERS.map(c => {
                const n = c.statements.filter(s => inYear(s, year)).length;
                const none = n === 0;
                return (
                  <button key={c.id} disabled={none} onClick={() => setView({ kind: "chapter", id: c.id })}
                    className={`${card} group flex min-h-[112px] flex-col justify-between p-4 text-left transition-all ${none ? "opacity-50" : "hover:-translate-y-0.5 hover:shadow-lift"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-slate-400">{c.id}</span>
                        <h2 className="text-lg font-semibold leading-tight text-slate-900">{c.name}</h2>
                      </div>
                      {!none && <ChevronRight size={20} className="mt-1 shrink-0 text-slate-300 group-hover:text-blue-900" />}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                      <span>{none ? "A2 only" : `${n} statement${n === 1 ? "" : "s"}`}</span>
                      <span className="text-xs text-slate-400">Not built yet</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button type="button" onClick={() => setView({ kind: "papers" })}
              className={`${card} mt-6 flex w-full items-center justify-between p-4 text-left hover:shadow-lift`}>
              <span>
                <span className="block font-semibold text-slate-900">Older papers and question banks</span>
                <span className="text-sm text-slate-500">AQA M1–M3 papers and the checked legacy map</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-slate-300" />
            </button>
          </>
        )}

        {chapter && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h1 className="text-3xl font-semibold text-slate-900">{chapter.name}</h1>
              <span className="font-mono text-sm font-semibold text-slate-400">{chapter.id}</span>
            </div>
            <div className="mt-4 flex gap-6 border-b border-slate-200" role="tablist" aria-label="Year">
              {([["a2", "A-level"], ["as", "AS"]] as [Year, string][]).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={year === k} onClick={() => setYear(k)}
                  className={`-mb-px border-b-2 pb-3 text-base font-semibold transition-colors ${year === k ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                  {label}
                </button>
              ))}
            </div>
            <ul className={`${card} mt-5 divide-y divide-slate-200`}>
              {chapter.statements.filter(s => inYear(s, year)).map(s => <StatementRow key={s.ref} s={s} />)}
            </ul>
            <details className={`${card} mt-4 px-4 py-3`}>
              <summary className="cursor-pointer font-semibold text-slate-800">Question banks ({chapter.resources.length})</summary>
              <div className="mt-3 grid gap-2 md:grid-cols-2">{chapter.resources.map(r => <ResourceLink key={r.url} r={r} />)}</div>
            </details>
          </>
        )}

        {view.kind === "papers" && (
          <>
            <h1 className="text-3xl font-semibold text-slate-900">Older papers</h1>
            <p className="mt-1 text-slate-500">The legacy AQA mechanics papers have a much deeper bank than the current spec.</p>
            <div className={`${card} mt-5 p-4`}>
              <div className="grid gap-2 md:grid-cols-2">{GENERAL_RESOURCES.map(r => <ResourceLink key={r.url} r={r} />)}</div>
            </div>
            <details className={`${card} mt-4 px-4 py-3`}>
              <summary className="cursor-pointer font-semibold text-slate-800">How the legacy map was checked ({CHECK_NOTES.date})</summary>
              <p className="mt-2 text-sm text-slate-500">{CHECK_NOTES.method}</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">{CHECK_NOTES.findings.map(f => <li key={f}>{f}</li>)}</ul>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
