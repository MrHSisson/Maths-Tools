import { useEffect, useState } from "react";
import { Home, RefreshCw, AlertTriangle, LayoutGrid, ListChecks, Sparkles, BookOpen } from "lucide-react";
import { PAGE_BG } from "../shared/colors";
import { useLayoutMode } from "../shared/layoutMode";
import { useDevMode, setDevMode } from "../devMode";
import { checkDevPassword } from "../devAccess";
import { TOOLS } from "./facts";
import { emptyStore, type NoteStore } from "./notes";
import { BuildGuidePage, FeaturesPage } from "./DevelopmentsPage";
import { DevelopmentsTab } from "./PlanPages";
import { ToolsSection } from "./ToolsSection";
import { ToolProfile } from "./ToolProfile";
import { loadNotes, saveNote, type NotesMode } from "./notesApi";

type Section = "tools" | "developments" | "features" | "guide";
const NAV: { key: Section; label: string; short: string; Icon: typeof LayoutGrid }[] = [
  { key: "tools", label: "Tools", short: "Tools", Icon: LayoutGrid },
  { key: "developments", label: "Developments", short: "Plan", Icon: ListChecks },
  { key: "features", label: "Features", short: "Features", Icon: Sparkles },
  { key: "guide", label: "How a tool is built", short: "Guide", Icon: BookOpen },
];

export default function AdminPage() {
  const devMode = useDevMode();
  const { phone } = useLayoutMode();
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);

  const [store, setStore] = useState<NoteStore>(emptyStore());
  const [mode, setMode] = useState<NotesMode>("local");
  const [problem, setProblem] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("tools");
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const r = await loadNotes();
    setStore(r.store); setMode(r.mode); setProblem(r.problem); setLoading(false);
  };
  useEffect(() => { if (devMode) void refresh(); }, [devMode]);

  if (!devMode) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: PAGE_BG }}>
        <form
          onSubmit={e => { e.preventDefault(); if (checkDevPassword(password)) setDevMode(true); else setWrong(true); }}
          className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Enter the Developing tools password to continue.</p>
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

  const sel = TOOLS.find(t => t.id === selected) ?? null;
  const open = (id: string) => setSelected(id);
  const iconBtn = "flex items-center gap-2 rounded-xl p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100";

  const body = (
    <>
      {mode === "local" && !loading && (
        <div title={problem} className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm"><b>Notes are saved on this device only.</b> The shared notes service isn't connected, so other devices won't see them yet.</div>
        </div>
      )}
      {section === "tools" && <ToolsSection store={store} phone={phone} onOpen={open} />}
      {section === "developments" && <DevelopmentsTab onOpen={open} />}
      {section === "features" && <FeaturesPage />}
      {section === "guide" && <BuildGuidePage />}
    </>
  );

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      {phone ? (
        <>
          <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
            <button onClick={() => { window.location.href = "/"; }} aria-label="Home" className={iconBtn}><Home size={20} /></button>
            <div className="flex-1 text-lg font-semibold text-slate-900">Dashboard</div>
            <button onClick={() => void refresh()} aria-label="Refresh" className={iconBtn}><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
          </header>
          <main className="px-4 pb-24 pt-4">{body}</main>
          <nav aria-label="Dashboard section" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white">
            {NAV.map(n => (
              <button key={n.key} onClick={() => setSection(n.key)} aria-current={section === n.key ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs font-semibold ${section === n.key ? "text-blue-900" : "text-slate-500"}`}>
                <n.Icon size={20} />{n.short}
              </button>
            ))}
          </nav>
        </>
      ) : (
        <div className="flex">
          <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
            <div className="mb-6 px-2 text-lg font-semibold text-slate-900">Dashboard</div>
            <nav aria-label="Dashboard section" className="flex flex-1 flex-col gap-1">
              {NAV.map(n => (
                <button key={n.key} onClick={() => setSection(n.key)} aria-current={section === n.key ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold ${section === n.key ? "bg-slate-100 text-blue-900" : "text-slate-600 hover:bg-slate-50"}`}>
                  <n.Icon size={18} />{n.label}
                </button>
              ))}
            </nav>
            <button onClick={() => void refresh()} className={iconBtn}><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</button>
            <button onClick={() => { window.location.href = "/"; }} className={iconBtn}><Home size={16} />Home</button>
          </aside>
          <main className="min-w-0 flex-1 px-8 py-8"><div className="mx-auto max-w-6xl">{body}</div></main>
        </div>
      )}

      {sel && (
        <ToolProfile
          key={sel.id} t={sel} note={store.tools[sel.id]} mode={mode}
          onClose={() => setSelected(null)}
          onSave={async fields => { setStore(await saveNote(mode, store, sel.id, fields, "Harry")); }}
        />
      )}
    </div>
  );
}
