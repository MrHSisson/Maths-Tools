// Printable worksheets pinned to a lesson. A pinned worksheet is an ordinary book-activity element (`kind: "worksheet"`) with
// `pin` set: it prints with the same layout engine as the tool pages' Worksheet (grid or list, columns, borders), on an A5
// page by default, with an answer sheet. `frozen` keeps the generated questions with the deck so a printed sheet and its
// answers never change if a generator does.
import { handlePrint } from "../shared/print";
import type { AnyQuestion, PrintMode } from "../shared";
import { generateSet, instructionOf, loadConfig } from "./generators";
import type { DeckDef, DeckElement, FrozenSheet, Slide } from "./types";

export const MAX_PINNED = 3;
export type Sheet = Extract<DeckElement, { kind: "worksheet" }>;
export interface Pinned { slide: Slide; slideNo: number; el: Sheet }

/** Every worksheet pinned to the lesson, in slide order. */
export const pinnedSheets = (deck: Pick<DeckDef, "slides">): Pinned[] =>
  deck.slides.flatMap((slide, i) => slide.els.filter((e): e is Sheet => e.kind === "worksheet" && !!e.pin).map((el) => ({ slide, slideNo: i + 1, el })));

/** What the set depends on: change any of it and a frozen copy no longer applies. */
export const sheetSig = (el: Sheet) => JSON.stringify([el.tool, el.preset, el.count, el.seed ?? 1]);

/** A question as it is kept and printed: what it shows and what it answers, without its worked solution. */
const trim = (q: AnyQuestion): AnyQuestion => ({ ...q, working: [] }) as AnyQuestion;

export const isFrozen = (el: Sheet) => !!el.frozen && el.frozen.sig === sheetSig(el);

/** The sheet's questions: the frozen copy while it still applies, otherwise a fresh set from its seed. */
export async function sheetQuestions(el: Sheet): Promise<AnyQuestion[]> {
  if (el.frozen && isFrozen(el)) return el.frozen.questions;
  return (await generateSet(el.tool, el.preset, el.count, el.seed ?? 1)).map(trim);
}

/** A copy of the set to keep with the deck (call again for a new frozen copy after changing the seed). */
export async function freezeSheet(el: Sheet): Promise<FrozenSheet> {
  return { sig: sheetSig(el), questions: (await generateSet(el.tool, el.preset, el.count, el.seed ?? 1)).map(trim) };
}

/** Opens the print window: the questions, the answer sheet, or both. A5 unless the sheet says otherwise. */
export async function printSheet(el: Sheet, mode: PrintMode): Promise<void> {
  const pin = el.pin;
  if (!pin) return;
  const [qs, cfg] = await Promise.all([sheetQuestions(el), loadConfig(el.tool)]);
  const instruction = el.prompt ?? (cfg ? instructionOf(cfg, el.preset.sub) : "");
  const fontPx = pin.fontPx ?? 16;
  // the answer sheet is a compact numbered list in larger type (a box per answer wastes the page); questions plus answers keep the sheet's own layout
  if (mode === "answers") handlePrint(qs, pin.title, el.preset.level, false, [], 2, instruction, mode, "list", false, true, true, { paper: pin.paper ?? "A5", fontPx: Math.round(fontPx * 1.3), compactAnswers: true });
  else handlePrint(qs, pin.title, el.preset.level, false, [], Math.max(1, el.cols), instruction, mode, pin.layout ?? "grid", pin.borders ?? true, true, true, { paper: pin.paper ?? "A5", fontPx });
}

/** A title for the next pinned worksheet: "Worksheet 1", then 2, 3. */
export const nextSheetTitle = (deck: Pick<DeckDef, "slides">) => `Worksheet ${pinnedSheets(deck).length + 1}`;
