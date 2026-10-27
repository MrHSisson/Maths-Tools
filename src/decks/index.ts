// Data-only deck index: the shell lists a tool's decks from here, so nothing in this file may import the player.
import type { BankQuestion, DeckDef } from "./types";
import { ESTIMATION_DECK } from "./estimation";
import { ESTIMATION_BANK } from "./estimationBank";

export const DECKS: DeckDef[] = [ESTIMATION_DECK];
export const BANK: BankQuestion[] = [...ESTIMATION_BANK];

export const decksForPath = (path: string): DeckDef[] => DECKS.filter((d) => d.toolPath === path);
