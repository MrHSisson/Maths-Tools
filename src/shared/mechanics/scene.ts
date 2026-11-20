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
  /** The working step at which it appears; undefined means always. A worked example builds the picture one step at a time. */
  reveal?: number;
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

export type SceneElement = Surface | Body | Force | Dim | Arc | Marker | Line;

export interface Scene {
  /** The viewBox. */
  w: number; h: number;
  elements: SceneElement[];
  /** A short text for screen readers, built from the numbers. */
  alt?: string;
}

export const lblText = (l: Lbl | undefined, showAnswer: boolean): string | undefined =>
  l == null ? undefined : (!showAnswer && l.ask != null ? l.ask : l.text);

/** Is the element on show at this step? `step` undefined means the whole picture. */
export const visibleAt = (e: Base, step?: number): boolean => step == null || e.reveal == null || e.reveal <= step;

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
      }
    }),
  };
}

/** Every point an element occupies that must lie inside the picture (used by the validator). */
export function elementPoints(e: SceneElement): Pt[] {
  switch (e.type) {
    case "surface": case "line": return [e.a, e.b];
    case "body": return [e.at];
    case "force": return [e.from, e.to];
    case "dim": return [e.a, e.b];
    case "arc": return [e.at];
    case "marker": return [e.at];
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
