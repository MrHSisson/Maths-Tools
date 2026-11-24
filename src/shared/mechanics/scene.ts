// Mechanics diagrams: the scene model. A scene is plain data in schematic units (not metres), so it can be tested, mirrored and drawn at any size.
// A generator never draws: it fills in a few numbers, a template builder (templates/) turns them into a Scene, and MechDiagram draws any Scene.
// Plan: docs/architecture/MECHANICS_DIAGRAMS_PLAN.md. Every element is defined by points (not by an angle and a length) so mirroring is exact.

export interface Pt { x: number; y: number }

/** What a force arrow stands for. Each kind has one colour AND one line style AND a text label, so colour is never the only cue (palette.ts). */
export type ForceKind =
  | "weight" | "driving" | "resistance" | "tension" | "thrust" | "normal" | "friction"
  | "applied" | "component" | "velocity" | "acceleration";

interface Base {
  /** Stable name, so a working step can light it (`focus`) and a test can find it. */
  id: string;
  /** The working step at which it appears; undefined (or 0) means it is there from the start. A worked example builds the picture one step at a time. */
  reveal?: number;
  /** Which named part of the picture it belongs to (`Scene.parts`), so a tool adds a picture by parts: "the setting", then "the forces", then "the distance". */
  part?: string;
  /** Names a step's `Focus` can light. */
  focus?: string[];
}

/** A label that may be hidden behind a placeholder until the answer is shown: `text` is the value, `ask` is what shows before (usually "?" or a letter). */
export interface Lbl { text: string; ask?: string }

/** A surface or level: ground, a slope, a wall, a datum line, the top of a table. */
export interface Surface extends Base {
  type: "surface";
  kind: "ground" | "incline" | "wall" | "datum" | "ceiling";
  a: Pt; b: Pt;
  /** Hatch marks on the side away from the body (the standard way to draw a fixed surface). */
  hatch?: boolean;
  /** For `datum`: the dashed level line. */
  dashed?: boolean;
  /** Which side the hatching falls on: +1 left of a→b, -1 right of it. Draw a ground or slope from its left end to its right end and the default (-1) hatches below it. */
  hatchSide?: 1 | -1;
}

/** A body. `at` is the centre of its base (where it touches its surface); `rot` turns it to sit on a slope. `ghost` draws it faint and dashed (a start or end position). */
export interface Body extends Base {
  type: "body";
  kind: "particle" | "block";
  at: Pt;
  /** Degrees, anticlockwise on screen as a viewer sees it. 0 sits on level ground. */
  rot?: number;
  w?: number; h?: number;
  ghost?: boolean;
  /** Text inside or beside the body (a mass, "m", "P"). */
  label?: Lbl;
}

/** A force arrow from `from` to `to` (the head). Its length is schematic: the kind and the layout decide it, never the magnitude. */
export interface Force extends Base {
  type: "force";
  kind: ForceKind;
  from: Pt; to: Pt;
  label?: Lbl;
  /** A `component` (a resolved part of another force) is drawn dashed in the colour of the force it belongs to. */
  tone?: ForceKind;
}

/** A dimension line: a measured distance with end ticks, drawn `offset` away from the a to b line (to its left when positive), the label in the gap. */
export interface Dim extends Base {
  type: "dim";
  a: Pt; b: Pt;
  offset?: number;
  label?: Lbl;
  /** Dashed witness lines from a and b out to the dimension line. */
  witness?: boolean;
}

/** An angle mark between two directions at a point. Angles in degrees, anticlockwise as the viewer sees them. */
export interface Arc extends Base {
  type: "arc";
  at: Pt; r: number; from: number; to: number;
  label?: Lbl;
}

/** A named point: a small dot and its name (A, B, O). `dir` is where the name sits relative to the dot, in degrees as the viewer sees them. */
export interface Marker extends Base {
  type: "marker";
  at: Pt; name: string; dir?: number; hideDot?: boolean;
  /** How far the name sits from `at`; by default a little more than the text height, so it clears a line through the point. */
  dist?: number;
}

/** A line that is part of the picture and not a surface: a dashed level line, a guide, a rope, a path. */
export interface Line extends Base {
  type: "line";
  a: Pt; b: Pt;
  style?: "solid" | "dashed" | "thin";
}

/** A spring, an elastic string, a plain string or a rope from `a` (usually the fixed end) to `b`. A spring is drawn as coils, an elastic string as a plain
 *  line in the tension colour, a plain string thin and dark. `slack` draws it hanging loose (a string that is not taut). */
export interface Spring extends Base {
  type: "spring";
  kind: "spring" | "elastic" | "string";
  a: Pt; b: Pt;
  slack?: boolean;
  coils?: number;
  label?: Lbl;
}

/** A pulley: a wheel at `at` with radius `r` on a fixed support (the support is a separate surface or line). */
export interface Pulley extends Base {
  type: "pulley";
  at: Pt; r: number;
}

