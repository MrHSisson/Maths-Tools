// The repo's deck snapshots (src/decks/data/*.json), for tests only. The app does not bundle them: decks come from the shared copy.
import type { DeckDef } from "../decks/types";
import { normaliseDeck } from "../decks/normalise";

const files = import.meta.glob<DeckDef>("../decks/data/*.json", { eager: true, import: "default" });

export const DECKS: DeckDef[] = Object.values(files).map(normaliseDeck);
export const decksForPath = (path: string): DeckDef[] => DECKS.filter((d) => d.toolPath === path);
