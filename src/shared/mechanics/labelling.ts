// Mechanics diagrams: where every label goes. One function, `layoutScene`, turns a scene (at a step, with the answer shown or not) into the
// things a renderer needs: what is visible, the obstacles, and a spot for each label. It reuses the Perimeter & Area placement solver
// (shared/shapes/labels.ts) instead of a second one: a force's label is a "free" pill that hugs its arrow, everything else is a fixed rectangle
// the solver steers around. The renderer never drops a label: a scene that cannot place one reports it (`unplaced`).
import { placePills, segHitsRect, type PillIn, type Rect, type Seg, type Scene as PlaceScene } from "../shapes/labels";
import { bodyAnchors, bodyOutline, bodyPoint, bodySize } from "./bodies";
import { barRects, curveAt, graphAxes, graphPoint, areaPolygon } from "./chartGeom";
import { springSegments } from "./elastics";
import { add, dir, leftNormal, lblText, mul, visibleAt, type Dim, type Lbl, type Pt, type Scene, type SceneElement } from "./scene";

export const dimLine = (d: Dim): { a: Pt; b: Pt } => {
  const n = leftNormal(d.a, d.b), o = d.offset ?? 0;
  return { a: add(d.a, mul(n, o)), b: add(d.b, mul(n, o)) };
};

/** Width of a label in picture units: a sans-serif character is about 0.6 of the font size. */
export const textWidth = (text: string, fontSize: number): number => text.length * fontSize * 0.6;

export interface PlacedLabel {
  id: string;
  text: string;
  /** Centre of the text. */
  x: number; y: number;
  rect: Rect;
  /** Where a leader line starts, if the label stands off from what it names (a leader is drawn only when this is not at the label). */
  lx: number; ly: number;
  hasLeader: boolean;
  /** The label this text came from, so the text can change with `showAnswer` while the place stays put. */
  lbl?: Lbl;
}

export interface Layout {
  /** The label size actually used: the size asked for, or a little smaller when the labels would not all fit cleanly at that size. */
  fontSize: number;
  visible: SceneElement[];
  labels: PlacedLabel[];
  /** Ids of labels that overlap another label or run off the picture even at the smallest size tried (should be empty; a test asserts it). */
  unplaced: string[];
  /** Ids of labels that sit on a solid line even at the smallest size tried (should be empty; a test asserts it). */
  clashes: string[];
  /** Solid lines (surfaces, outlines, arrows, dimension lines): a label must not sit on these. */
  obstacles: Seg[];
  /** Dashed level lines and the stand-ins for hatching: a label avoids them if it can. */
  guides: Seg[];
}

const segOf = (a: Pt, b: Pt): Seg => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
const polySegs = (pts: Pt[]): Seg[] => pts.map((p, i) => segOf(p, pts[(i + 1) % pts.length]));

/** The text a label is placed for: the longer of its value and its placeholder, so it does not move when the answer is shown. */
const placedText = (l: Lbl | undefined): string | undefined =>
  l == null ? undefined : l.ask != null && l.ask.length > l.text.length ? l.ask : l.text;

interface Placement { labels: PlacedLabel[]; unplaced: string[]; clashes: string[]; obstacles: Seg[]; guides: Seg[]; owners: Map<string, SceneElement> }
const cache = new WeakMap<Scene, Map<number, Placement>>();

