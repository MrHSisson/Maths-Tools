// The underscore fields on a question — the contract between a tool and the shell.
//
// A generator attaches extra data to the question it returns (`_diagram`, `_rawValues`, `_stagedReveal`…); the shell,
// the print paths and the tool's own renderers read it back. `AnyQuestion` does not declare these, so they used to be
// read as `(q as any)._diagram` — and a misspelt name just did nothing. Every such field is listed here, once.
//
//   read:   const { diagram } = ...        →  extras(q)._diagram
//   write:  return withExtras({ kind: "simple", … }, { _diagram: d, _aspect: 1.6 })
//
// A field the SHELL reads has its real type. A field only its own tool reads is `unknown` here: the tool narrows it
// where it reads it (`extras(q)._pv as PVData | undefined`), which is still a checked, searchable name.
// `src/tests/questionExtras.test.ts` fails if source mentions an underscore field that is not in this list.

import type { QOSnapshot } from "./types";

export interface QuestionExtras {
  // ── Set by the shell ──────────────────────────────────────────────────────────────
  /** The generator seed the question was drawn from (`generateSeeded`) — lets a display-only option replay it. */
  _seed?: number;
  /** The QO state a worksheet cell was generated with (its own regenerate button reuses it). */
  _qo?: QOSnapshot;
  /** Advanced worksheet builder: which sub-tool made the question, and which section it sits in. */
  _tool?: string;
  _sectionIdx?: number;
  _sectionCols?: number;
  _sectionHeader?: string;

  // ── Calibration (see "Calibrating a tool") ────────────────────────────────────────
  _rawDifficulty?: number;
  _category?: string;
  _difficultyScore?: number;

  // ── Set by a tool, read by the shell ──────────────────────────────────────────────
  /** Diagram data for a `questionRenderer`; each tool narrows it to its own type. */
  _diagram?: unknown;
  /** The raw parameters the display was built from (for `reformatQuestion`); each tool narrows it. */
  _rawValues?: unknown;
  /** Staged reveal: the button label, or a list of labels pressed in turn. */
  _stagedReveal?: string | string[];
  /** Per-step emphasis for a split worked example, one entry per working step (the tool decides the shape). */
  _stepFocus?: unknown[];
  /** Given to a step's picture copy by `withDiagramSteps`: the step's focus entry, and the step index. */
  _focus?: unknown;
  _step?: number;
  /** Print: width ÷ height of the diagram, a plain text cell for a diagram sheet, a fuller printed answer. */
  _aspect?: number;
  _printText?: string;
  _printAnswer?: string;
  /** Print: lowers `handleDiagramPrint`'s density floor (mm) so fewer cells fit a page. */
  _densityFloorMm?: number;
  /** A worksheet cell whose size is fixed (a grid or diagram): the text-size chevrons stay hidden. */
  _fixedSizeCell?: boolean;
  /** Worksheet: the answer line is drawn as maths from `answerLatex` rather than as text. */
  _answerAsMath?: boolean;
  /** Worksheet: the condensed wording (question, then a small tag); `_tagged` marks a question already condensed. */
  _condensedLines?: string[];
  _tagged?: boolean;

  // ── Private to one tool (that tool narrows the type where it reads it) ────────────
  _raw?: unknown;
  _pv?: unknown;
  _ws?: unknown;
  _sig?: unknown;
  _wh?: unknown;
  _grid?: unknown;
  _table?: unknown;
  _matrix?: unknown;
  _graph?: unknown;
  _solLines?: unknown;
  _gN?: unknown;
  _gD?: unknown;
  _work?: unknown;
  _qoKey?: unknown;
  _rounding?: unknown;
  _sf?: unknown;
  _mcq?: unknown;
  _fix?: unknown;
  _fsScaffold?: unknown;
  _fsMeta?: unknown;
  _fsCheck?: unknown;
  _workingFull?: unknown;
}

/** The question's underscore fields, typed. One cast lives here instead of one `as any` at every read. */
export const extras = (q: object): QuestionExtras => q as QuestionExtras;

/** A copy of `q` carrying `fields` — for a generator's `return` and for a shell step that tags a question. */
export const withExtras = <Q extends object>(q: Q, fields: QuestionExtras): Q => ({ ...q, ...fields });
