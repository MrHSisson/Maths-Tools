import type { DeckDef } from "./types";
import data from "./data/estimation.json";

// Estimation is a data deck like any other (src/decks/data/estimation.json). It keeps this named export for the tests.
export const ESTIMATION_DECK = data as unknown as DeckDef;