/** Place every label of the WHOLE scene once (per size), whatever step is showing, so a label never jumps as the picture is built part by part. */
function placeAll(scene: Scene, fontSize: number): Placement {
  const byScene = cache.get(scene) ?? new Map<number, Placement>();
  cache.set(scene, byScene);
  const hit = byScene.get(fontSize);
  if (hit) return hit;

  const shape: Seg[] = [];
  const helpers: Seg[] = [];
  const fixed: { id: string; text: string; rect: Rect; lx: number; ly: number; hasLeader: boolean; lbl?: Lbl }[] = [];
  const free: { id: string; text: string; item: PillIn; lbl?: Lbl }[] = [];
  const markers: Extract<SceneElement, { type: "marker" }>[] = [];
  const pillH = fontSize * 1.25;
  const pad = 6;

  const fixedAt = (id: string, text: string, at: Pt, lbl?: Lbl) =>
    fixed.push({ id, text, rect: { x: at.x, y: at.y, w: textWidth(text, fontSize) + pad, h: pillH }, lx: at.x, ly: at.y, hasLeader: false, lbl });
  const freeOn = (id: string, text: string, a: Pt, b: Pt, lbl?: Lbl) => {
    const n = leftNormal(a, b);
    free.push({ id, text, lbl, item: { ax: a.x, ay: a.y, bx: b.x, by: b.y, nx: n.x, ny: n.y, w: textWidth(text, fontSize) + pad, h: pillH, free: true } });
  };

  for (const e of scene.elements) {
    switch (e.type) {
      case "surface": {
        shape.push(segOf(e.a, e.b));
        if (e.hatch) {
          // the hatching is not a place for text: stand-in lines across its depth, so a label never lands inside it
          const n = leftNormal(e.a, e.b), side = e.hatchSide ?? -1;
          for (const d of [4, 10, 16]) helpers.push(segOf(add(e.a, mul(n, side * d)), add(e.b, mul(n, side * d))));
        }
        break;
      }
      case "line": (e.style === "dashed" || e.style === "thin" ? helpers : shape).push(segOf(e.a, e.b)); break;
      case "spring": {
        for (const [p, q] of springSegments(e)) shape.push(segOf(p, q));
        const t = placedText(e.label);
        if (t) freeOn(e.id, t, e.a, e.b, e.label);
        break;
      }
      case "pulley": {
        const pts = Array.from({ length: 10 }, (_, i) => add(e.at, mul(dir((i / 10) * 360), e.r)));
        shape.push(...polySegs(pts));
        break;
      }
      case "body": {
        (e.ghost ? helpers : shape).push(...polySegs(bodyOutline(e)));
        const t = placedText(e.label);
        if (t) {
          const an = bodyAnchors(e), { w } = bodySize(e);
          // inside the upper part of a block, clear of the weight arrow that starts at its centre
          if (e.kind === "block" && !e.rot && textWidth(t, fontSize) + pad <= w && pillH <= bodySize(e).h / 2) fixedAt(e.id, t, add(an.centre, { x: 0, y: -12 }), e.label);
          else {
            // too big to sit inside (or a particle): a pill that hugs the top edge and goes wherever there is room
            freeOn(e.id, t, bodyPoint(e, -w / 2, bodySize(e).h), bodyPoint(e, w / 2, bodySize(e).h), e.label);
          }
        }
        break;
      }
      case "force": shape.push(segOf(e.from, e.to)); break;
      case "dim": {
        const l = dimLine(e);
        shape.push(segOf(l.a, l.b));
        if (e.witness) { helpers.push(segOf(e.a, l.a), segOf(e.b, l.b)); }
        const t = placedText(e.label);
        if (t) {
          if (Math.abs(l.b.x - l.a.x) >= Math.abs(l.b.y - l.a.y)) fixedAt(e.id, t, { x: (l.a.x + l.b.x) / 2, y: (l.a.y + l.b.y) / 2 }, e.label);
          else freeOn(e.id, t, l.a, l.b, e.label);   // a vertical dimension: the text stands beside the line, on whichever side has room
        }
        break;
      }
      case "arc": {
        // an angle's label is steered by the same solver as a force's: it hugs the chord of the arc, on whichever side (or beyond whichever end) is clear
        const t = placedText(e.label);
        if (t) {
          let to = e.to; if (to < e.from) to += 360;
          const p0 = add(e.at, mul(dir(e.from), e.r)), p1 = add(e.at, mul(dir(to), e.r));
          const mid = add(e.at, mul(dir((e.from + to) / 2), e.r));
          const out = { x: mid.x - e.at.x, y: mid.y - e.at.y };
          // the pill's normal is the side of the chord facing away from the vertex
          const n = leftNormal(p0, p1);
          const flip = n.x * out.x + n.y * out.y < 0;
          freeOn(e.id, t, flip ? p1 : p0, flip ? p0 : p1, e.label);
        }
        break;
      }
      case "graph": {
        const ax = graphAxes(e);
        shape.push(segOf(...ax.x), segOf(...ax.y));
        for (let i = 1; i < e.curve.length; i++) shape.push(segOf(graphPoint(e, e.curve[i - 1]), graphPoint(e, e.curve[i])));
        const sub = (key: string, l: Lbl | undefined, at: Pt) => { const t = placedText(l); if (t) fixedAt(`${e.id}:${key}`, t, at, l); };
        // the axis titles stand beyond the arrowheads; the curve's label stands just past its end
        sub("x", e.xTitle, { x: ax.x[1].x + 8 + textWidth(placedText(e.xTitle) ?? "", fontSize) / 2 + pad / 2, y: ax.x[1].y });
        sub("y", e.yTitle, { x: ax.y[1].x + textWidth(placedText(e.yTitle) ?? "", fontSize) / 2 + 2, y: ax.y[1].y - pillH * 0.7 - 4 });
        // marks on an axis: where two would overlap, the later one steps along one row so both stay readable
        for (const axis of ["x", "y"] as const) {
          const list = (e.marks ?? []).map((m, i) => ({ m, i })).filter((q) => q.m.axis === axis).sort((p, q) => p.m.at - q.m.at);
          let prev: Rect | undefined;
          for (const { m, i } of list) {
            const t = placedText(m.label);
            if (!t) continue;
            const along = axis === "x" ? graphPoint(e, { x: m.at, y: 0 }) : graphPoint(e, { x: 0, y: m.at });
            const w = textWidth(t, fontSize) + pad;
            const at = axis === "x" ? { x: along.x, y: along.y + pillH * 0.75 + 6 } : { x: along.x - w / 2 - 10, y: along.y };
            if (prev && Math.abs(at.x - prev.x) < (w + prev.w) / 2 + 2 && Math.abs(at.y - prev.y) < (pillH + prev.h) / 2) {
              if (axis === "x") at.y = prev.y + pillH + 3; else at.y = prev.y - pillH - 3;
            }
            fixedAt(`${e.id}:m${i}`, t, at, m.label);
            prev = { x: at.x, y: at.y, w, h: pillH };
          }
        }
        for (const m of e.marks ?? []) if (m.guide) {
          if (m.axis === "x") helpers.push(segOf(graphPoint(e, { x: m.at, y: 0 }), graphPoint(e, { x: m.at, y: curveAt(e, m.at) })));
          else helpers.push(segOf(graphPoint(e, { x: 0, y: m.at }), graphPoint(e, { x: 1, y: m.at })));
        }
        if (e.area) {
          const poly = areaPolygon(e);
          // inside the shaded area, in the strip just above the axis where no curve can reach
          const t = placedText(e.area.label);
          if (t && poly.length) fixedAt(`${e.id}:area`, t, { x: (poly[0].x + poly[poly.length - 1].x) / 2, y: poly[0].y - pillH * 0.75 - 4 }, e.area.label);
        }
        const last = e.curve[e.curve.length - 1];
        const ct = placedText(e.curveLabel);
        if (ct && last) { const p = graphPoint(e, last); fixedAt(`${e.id}:curve`, ct, { x: p.x + 10 + textWidth(ct, fontSize) / 2, y: p.y - (p.y > e.y + e.h - pillH ? pillH * 0.9 : 0) }, e.curveLabel); }
        break;
      }
      case "bars": {
        const g = barRects(e);
        shape.push(segOf({ x: e.x, y: g.base }, { x: e.x + e.w, y: g.base }));
        for (const r of g.rects) shape.push(...polySegs([{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }]));
        e.columns.forEach((c, i) => { const t = placedText(c.name); if (t) fixedAt(`${e.id}:c${i}`, t, { x: g.colX[i], y: g.base + pillH * 0.75 + 4 }, c.name); });
        if (e.legend) ["GPE", "EPE", "KE", "Work"].forEach((name, i) => fixedAt(`${e.id}:leg${i}`, name, { x: e.x + e.w - 68 + textWidth(name, fontSize) / 2, y: e.y + 12 + i * 31 }));
        break;
      }
      case "marker": markers.push(e); break;
    }
  }

  // a name stands where its marker says (`dir`, `dist`), unless that spot is taken by a solid line or another label, when the solver finds it a clear one
  for (const e of markers) {
    const at = add(e.at, mul(dir(e.dir ?? 135), e.dist ?? fontSize * 0.9));
    const rect: Rect = { x: at.x, y: at.y, w: textWidth(e.name, fontSize) + pad, h: pillH };
    const inside = rect.x - rect.w / 2 >= 0 && rect.y - rect.h / 2 >= 0 && rect.x + rect.w / 2 <= scene.w && rect.y + rect.h / 2 <= scene.h;
    const clear = inside && !shape.some((s) => segHitsRect(s, rect, 1)) && !fixed.some((f) => Math.abs(f.rect.x - rect.x) < (f.rect.w + rect.w) / 2 && Math.abs(f.rect.y - rect.y) < (f.rect.h + rect.h) / 2);
    if (clear) { fixed.push({ id: e.id, text: e.name, rect, lx: at.x, ly: at.y, hasLeader: false }); continue; }
    const d = dir(e.dir ?? 135), far = add(e.at, mul(d, e.dist ?? fontSize * 0.9));
    // the solver gets a short segment at right angles to the preferred direction, so no dimension line can be taken for "the same line"
    const n = { x: -d.y, y: d.x };
    const a0 = add(far, mul(n, -6)), a1 = add(far, mul(n, 6));
    const nn = leftNormal(a0, a1);
    free.push({ id: e.id, text: e.name, item: { ax: a0.x, ay: a0.y, bx: a1.x, by: a1.y, nx: nn.x, ny: nn.y, w: rect.w, h: rect.h, free: true } });
  }

  // forces last, so every fixed rectangle is known before their labels are steered around it
  for (const e of scene.elements) {
    if (e.type !== "force") continue;
    const t = placedText(e.label);
    if (t) freeOn(e.id, t, e.from, e.to, e.label);
  }

  const sc: PlaceScene = {
    shape, helpers,
    fixed: fixed.map((f) => f.rect),
    bounds: { x0: 2, y0: 2, x1: scene.w - 2, y1: scene.h - 2 },
    reach: 10, cramp: 3,
    inside: () => false,
  };
  const labels: PlacedLabel[] = fixed.map((f) => ({ id: f.id, text: f.text, x: f.rect.x, y: f.rect.y, rect: f.rect, lx: f.lx, ly: f.ly, hasLeader: false, lbl: f.lbl }));
  if (free.length) {
    const spots = placePills(free.map((f) => f.item), sc);
    free.forEach((f, i) => {
      const o = spots[i];
      const rect = { x: o.x, y: o.y, w: f.item.w, h: f.item.h };
      labels.push({ id: f.id, text: f.text, x: o.x, y: o.y, rect, lx: o.lx, ly: o.ly, hasLeader: Math.hypot(o.x - o.lx, o.y - o.ly) > f.item.h * 1.4, lbl: f.lbl });
    });
  }

  // honest check: a label may not overlap another label or run off the picture; report it instead of hiding it
  const unplaced: string[] = [];
  for (let i = 0; i < labels.length; i++) {
    const r = labels[i].rect;
    const off = r.x - r.w / 2 < 0 || r.y - r.h / 2 < 0 || r.x + r.w / 2 > scene.w || r.y + r.h / 2 > scene.h;
    let bad = off ? "off the picture" : "";
    for (let j = 0; j < labels.length && !bad; j++) {
      if (i === j) continue;
      const q = labels[j].rect;
      if (Math.abs(r.x - q.x) < (r.w + q.w) / 2 && Math.abs(r.y - q.y) < (r.h + q.h) / 2) bad = `overlaps ${labels[j].id}`;
    }
    if (bad) unplaced.push(`${labels[i].id} (${bad})`);
  }
  // and a label may not sit on a solid line (a dimension's own label is meant to break its line, so dimensions are not checked)
  const owners = new Map(scene.elements.map((e) => [e.id, e]));
  const ownerOf = (id: string) => owners.get(id.split(":")[0]);
  // (the label of a dashed component may touch the weight arrow on a steep slope, where the two nearly coincide, so components are not checked either)
  const exempt = (id: string) => { const o = ownerOf(id); return o?.type === "dim" || (o?.type === "force" && o.kind === "component"); };
  const clashes = labels.filter((lb) => !exempt(lb.id) && shape.some((s) => segHitsRect(s, lb.rect, -2))).map((lb) => lb.id);
  const placement: Placement = { labels, unplaced, clashes, obstacles: shape, guides: helpers, owners };
  byScene.set(fontSize, placement);
  return placement;
}

/** What to draw at a step: the elements on show and the label for each (placed once for the whole scene, so nothing moves as parts are added). If the labels do not
 *  all fit cleanly at the size asked for, the text steps down a little (to 88%, 78%, then 68%) until they do: a label is made smaller, never dropped or left on a line. */
export function layoutScene(scene: Scene, opts: { step?: number; showAnswer?: boolean; fontSize: number }): Layout {
  const { step, showAnswer = false } = opts;
  let fontSize = opts.fontSize;
  let all = placeAll(scene, fontSize);
  for (const k of [0.88, 0.78, 0.68]) {
    if (!all.unplaced.length && !all.clashes.length) break;
    fontSize = opts.fontSize * k;
    all = placeAll(scene, fontSize);
  }
  const visible = scene.elements.filter((e) => visibleAt(e, step));
  const shown = new Set(visible.map((e) => e.id));
  const labels = all.labels.filter((l) => shown.has(l.id.split(":")[0])).map((l) => {
    const t = l.lbl ? lblText(l.lbl, showAnswer) : undefined;
    return t != null ? { ...l, text: t } : l;
  });
  return { fontSize, visible, labels, unplaced: all.unplaced, clashes: all.clashes, obstacles: all.obstacles, guides: all.guides };
}
