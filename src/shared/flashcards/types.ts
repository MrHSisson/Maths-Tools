// Flashcards for Further Maths: the card model. One card is written once; a formula card can also be shown back to front ("reverse"), so the cards a student
// meets (the prompts) are a card and a direction. Design and the first card set: specs/flashcards/further-mechanics-mc.md.
import type { Scene } from "../mechanics";

/** What a card asks of the student, and the group it belongs to when they choose what to revise: a formula to state, a definition to give, what a situation implies, or a common mistake to avoid. */
export type CardKind = "formula" | "definition" | "implication" | "mistake";

export interface Card {
  /** Stable name, such as "mc3-ke"; also the key of the card's memory on the student's device, so never reuse or rename one. */
  id: string;
  /** The specification statement it belongs to (MC1 to MC7). */
  statement: string;
  /** A2 for the cards that need cos θ, resolving, slopes or vectors; AS for the rest. */
  course: "AS" | "A2";
  kind: CardKind;
  /** Text with maths between $…$ (KaTeX). */
  front: string;
  back: string;
  /** Also shown back to front: the formula or definition is the prompt and its `name` the answer. Only formula and definition cards have one. */
  reverse?: boolean;
  /** The short name of what the card is about ("Kinetic energy"), the answer when the card is shown back to front. Required when `reverse` is set. */
  name?: string;
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
