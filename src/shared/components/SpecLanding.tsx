import { useEffect, useState } from "react";
import { Home, ChevronLeft, ChevronRight, Info, FileText, ExternalLink, Lock } from "lucide-react";
import { PAGE_BG } from "../colors";
import { useLayoutMode } from "../layoutMode";
import { useDevMode, setDevMode } from "../../devMode";
import { checkDevPassword } from "../../devAccess";

// A planning landing page for one specification option (Further Mechanics, Decision): the chapters, each chapter's
// statements with their AS or A2 status and the legacy module they came from, the tools that exist for it, and the older
// papers. Developing-tools only: the page asks for the Developing tools password itself, so a direct address does not
// open it either. The subject supplies the data and the words; this file owns the look.

export interface SpecStatement {
  ref: string;
  text: string;
  /** a printed formula, as in the spec */
  formula?: string;
  /** in the AS spec? false = A2 only */
  as: boolean;
  /** what AS leaves out of a statement that is in both */
  asLimit?: string;
  /** the legacy modules this content came from ("M2", "D1") */
  legacy: string[];
  /** supported: the legacy papers show this content. revised: the first map said otherwise. unverified: nothing found either way. */
  status: "supported" | "revised" | "unverified";
  /** the first mapping, when the check changed it */
  was?: string;
  note?: string;
}

export interface SpecResource {
  label: string;
  url: string;
  /** where it comes from, so a teacher knows which board's wording to expect */
  from: string;
}

interface SpecTool { name: string; path: string; live: boolean }

export interface SpecChapter {
  id: string;
  name: string;
  statements: SpecStatement[];
  resources: SpecResource[];
  /** the tools built (or being built) for this chapter */
  tools: SpecTool[];
}

interface SpecLandingProps {
  title: string;
  subtitle: string;
  /** the (i) on the landing page */
  about: string;
  chapters: SpecChapter[];
  generalResources: SpecResource[];
  papers: { heading: string; intro: string; cardText: string };
  check: { date: string; method: string; findings: string[] };
  /** legacy content the current spec no longer asks for, so a teacher knows what to skip in the old papers */
  outOfSpec?: { heading: string; items: { name: string; legacy: string; note?: string }[] };
}

type Year = "a2" | "as";
type View = { kind: "home" } | { kind: "chapter"; id: string } | { kind: "papers" };

const card = "rounded-2xl border border-slate-300 bg-white shadow-card";
const tag = "rounded-md px-1.5 py-0.5 text-xs font-semibold";
const inYear = (s: SpecStatement, y: Year) => y === "a2" || s.as;

function toolState(c: SpecChapter): string {
  if (c.tools.length === 0) return "Not built yet";
  if (c.tools.every(t => t.live)) return "Live";
  return c.tools.some(t => t.live) ? "Partly live" : "In development";
}

function Gate({ title }: { title: string }) {
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: PAGE_BG }}>
      <form onSubmit={e => { e.preventDefault(); if (checkDevPassword(password)) setDevMode(true); else setWrong(true); }}
        className={`${card} flex w-full max-w-sm flex-col gap-3 p-6`}>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900"><Lock size={20} /> {title}</h1>
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

