// Flashcards for Further Maths: the card model. One card is written once; a formula card can also be shown back to front ("reverse"), so the cards a student
// meets (the prompts) are a card and a direction. Design and the first card set: specs/flashcards/further-mechanics-mc.md.
import type { Scene } from "../mechanics";

/** What a card asks: a formula to recall, a unit or value, when something applies, which method to use, a trap to avoid, or a picture to read. */
export type CardKind = "formula" | "units" | "condition" | "method" | "trap" | "diagram";

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

export type Rating = "again" | "nearly" | "got";
