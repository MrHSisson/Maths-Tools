// Flashcards for Further Maths: the card model. One card is written once; a formula card can also be shown back to front ("reverse"), so the cards a student
// meets (the prompts) are a card and a direction. Design and the first card set: specs/flashcards/further-mechanics-mc.md.
import type { Scene } from "../mechanics";

/** The header a card carries, so a student knows what is being asked: a definition to state, a formula to recall, a result to derive, a property, a unit or value, a method, a common error, or a diagram to read. */
export type CardKind = "definition" | "formula" | "derive" | "property" | "unit" | "method" | "error" | "diagram";

/** Essential cards are the results and facts to know; derived cards ask for something that can be worked out from them (good practice, but not something to memorise). */
type CardTier = "essential" | "derived";

export interface Card {
  /** Stable name, such as "mc3-ke"; also the key of the card's memory on the student's device, so never reuse or rename one. */
  id: string;
  /** The specification statement it belongs to (MC1 to MC7). */
  statement: string;
  /** A2 for the cards that need cos θ, resolving, slopes or vectors; AS for the rest. */
  course: "AS" | "A2";
  kind: CardKind;
  tier: CardTier;
  /** Text with maths between $…$ (KaTeX). */
  front: string;
  back: string;
  /** Also shown back to front (a formula card: the formula is the prompt and its name the answer). */
  reverse?: boolean;
  /** A mechanics diagram. `on` says which faces show it; labels written with an `ask` show their placeholder on the front and their value on the back. */
  picture?: { scene: Scene; on: "front" | "back" | "both" };
  /** One line of "why", shown under the answer. */
  note?: string;
}

/** A card shown in one direction. */
export interface Prompt {
  /** `card.id`, or `card.id~r` for the reverse direction: the key of its memory. */
  key: string;
  card: Card;
  reversed: boolean;
}

export interface CardSet {
  id: string;
  title: string;
  /** The statements in the set, in order, with a short name each. */
  statements: { code: string; name: string }[];
  cards: Card[];
}

/** How the student judged themselves: not yet, or got it. */
export type Rating = "again" | "got";