function ResourceLink({ r }: { r: SpecResource }) {
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

function StatementRow({ s }: { s: SpecStatement }) {
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

function YearTabs({ year, setYear }: { year: Year; setYear: (y: Year) => void }) {
  return (
    <div className="flex gap-6 border-b border-slate-200" role="tablist" aria-label="Year">
      {([["as", "AS"], ["a2", "A-level"]] as [Year, string][]).map(([k, label]) => (
        <button key={k} role="tab" aria-selected={year === k} onClick={() => setYear(k)}
          className={`-mb-px border-b-2 pb-3 text-base font-semibold transition-colors ${year === k ? "border-blue-900 text-blue-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function SpecLanding(p: SpecLandingProps): JSX.Element {
  const devMode = useDevMode();
  const { phone } = useLayoutMode();
  const [year, setYear] = useState<Year>("as");
  const [view, setView] = useState<View>({ kind: "home" });
  const [aboutOpen, setAboutOpen] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  if (!devMode) return <Gate title={p.title} />;

  const back = () => setView({ kind: "home" });
  const chapter = view.kind === "chapter" ? p.chapters.find(c => c.id === view.id) : undefined;

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div className={`mx-auto max-w-5xl ${phone ? "px-4 py-4" : "px-6 py-8"}`}>
        {view.kind === "home" ? (
          <button onClick={() => { window.location.href = "/"; }} className="mb-3 inline-flex items-center gap-2 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <Home size={18} /> Home
          </button>
        ) : (
          <button onClick={back} className="mb-3 inline-flex items-center gap-1 rounded-xl py-1 pr-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <ChevronLeft size={18} /> {p.title}
          </button>
        )}

        {view.kind === "home" && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">{p.title}</h1>
                <p className="mt-1 text-slate-500">{p.subtitle}</p>
              </div>
              <button type="button" onClick={() => setAboutOpen(o => !o)} aria-expanded={aboutOpen} aria-label="About this page"
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${aboutOpen ? "bg-blue-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-blue-900"}`}>
                <Info size={20} />
              </button>
            </div>
            {aboutOpen && <p role="note" className="mt-3 rounded-xl bg-slate-900 p-3 text-sm leading-snug text-white">{p.about}</p>}

            <div className="mt-6"><YearTabs year={year} setYear={setYear} /></div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {p.chapters.map(c => {
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
                      <span className={`text-xs ${c.tools.some(t => t.live) ? "font-semibold text-emerald-700" : "text-slate-400"}`}>{toolState(c)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button type="button" onClick={() => setView({ kind: "papers" })}
              className={`${card} mt-6 flex w-full items-center justify-between p-4 text-left hover:shadow-lift`}>
              <span>
                <span className="block font-semibold text-slate-900">{p.papers.heading}</span>
                <span className="text-sm text-slate-500">{p.papers.cardText}</span>
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
            <div className="mt-4"><YearTabs year={year} setYear={setYear} /></div>
            <ul className={`${card} mt-5 divide-y divide-slate-200`}>
              {chapter.statements.filter(s => inYear(s, year)).map(s => <StatementRow key={s.ref} s={s} />)}
            </ul>
            {chapter.tools.length > 0 && (
              <div className={`${card} mt-4 px-4 py-3`}>
                <h2 className="font-semibold text-slate-800">Tools</h2>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {chapter.tools.map(t => (
                    <a key={t.path} href={t.path} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 hover:border-slate-400 hover:bg-slate-50">
                      <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
                      <span className={`${tag} ${t.live ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{t.live ? "Live" : "Dev"}</span>
                      <ChevronRight size={16} className="shrink-0 text-slate-300" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {chapter.resources.length > 0 && (
              <details className={`${card} mt-4 px-4 py-3`}>
                <summary className="cursor-pointer font-semibold text-slate-800">Question banks ({chapter.resources.length})</summary>
                <div className="mt-3 grid gap-2 md:grid-cols-2">{chapter.resources.map(r => <ResourceLink key={r.url} r={r} />)}</div>
              </details>
            )}
          </>
        )}

        {view.kind === "papers" && (
          <>
            <h1 className="text-3xl font-semibold text-slate-900">{p.papers.heading}</h1>
            <p className="mt-1 text-slate-500">{p.papers.intro}</p>
            <div className={`${card} mt-5 p-4`}>
              <div className="grid gap-2 md:grid-cols-2">{p.generalResources.map(r => <ResourceLink key={r.url} r={r} />)}</div>
            </div>
            {p.outOfSpec && (
              <details className={`${card} mt-4 px-4 py-3`}>
                <summary className="cursor-pointer font-semibold text-slate-800">{p.outOfSpec.heading}</summary>
                <ul className="mt-2 divide-y divide-slate-100">
                  {p.outOfSpec.items.map(i => (
                    <li key={i.name} className="flex flex-wrap items-baseline gap-x-3 py-2 text-sm">
                      <span className="font-semibold text-slate-800">{i.name}</span>
                      <span className={`${tag} bg-slate-100 text-slate-600`}>Legacy {i.legacy}</span>
                      {i.note && <span className="text-slate-500">{i.note}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <details className={`${card} mt-4 px-4 py-3`}>
              <summary className="cursor-pointer font-semibold text-slate-800">How the legacy map was checked ({p.check.date})</summary>
              <p className="mt-2 text-sm text-slate-500">{p.check.method}</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">{p.check.findings.map(f => <li key={f}>{f}</li>)}</ul>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
