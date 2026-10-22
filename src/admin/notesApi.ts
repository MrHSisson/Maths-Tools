import { DEV_PASSWORD } from "../devAccess";
import { emptyStore, applyNoteUpdate, type Note, type NoteStore } from "./notes";

/** "live" = the shared notes service; "local" = this device only (service not connected). */
export type NotesMode = "live" | "local";

const LOCAL_KEY = "mt-admin-notes-local";
const headers = { "x-admin-key": DEV_PASSWORD, "content-type": "application/json" };

const readLocal = (): NoteStore => {
  try { const s = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? ""); return s && s.tools ? s : emptyStore(); } catch { return emptyStore(); }
};
const writeLocal = (s: NoteStore) => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(s)); } catch { /* private mode */ } };

export async function loadNotes(): Promise<{ store: NoteStore; mode: NotesMode; problem?: string }> {
  try {
    const res = await fetch("/api/tool-notes", { headers });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.includes("json")) {
      const msg = type.includes("json") ? (await res.json()).error : "the notes service isn't available here";
      throw new Error(msg);
    }
    return { store: (await res.json()) as NoteStore, mode: "live" };
  } catch (e) {
    return { store: readLocal(), mode: "local", problem: e instanceof Error ? e.message : String(e) };
  }
}

export async function saveNote(mode: NotesMode, current: NoteStore, tool: string, fields: Partial<Note>, by: string): Promise<NoteStore> {
  if (mode === "live") {
    const res = await fetch("/api/tool-notes", { method: "POST", headers, body: JSON.stringify({ tool, fields, by }) });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ error: "Could not save" }))).error ?? "Could not save");
    const { note } = (await res.json()) as { note: Note };
    return { ...current, tools: { ...current.tools, [tool]: note } };
  }
  const next = applyNoteUpdate(readLocal(), tool, fields, by, new Date().toISOString());
  writeLocal(next);
  return next;
}
