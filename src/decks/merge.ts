// Rebuilding a deck from its script must not undo what Harry did in the editor. Every slide a build writes carries `built`, a hash of the
// slide as built; if the slide's hash is still that, nobody has touched it, so a rebuild may replace it. A slide whose hash has moved
// was edited and is kept as it is (the rebuild says so). A slide with no `built` was added in the editor and is kept too.
import type { DeckDef, Slide } from "./types";

const stable = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, x]) => `${JSON.stringify(k)}:${stable(x)}`).join(",")}}`;
  return JSON.stringify(v);
};
/** A short fingerprint of a slide's content (not its own `built` stamp). */
export const slideHash = (s: Slide): string => {
  const { built: _built, ...rest } = s; void _built;
  const text = stable(rest);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

/** Stamps every slide with the hash it was built with. */
export const stampBuilt = (deck: DeckDef): DeckDef => ({ ...deck, slides: deck.slides.map((s) => ({ ...s, built: slideHash(s) })) });
export const isEdited = (s: Slide): boolean => !s.built || slideHash(s) !== s.built;

interface MergeReport { deck: DeckDef; kept: string[]; added: string[]; dropped: string[]; replaced: number }

/** The fresh build with Harry's edits put back: edited slides stay as they are, slides he added stay after the slide they followed. */
export function mergeRebuild(existing: DeckDef, fresh: DeckDef): MergeReport {
  // a deck from before slides were stamped: nothing says what was built and what was edited, so this build replaces it (the next one is safe)
  if (!existing.slides.some((s) => s.built)) return { deck: fresh, kept: [], added: [], dropped: [], replaced: fresh.slides.length };
  const old = new Map(existing.slides.map((s) => [s.id, s]));
  const freshIds = new Set(fresh.slides.map((s) => s.id));
  const kept: string[] = [], added: string[] = [], dropped: string[] = [];
  let replaced = 0;
  const slides: Slide[] = fresh.slides.map((s) => {
    const was = old.get(s.id);
    if (was && isEdited(was)) { kept.push(s.id); return was; }
    replaced++;
    return s;
  });
  // slides in the old deck the script no longer makes: his own additions stay; unedited built ones go; edited built ones stay and are reported
  existing.slides.forEach((s, i) => {
    if (freshIds.has(s.id)) return;
    if (s.built && !isEdited(s)) { dropped.push(s.id); return; }
    (s.built ? kept : added).push(s.id);
    const before = [...existing.slides.slice(0, i)].reverse().find((p) => slides.some((x) => x.id === p.id));
    const at = before ? slides.findIndex((x) => x.id === before.id) + 1 : 0;
    slides.splice(at, 0, s);
  });
  return { deck: { ...fresh, slides }, kept, added, dropped, replaced };
}
