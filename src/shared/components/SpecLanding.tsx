import { useEffect, useState } from "react";
import { Home, ChevronLeft, ChevronRight, Info, FileText, ExternalLink, Lock } from "lucide-react";
import { PAGE_BG } from "../colors";
import { useLayoutMode } from "../layoutMode";
import { useDevMode, setDevMode } from "../../devMode";
import DevNotice from "./DevNotice";
import { checkDevPassword } from "../../devAccess";

// A landing page for one specification option (Further Mechanics, Decision): the chapters, each chapter's generators and
// statements, and the older papers. By default it is a planning page, Developing-tools only: it asks for the Developing tools
// password itself, so a direct address does not open it either, and it shows the legacy module
// it came from and the older question banks. With `public` it is also the way in for teachers: open to everyone, it lists each
// chapter's live generators first, then the statements as the spec words them, and keeps the planning material (legacy links,
// notes, question banks, older papers, tools still in development) to Developing-tools mode. The subject supplies the data and
// the words; this file owns the look.

export interface SpecStatement {
  ref: string;
  text: string;
  /** a printed formula, as in the spec */
  formula?: string;
  /** in the AS spec? false = A2 only */
  as: boolean;
  /** what A2 adds to a statement that is in both courses (the AS course stops short of it) */
  a2Adds?: string;
  /** the legacy modules this content came from ("M2", "D1") */
  legacy: string[];
  /** supported: the legacy papers show this content. revised: the first map said otherwise. unverified: nothing found either way. */
  status: "supported" | "revised" | "unverified";
  /** the first mapping, when the check changed it */
  was?: string;
  note?: string;
  /** the generators (sub-tools) that address this statement */
  links?: SpecLink[];
}

/** a generator (or one sub-tool of one) that addresses a statement or a chapter; `href` opens it, `as` is whether it is part of the AS course */
export interface SpecLink {
  label: string; href: string; live: boolean; as: boolean;
  /** planned but not built: shown greyed out to everyone, and not a link */
  provisional?: boolean;
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
  /** generators that belong to the chapter but to no one statement (exam-style questions; the older papers only) */
  groups?: { heading: string; links: SpecLink[]; /** shown in Developing-tools mode only */ devOnly?: boolean }[];
  /** the chapter's exam-style practice: one prominent card, with the one generator it opens */
  exam?: { text: string; link: SpecLink };
  /** a "still in development" notice under the chapter heading: the chapter is open to everyone but not in its final form */
  notice?: string;
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
  /** open to everyone as the hub for these tools (the planning material stays in Developing-tools mode) */
  public?: boolean;
  /** tools that belong to the subject but to no chapter (a free workspace), listed under the chapters */
  workspace?: { heading: string; tools: SpecTool[] };
}

type View = { kind: "home" } | { kind: "chapter"; id: string } | { kind: "papers" };

/** the links out to older papers and question banks (the "Older papers" card and page, each chapter's "Question banks"): hidden for now while the
 *  hubs are redesigned; the data stays in each subject's spec file, so set this to true to bring them back */
const SHOW_OLDER_PAPERS = false;

const card = "rounded-2xl border border-slate-300 bg-white shadow-card";
/** the label on A2 content: the part of the course beyond AS (AS content needs no label, since A-level covers it too) */
const a2Tag = "inline-block rounded-md bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-800";
const tag = "rounded-md px-1.5 py-0.5 text-xs font-semibold";

/** the tools a visitor sees: everything in Developing-tools mode, only the live ones otherwise */
const shownTools = (tools: SpecTool[], planning: boolean): SpecTool[] => (planning ? tools : tools.filter(t => t.live));