/** A graph in a plot box: axes with titles, a curve (in plot units, 0 to 1 both ways, y up), tick marks with guide lines, and an optional shaded area under the curve. */
export interface Graph extends Base {
  type: "graph";
  x: number; y: number; w: number; h: number;
  xTitle?: Lbl; yTitle?: Lbl;
  curve: Pt[];
  curveLabel?: Lbl;
  /** A mark on an axis at `at` (0 to 1) with a label; `guide` draws a dashed line from the curve to the axis. */
  marks?: { axis: "x" | "y"; at: number; label: Lbl; guide?: boolean }[];
  /** The area under the curve between two x positions, shaded, with an optional label inside it. */
  area?: { from: number; to: number; label?: Lbl };
}

/** Energy as stacked bars, one column per state: gravitational potential, elastic potential and kinetic energy, plus work added or removed. Each height is a fraction (0 to 1) of the tallest column. */
export interface BarColumn { name: Lbl; gpe?: number; epe?: number; ke?: number; work?: number }
export interface Bars extends Base {
  type: "bars";
  x: number; y: number; w: number; h: number;
  columns: BarColumn[];
  /** A dashed line across at the height of the first column's total: what stays the same when only gravity (and the spring) do work. */
  conserved?: boolean;
  /** The legend naming what each colour is (KE, GPE, EPE, work). */
  legend?: boolean;
}

export type SceneElement = Surface | Body | Force | Dim | Arc | Marker | Line | Spring | Pulley | Graph | Bars;

/** A named part of a picture. `given` parts are what a question that supplies its diagram shows straight away; the others (a resolved component, a new label) are added by the working. */
export interface ScenePart { id: string; label: string; given: boolean }

export interface Scene {
  /** The viewBox. */
  w: number; h: number;
  elements: SceneElement[];
  /** The parts, in the order a picture is naturally built (the setting, then the motion, the forces, the measurements). */
  parts?: ScenePart[];
  /** A short text for screen readers, built from the numbers. */
  alt?: string;
}

export const lblText = (l: Lbl | undefined, showAnswer: boolean): string | undefined =>
  l == null ? undefined : (!showAnswer && l.ask != null ? l.ask : l.text);

/** Is the element on show at this step? `step` undefined means the whole picture. */
export const visibleAt = (e: Base, step?: number): boolean => step == null || e.reveal == null || e.reveal <= step;

// ── adding a picture by parts, and when it shows ─────────────────────────────────────────────────────────────────────

/** Does the question show its diagram straight away (`given`), draw it up from nothing as the working goes on (`build`), never have one (`hidden`), or give it
 *  blurred until the student presses Reveal (`blurred`: it is `given` once revealed, so students can draw it themselves first)? */
export type DiagramDisplay = "given" | "build" | "hidden" | "blurred" | "full";
/** Where the picture is being shown: with the question, at a working step (`shown` = how many steps are showing), or at the end with the answer. */
export type DiagramView = { stage: "question" } | { stage: "working"; shown: number } | { stage: "answer" };

/** The `step` to hand `MechDiagram`: `null` means draw nothing, `undefined` means the whole picture, a number reveals elements up to that step. The one place the
 *  rule lives, so every tool shows its diagram the same way. */
export function displayStep(display: DiagramDisplay, view: DiagramView): number | null | undefined {
  if (display === "hidden") return null;
  if (display === "full") return undefined;   // the whole picture from the start
  switch (view.stage) {
    case "answer": return undefined;
    case "question": return display === "given" || display === "blurred" ? 0 : null;
    case "working": return display === "given" || display === "blurred" ? view.shown : view.shown <= 0 ? null : view.shown;
  }
}

/** A copy of the scene with each listed part appearing at the given working step (a part not listed keeps its step). */
export function stageParts(scene: Scene, steps: Record<string, number>): Scene {
  return { ...scene, elements: scene.elements.map((e) => (e.part != null && steps[e.part] != null ? { ...e, reveal: steps[e.part] } : e)) };
}

/** A copy of the scene built up from nothing, one part at a time in the order given: the first listed appears at step 1, the next at step 2, and so on.
 *  Several parts in one inner array appear together. Parts not listed come last. */
export function buildInOrder(scene: Scene, order: (string | string[])[]): Scene {
  const steps: Record<string, number> = {};
  order.forEach((g, i) => (Array.isArray(g) ? g : [g]).forEach((p) => { steps[p] = i + 1; }));
  const rest = (scene.parts ?? []).map((p) => p.id).filter((id) => steps[id] == null);
  rest.forEach((id) => { steps[id] = order.length + 1; });
  return stageParts(scene, steps);
}

/** Tag every element with its part from a rule on its id, and set the scene's list of parts. Templates call this last. */
export function withParts(scene: Scene, parts: ScenePart[], partOf: (id: string) => string): Scene {
  const notGiven = new Set(parts.filter((p) => !p.given).map((p) => p.id));
  return {
    ...scene, parts,
    // a part the working adds (not given with the question) is held back until the first working step unless a tool stages it later
    elements: scene.elements.map((e) => {
      const part = e.part ?? partOf(e.id);
      return { ...e, part, reveal: e.reveal ?? (notGiven.has(part) ? 1 : undefined) };
    }),
  };
}

