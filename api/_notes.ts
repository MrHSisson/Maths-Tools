// Tool notes — the hand-written half of the admin dashboard (the other half is generated from code).
// Pure types and merge logic, shared by the dashboard and the /api/tool-notes function.

export const STATUS_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "in-development", label: "In development" },
  { value: "ready", label: "Ready to go live" },
  { value: "live", label: "Live" },
  { value: "shelved", label: "Shelved" },
] as const;

export const REVIEW_OPTIONS = [
  { value: "not-started", label: "Not reviewed" },
  { value: "in-progress", label: "Reviewing" },
  { value: "done", label: "Reviewed" },
] as const;

type NoteStatus = (typeof STATUS_OPTIONS)[number]["value"];
type NoteReview = (typeof REVIEW_OPTIONS)[number]["value"];

export const TEXT_FIELDS = ["inDevelopment", "wantsToChange", "differsFrom", "representation", "openQuestions"] as const;
export type NoteTextField = (typeof TEXT_FIELDS)[number];

export interface Note {
  status?: NoteStatus;
  /** What is being built right now. */
  inDevelopment?: string;
  /** What we want to change. */
  wantsToChange?: string;
  /** How it differs from, or adds to, the standard tool. */
  differsFrom?: string;
  /** The representation(s) agreed for this tool, in plain words. */
  representation?: string;
  representationAgreed?: boolean;
  review?: NoteReview;
  openQuestions?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface NoteStore { version: 1; tools: Record<string, Note> }

export const emptyStore = (): NoteStore => ({ version: 1, tools: {} });

export const MAX_TEXT = 4000;

/** Keep only known fields with valid values; anything else is dropped. */
export function sanitiseFields(input: unknown): Partial<Note> {
  const out: Partial<Note> = {};
  if (!input || typeof input !== "object") return out;
  const f = input as Record<string, unknown>;
  if (STATUS_OPTIONS.some(o => o.value === f.status)) out.status = f.status as NoteStatus;
  if (REVIEW_OPTIONS.some(o => o.value === f.review)) out.review = f.review as NoteReview;
  if (typeof f.representationAgreed === "boolean") out.representationAgreed = f.representationAgreed;
  for (const k of TEXT_FIELDS) if (typeof f[k] === "string") out[k] = (f[k] as string).slice(0, MAX_TEXT);
  return out;
}

/** Merge a partial update into one tool's note, stamping who and when. */
export function applyNoteUpdate(store: NoteStore, toolId: string, fields: Partial<Note>, by: string, now: string): NoteStore {
  const prev = store.tools[toolId] ?? {};
  return {
    version: 1,
    tools: { ...store.tools, [toolId]: { ...prev, ...fields, updatedAt: now, updatedBy: by.slice(0, 40) || "unknown" } },
  };
}

/** Drop one tool's note (for an id that no longer exists in the registry). */
export function removeNote(store: NoteStore, toolId: string): NoteStore {
  const { [toolId]: _gone, ...rest } = store.tools;
  return { version: 1, tools: rest };
}