function toolState(c: SpecChapter, planning: boolean): string {
  if (c.tools.length === 0) return "Not built yet";
  if (!planning) {
    const n = c.tools.filter(t => t.live).length;
    return n === 0 ? "Coming soon" : n === 1 ? "1 generator" : `${n} generators`;
  }
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

function ToolLink({ t, planning }: { t: SpecTool; planning: boolean }) {
  return (
    <a href={t.path} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 hover:border-slate-400 hover:bg-slate-50">
      <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
      {planning && <span className={`${tag} ${t.live ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{t.live ? "Live" : "Dev"}</span>}
      <ChevronRight size={16} className="shrink-0 text-slate-300" />
    </a>
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

/** a statement of the specification as the spec words it. What A2 adds to a statement that is in both courses sits on its own line, with the tag at the end;
 *  a statement that is A2 throughout carries the tag after its wording. */
function StatementText({ s }: { s: SpecStatement }) {
  return (
    <div className="min-w-0 text-[15px] leading-snug text-slate-900">
      <p>{s.text}{!s.as && <span className={`${a2Tag} ml-2 align-middle`}>A2</span>}</p>
      {s.a2Adds && <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-slate-500"><span>{s.a2Adds}</span><span className={a2Tag}>A2</span></p>}
    </div>
  );
}

function StatementRows({ items }: { items: SpecStatement[] }) {
  return (
    <ul className="divide-y divide-slate-200">
      {items.map(x => (
        <li key={x.ref} className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-3 py-2.5">
          <span className="h-fit w-fit rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">{x.ref}</span>
          <StatementText s={x} />
        </li>
      ))}
    </ul>
  );
}

/** one skill (a sub-tool) as a plain row that opens it; A2 practice carries its tag at the end */
function SkillRow({ l, planning }: { l: SpecLink; planning: boolean }) {
  return (
    <li>
      <a href={l.href} className="flex min-h-[44px] items-center gap-2 px-4 py-2.5 text-[15px] text-slate-900 hover:bg-blue-50/70 sm:px-5">
        <span className="min-w-0 flex-1">{l.label}</span>
        {!l.as && <span className={a2Tag}>A2</span>}
        {planning && !l.live && <span className={`${tag} bg-amber-50 text-amber-800`}>Dev</span>}
        <ChevronRight size={16} className="shrink-0 text-slate-300" />
      </a>
    </li>
  );
}

interface ToolCardData { name: string; path: string; live: boolean; skills: SpecLink[]; statements: SpecStatement[] }

/** the chapter's practice grouped by tool, with the statements each tool covers. Statements no built skill covers come back as `uncovered`
 *  (with the planned, unbuilt skills for them); skills that match no tool of the chapter go under "More practice". */
function practiceByTool(c: SpecChapter, planning: boolean): { cards: ToolCardData[]; uncovered: SpecStatement[] } {
  const visible = (l: SpecLink) => !l.provisional && (planning || l.live);
  const owns = (t: SpecTool, l: SpecLink) => l.href === t.path || l.href.startsWith(`${t.path}?`);
  const groupLinks = (c.groups ?? []).filter(g => planning || !g.devOnly).flatMap(g => g.links);
  const seen = new Set<string>();
  const skills = [...c.statements.flatMap(x => x.links ?? []), ...groupLinks].filter(visible).filter(l => (seen.has(l.href) ? false : (seen.add(l.href), true)));
  // AS practice first, then what goes beyond AS; the order within each follows the specification
  const ordered = [...skills.filter(l => l.as), ...skills.filter(l => !l.as)];
  const cards: ToolCardData[] = shownTools(c.tools, planning).map(t => ({
    ...t,
    skills: ordered.filter(l => owns(t, l)),
    statements: c.statements.filter(x => (x.links ?? []).some(l => visible(l) && owns(t, l))),
  }));
  const rest = ordered.filter(l => !c.tools.some(t => owns(t, l)));
  if (rest.length) cards.push({ name: "More practice", path: "", live: true, skills: rest, statements: [] });
  const uncovered = c.statements.filter(x => !(x.links ?? []).some(visible));
  return { cards, uncovered };
}

export function SpecLanding(p: SpecLandingProps): JSX.Element {
  const devMode = useDevMode();
  const { phone } = useLayoutMode();
  // a chapter has an address of its own (#DB), so a link can open straight to it
  const [view, setViewState] = useState<View>(() => {
    const id = typeof window === "undefined" ? "" : window.location.hash.slice(1);
    return id && p.chapters.some(c => c.id === id) ? { kind: "chapter", id } : { kind: "home" };
  });
  const setView = (v: View) => {
    setViewState(v);
    const url = window.location.pathname + window.location.search + (v.kind === "chapter" ? `#${v.id}` : "");
    window.history.replaceState(window.history.state, "", url);
  };
  const [aboutOpen, setAboutOpen] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  // a link to another chapter pasted into the address bar of this page opens it without a reload
  useEffect(() => {
    const h = () => {
      const id = window.location.hash.slice(1);
      setViewState(id && p.chapters.some(c => c.id === id) ? { kind: "chapter", id } : { kind: "home" });
    };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, [p.chapters]);
  if (!devMode && !p.public) return <Gate title={p.title} />;
  const planning = devMode;

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

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {p.chapters.map(c => {
                const open = shownTools(c.tools, planning);
                return (
                  <button key={c.id} onClick={() => setView({ kind: "chapter", id: c.id })}
                    className={`${card} group flex min-h-[128px] min-w-0 flex-col justify-between gap-3 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift ${open.length === 0 ? "bg-slate-50/60" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-400">{c.id}</span>
                        <h2 className="text-lg font-semibold leading-tight text-slate-900">{c.name}</h2>
                      </div>
                      <ChevronRight size={20} className="mt-1 shrink-0 text-slate-300 group-hover:text-blue-900" />
                    </div>
                    <p className={`line-clamp-2 text-sm ${open.length ? "text-slate-600" : "text-slate-400"}`}>
                      {open.length ? open.map(t => t.name).join(" · ") : planning ? toolState(c, planning) : "Coming soon"}
                    </p>
                  </button>
                );
              })}
            </div>

            {p.workspace && shownTools(p.workspace.tools, planning).length > 0 && (
              <div className={`${card} mt-6 px-4 py-3`}>
                <h2 className="font-semibold text-slate-800">{p.workspace.heading}</h2>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {shownTools(p.workspace.tools, planning).map(t => <ToolLink key={t.path} t={t} planning={planning} />)}
                </div>
              </div>
            )}

            {planning && SHOW_OLDER_PAPERS && <button type="button" onClick={() => setView({ kind: "papers" })}
              className={`${card} mt-6 flex w-full items-center justify-between p-4 text-left hover:shadow-lift`}>
              <span>
                <span className="block font-semibold text-slate-900">{p.papers.heading}</span>
                <span className="text-sm text-slate-500">{p.papers.cardText}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-slate-300" />
            </button>}
          </>
        )}

        {chapter && (() => {
          const { cards, uncovered } = practiceByTool(chapter, planning);
          const planned = (x: SpecStatement) => (x.links ?? []).filter(l => l.provisional);
          const showsA2 = chapter.statements.some(x => !x.as || x.a2Adds) || cards.some(t => t.skills.some(l => !l.as));
          return (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h1 className="text-3xl font-semibold text-slate-900">{chapter.name}</h1>
                <span className="font-mono text-sm font-semibold text-slate-400">{chapter.id}</span>
              </div>
              {chapter.notice && <div className="mt-3 overflow-hidden rounded-xl border border-amber-200"><DevNotice id={`/hub/${chapter.id}`} text={chapter.notice} /></div>}

              <div className="mt-5 flex flex-col gap-3">
                {cards.map(t => (
                  <section key={t.name} className={`${card} overflow-hidden`}>
                    <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pb-3 pt-4 sm:px-5">
                      <h2 className="text-lg font-semibold text-slate-900">{t.name}</h2>
                      <span className="text-sm text-slate-500">{t.skills.length} skill{t.skills.length === 1 ? "" : "s"}</span>
                      {planning && !t.live && <span className={`${tag} bg-amber-50 text-amber-800`}>Dev</span>}
                      {t.path && (
                        <a href={t.path} className={`ml-auto inline-flex items-center gap-1 font-semibold text-blue-900 hover:underline ${phone ? "min-h-[44px]" : ""}`}>
                          Open the tool <ChevronRight size={16} />
                        </a>
                      )}
                    </header>
                    {t.skills.length > 0 && (
                      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] border-t border-slate-200">
                        {t.skills.map(l => <SkillRow key={l.href} l={l} planning={planning} />)}
                      </ul>
                    )}
                    {t.statements.length > 0 && (
                      <div className="border-t border-slate-200 bg-slate-50/70 px-4 pb-2 pt-3 sm:px-5">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Covers in the specification</h3>
                        <StatementRows items={t.statements} />
                      </div>
                    )}
                  </section>
                ))}

                {uncovered.length > 0 && (
                  <section className={`${card} overflow-hidden`}>
                    <header className="px-4 pb-1 pt-4 sm:px-5">
                      <h2 className="text-lg font-semibold text-slate-900">{cards.length ? "Not built yet" : "What the specification asks"}</h2>
                      <p className="mt-0.5 text-sm text-slate-500">{cards.length ? "Parts of this chapter with no generator yet." : "No generators for this part of the specification yet."}</p>
                    </header>
                    <div className="px-4 pb-2 sm:px-5">
                      <ul className="divide-y divide-slate-200">
                        {uncovered.map(x => (
                          <li key={x.ref} className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-3 py-2.5">
                            <span className="h-fit w-fit rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">{x.ref}</span>
                            <div className="min-w-0">
                              <StatementText s={x} />
                              {planned(x).length > 0 && <p className="mt-1 text-sm text-slate-400">Planned: {planned(x).map(l => l.label).join(", ")}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {chapter.exam && (planning || chapter.exam.link.live) && (
                  <a href={chapter.exam.link.href} className={`${card} group flex items-center justify-between gap-4 p-4 hover:shadow-lift sm:px-5`}>
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-900">Exam-style questions</span>
                      <span className="mt-0.5 block text-sm text-slate-500">{chapter.exam.text}</span>
                    </span>
                    <ChevronRight size={20} className="shrink-0 text-slate-300 group-hover:text-blue-900" />
                  </a>
                )}
              </div>
              {showsA2 && <p className="mt-3 px-1 text-sm text-slate-500"><span className={a2Tag}>A2</span> marks anything beyond the AS course.</p>}

            {planning && chapter.statements.some(x => x.legacy.length > 0 || x.note) && (
              <details className={`${card} mt-4 px-4 py-3`}>
                <summary className="cursor-pointer font-semibold text-slate-800">The older specification <span className={`${tag} ml-1 bg-amber-50 text-amber-800`}>Developing</span></summary>
                <p className="mt-2 text-sm text-slate-500">Which legacy module each statement's content came from. To be built out as its own part of the hub.</p>
                <ul className="mt-2 divide-y divide-slate-100">
                  {chapter.statements.map(x => (
                    <li key={x.ref} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
                      <span className="font-mono text-xs font-semibold text-slate-700">{x.ref}</span>
                      {x.legacy.map(m => <span key={m} className={`${tag} bg-slate-100 text-slate-600`}>Legacy {m}</span>)}
                      {x.legacy.length === 0 && <span className={`${tag} bg-slate-50 text-slate-400`}>No legacy source</span>}
                      {x.note && <span className="text-slate-500">{x.note}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {planning && SHOW_OLDER_PAPERS && chapter.resources.length > 0 && (
              <details className={`${card} mt-4 px-4 py-3`}>
                <summary className="cursor-pointer font-semibold text-slate-800">Question banks ({chapter.resources.length})</summary>
                <div className="mt-3 grid gap-2 md:grid-cols-2">{chapter.resources.map(r => <ResourceLink key={r.url} r={r} />)}</div>
              </details>
            )}
            </>
          );
        })()}

        {view.kind === "papers" && planning && SHOW_OLDER_PAPERS && (
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