/** The number of working steps the picture needs to show everything. */
export const stepCount = (scene: Scene): number => scene.elements.reduce((m, e) => Math.max(m, e.reveal ?? 0), 0);

/** Which parts are on show at a step (for a tool to caption what has just been added). */
export const partsAt = (scene: Scene, step?: number): string[] => [...new Set(scene.elements.filter((e) => e.part != null && visibleAt(e, step)).map((e) => e.part as string))];

// ── plane geometry helpers ───────────────────────────────────────────────────────────────────────────────────────
export const rad = (deg: number): number => (deg * Math.PI) / 180;
export const add = (p: Pt, q: Pt): Pt => ({ x: p.x + q.x, y: p.y + q.y });
export const sub = (p: Pt, q: Pt): Pt => ({ x: p.x - q.x, y: p.y - q.y });
export const mul = (p: Pt, k: number): Pt => ({ x: p.x * k, y: p.y * k });
export const len = (p: Pt): number => Math.hypot(p.x, p.y);
export const unit = (p: Pt): Pt => { const l = len(p) || 1; return { x: p.x / l, y: p.y / l }; };
/** The direction `deg` degrees anticlockwise from the viewer's right, as a unit vector in screen coordinates (y points down). */
export const dir = (deg: number): Pt => ({ x: Math.cos(rad(deg)), y: -Math.sin(rad(deg)) });
/** `p` moved `d` along `deg`. */
export const toward = (p: Pt, deg: number, d: number): Pt => add(p, mul(dir(deg), d));
/** The left-hand normal of a→b on screen (the side a viewer sees on their left as they walk from a to b). */
export const leftNormal = (a: Pt, b: Pt): Pt => { const u = unit(sub(b, a)); return { x: u.y, y: -u.x }; };

/** Flip a point across the vertical centre line of a scene of width `w`. */
const flipPt = (p: Pt, w: number): Pt => ({ x: w - p.x, y: p.y });
const flipDeg = (d: number): number => 180 - d;

/** The whole scene flipped left to right. Text is never mirrored; only positions and angles move. */
export function mirrorScene(s: Scene): Scene {
  const f = (p: Pt) => flipPt(p, s.w);
  return {
    ...s,
    elements: s.elements.map((e): SceneElement => {
      switch (e.type) {
        // a and b swap so the surface still runs left to right and its hatching stays on the same side of the body
        case "surface": return { ...e, a: f(e.b), b: f(e.a) };
        case "body": return { ...e, at: f(e.at), rot: e.rot == null ? undefined : -e.rot };
        case "force": return { ...e, from: f(e.from), to: f(e.to) };
        case "dim": return { ...e, a: f(e.a), b: f(e.b), offset: e.offset == null ? undefined : -e.offset };
        case "arc": return { ...e, at: f(e.at), from: flipDeg(e.to), to: flipDeg(e.from) };
        case "marker": return { ...e, at: f(e.at), dir: e.dir == null ? undefined : flipDeg(e.dir) };
        case "line": return { ...e, a: f(e.a), b: f(e.b) };
        case "spring": return { ...e, a: f(e.a), b: f(e.b) };
        case "pulley": return { ...e, at: f(e.at) };
        case "graph": case "bars": return e;   // a graph or a bar chart is not flipped: its axes always read left to right
      }
    }),
  };
}

/** Every point an element occupies that must lie inside the picture (used by the validator). */
function elementPoints(e: SceneElement): Pt[] {
  switch (e.type) {
    case "surface": case "line": return [e.a, e.b];
    case "body": return [e.at];
    case "force": return [e.from, e.to];
    case "dim": return [e.a, e.b];
    case "arc": return [e.at];
    case "marker": return [e.at];
    case "spring": return [e.a, e.b];
    case "pulley": return [e.at];
    case "graph": case "bars": return [{ x: e.x, y: e.y }, { x: e.x + e.w, y: e.y + e.h }];
  }
}

/** What is wrong with a scene, as plain sentences; empty when it is sound. Templates and tests call it. */
export function validateScene(s: Scene): string[] {
  const bad: string[] = [];
  const ids = new Set<string>();
  for (const e of s.elements) {
    if (ids.has(e.id)) bad.push(`duplicate id ${e.id}`);
    ids.add(e.id);
    for (const p of elementPoints(e)) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) bad.push(`${e.id}: a point is not finite`);
      else if (p.x < 0 || p.y < 0 || p.x > s.w || p.y > s.h) bad.push(`${e.id}: a point (${p.x.toFixed(1)}, ${p.y.toFixed(1)}) is outside the picture`);
    }
    if (e.type === "force" && len(sub(e.to, e.from)) < 12) bad.push(`${e.id}: an arrow shorter than 12`);
    if (e.type === "dim" && len(sub(e.b, e.a)) < 12) bad.push(`${e.id}: a dimension shorter than 12`);
  }
  return bad;
}
