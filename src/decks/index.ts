// Data-only deck index: the shell lists a tool's decks from here, so nothing in this file may import the player.
// A deck is a JSON file in ./data (`npm run deck -- pull <id>` writes one from the shared copy): drop one in and it is listed.
import type { BankQuestion, DeckDef } from "./types";
import { ESTIMATION_BANK } from "./estimationBank";
import { normaliseDeck } from "./normalise";

const files = import.meta.glob<DeckDef>("./data/*.json", { eager: true, import: "default" });

export const DECKS: DeckDef[] = Object.values(files).map(normaliseDeck);
export const BANK: BankQuestion[] = [...ESTIMATION_BANK];

export const decksForPath = (path: string): DeckDef[] => DECKS.filter((d) => d.toolPath === path);
