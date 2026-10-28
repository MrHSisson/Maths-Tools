import { useState, type ReactNode } from "react";
import { ExternalLink, Check, ChevronDown, ChevronRight } from "lucide-react";
import { FEATURES, KINDS, AVAILABILITY_LABEL, availabilityOf, type ToolFacts } from "./facts";
import { REVIEW_OPTIONS, type Note } from "./notes";
import docs from "../generated/adminDocs.json";
import type { NotesMode } from "./notesApi";
import { AVAIL_DOT, Dot, Drawer, Status } from "./ui";

interface ToolInfo { purpose?: string; subTools?: { name: string; purpose: string; levels: string[] }[]; changes: { date: string; title: string }[] }
const INFO = (docs as unknown as { tools: Record<string, ToolInfo> }).tools;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

/** A section the reader can fold away; the choice is remembered on this device. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const key = `mt-profile-${id}`;
  const [open, setOpen] = useState<boolean>(() => { try { return localStorage.getItem(key) !== "0"; } catch { return true; } });
  const toggle = () => setOpen(o => { try { localStorage.setItem(key, o ? "0" : "1"); } catch { /* storage unavailable */ } return !o; });
  return (
    <section>
      <button onClick={toggle} aria-expanded={open} className="mb-2 flex w-full items-center gap-1 text-left font-semibold text-slate-900">
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}{title}
      </button>
      {open && children}
    </section>
  );
}

/** One tool: the facts read from the code, then the little that people write. */
export function ToolProfile({ t, note, mode, onClose, onSave }: {
  t: ToolFacts; note?: Note; mode: NotesMode; onClose: () => void; onSave: (f: Partial<Note>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Note>({ ...note });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const a = availabilityOf(t);
  const info = INFO[t.id];
  const lastChanged = info?.changes[0]?.date;

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

  return (
    <Drawer title={t.name} onClose={onClose}
      sub={<>
        <Status colour={AVAIL_DOT[a]} label={AVAILABILITY_LABEL[a]} />
        <a href={t.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-800 hover:underline">Open tool <ExternalLink size={13} /></a>
        {lastChanged && <span>Last changed {shortDate(lastChanged)}</span>}
      </>}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {error ? <span className="text-red-600">{error}</span>
              : saved ? <span className="inline-flex items-center gap-1 text-emerald-700"><Check size={14} />Saved{mode === "local" ? " on this device" : ""}</span>
              : note?.updatedAt ? `Last edited by ${note.updatedBy} on ${when(note.updatedAt)}` : "No notes yet"}
          </div>
          <button disabled={changed.length === 0 || saving} onClick={() => void save()}
            className="rounded-xl bg-blue-900 px-5 py-2 font-semibold text-white disabled:opacity-40">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      }>
      <div className="flex flex-col gap-6">
        <p className="text-sm text-slate-600">{t.description}</p>

        <Section id="about" title="About this tool">
          <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm">
            <dt className="text-slate-500">Kind</dt><dd>{KINDS.find(k => k.key === t.kind)?.label}</dd>
            <dt className="text-slate-500">Strand</dt><dd>{t.category}{t.group ? ` · ${t.group}` : ""}</dd>
            <dt className="text-slate-500">Shell</dt><dd>{t.shell}</dd>
            {t.subTools != null && <><dt className="text-slate-500">Sub-tools</dt><dd>{t.subTools}</dd></>}
            <dt className="text-slate-500">Size</dt><dd>{t.lines.toLocaleString()} lines</dd>
            <dt className="text-slate-500">Route</dt><dd>{t.path}</dd>
          </dl>
          {t.kind === "tool" && (
            <div className="mt-3 rounded-xl border border-slate-200 px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Has</div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {FEATURES.map(f => (
                  <li key={f.key} title={f.hint} className={`flex items-center gap-2 ${t[f.key] ? "text-slate-800" : "text-slate-400"}`}>
                    <Dot on={t[f.key]} label={f.label} />{f.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {t.representations.length > 0 && (
            <p className="mt-3 px-1 text-sm text-slate-600"><span className="text-slate-500">Pictures used:</span> {t.representations.join(", ")}</p>
          )}
        </Section>

        {(info?.purpose || info?.subTools?.length) && (
          <Section id="does" title="What it does">
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              {info.purpose && <p>{info.purpose}</p>}
              {info.subTools?.map(st => (
                <div key={st.name} className="mt-3">
                  <div className="font-semibold text-slate-900">{st.name}</div>
                  <p className="text-slate-600">{st.purpose}</p>
                  {st.levels.length > 0 && (
                    <ol className="mt-1 space-y-0.5 text-xs text-slate-500">
                      {st.levels.map((l, i) => <li key={i}><span className="font-semibold text-slate-600">Level {i + 1}</span> {l}</li>)}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {info && info.changes.length > 0 && (
          <Section id="changes" title="Recently changed">
            <ul className="space-y-1.5 text-sm">
              {info.changes.map((c, i) => (
                <li key={i} className="flex gap-3"><span className="w-14 shrink-0 text-xs text-slate-400">{shortDate(c.date)}</span><span className="text-slate-700">{c.title}</span></li>
              ))}
            </ul>
          </Section>
        )}

        <Section id="review" title="Review">
          <select aria-label="Review" value={draft.review ?? "not-started"} onChange={e => set("review", e.target.value as Note["review"])}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 sm:w-64">
            {REVIEW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Section>
      </div>
    </Drawer>
  );
}
