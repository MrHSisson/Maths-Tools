import { PACKS, CLUE_KINDS, type ClueKind, type Ks, type PackId, type WordFilter } from "./words";

const PACK_IDS = PACKS.map(p => p.id);
const KIND_IDS = CLUE_KINDS.map(k => k.id);

/** Read the shared word filter from the URL (defaults: every pack and clue type, KS2). */
export function readFilter(): WordFilter {
  const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const packs = (q.get("packs") ?? "").split(",").filter((p): p is PackId => PACK_IDS.includes(p as PackId));
  const kinds = (q.get("clues") ?? "").split(",").filter((k): k is ClueKind => KIND_IDS.includes(k as ClueKind));
  const ks = (q.get("ks") ?? "").split(",").map(Number).filter((k): k is Ks => k === 2 || k === 3 || k === 4);
  return {
    packs: packs.length ? packs : PACK_IDS.slice(),
    kinds: kinds.length ? kinds : KIND_IDS.slice(),
    ks: ks.length ? ks : [2],
  };
}

export function writeParams(f: WordFilter, extra: Record<string, string> = {}) {
  const q = new URLSearchParams({ packs: f.packs.join(","), clues: f.kinds.join(","), ks: f.ks.join(","), ...extra });
  window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
}
