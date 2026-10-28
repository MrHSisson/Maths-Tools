import { useState, type ReactNode } from "react";
import { ExternalLink, Check } from "lucide-react";
import { FEATURES, KINDS, AVAILABILITY_LABEL, availabilityOf, type ToolFacts } from "./facts";
import { STATUS_OPTIONS, REVIEW_OPTIONS, type Note } from "./notes";
import type { NotesMode } from "./notesApi";
import { AVAIL_DOT, Dot, Drawer, Status } from "./ui";

const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

/** A note field: reads as plain text, tap to edit in a fixed-size box (no drag handle, nothing that grows). */
function NoteField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void; children?: ReactNode }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="text-sm">
      <div className="font-semibold text-slate-800">{label}</div>
      {editing ? (
        <>
          <textarea autoFocus value={value} onChange={e => onChange(e.target.value)} rows={5} placeholder={hint}
            className="mt-1 w-full resize-none rounded-xl border border-sky-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none" />
          <button onClick={() => setEditing(false)} className="mt-1 text-sm font-semibold text-sky-800 hover:underline">Done</button>
        </>
      ) : (
        <button onClick={() => setEditing(true)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-left hover:bg-slate-50">
          {value.trim()
            ? <span className="whitespace-pre-wrap text-slate-800">{value}</span>
            : <span className="text-slate-400">{hint}</span>}
        </button>
      )}
    </div>
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

  const field = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  return (
    <Drawer title={t.name} onClose={onClose}
      sub={<>
        <Status colour={AVAIL_DOT[a]} label={AVAILABILITY_LABEL[a]} />
        <a href={t.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-800 hover:underline">Open tool <ExternalLink size={13} /></a>
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

        <section>
          <h3 className="mb-2 font-semibold text-slate-900">About this tool</h3>
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
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-semibold text-slate-900">Notes</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-600" title="Where we think this tool is. Separate from whether it is on the site.">Plan status
              <select value={draft.status ?? ""} onChange={e => set("status", (e.target.value || undefined) as Note["status"])} className={field}>
                <option value="">Not set</option>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-600">Review
              <select value={draft.review ?? "not-started"} onChange={e => set("review", e.target.value as Note["review"])} className={field}>
                {REVIEW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
          <NoteField label="Differs from / adds to the standard" hint="How it departs from the usual tool, or what it adds"
            value={draft.differsFrom ?? ""} onChange={v => set("differsFrom", v)} />
        </section>
      </div>
    </Drawer>
  );
}
