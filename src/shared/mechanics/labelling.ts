// Mechanics diagrams: where every label goes. One function, `layoutScene`, turns a scene (at a step, with the answer shown or not) into the
// things a renderer needs: what is visible, the obstacles, and a spot for each label. It reuses the Perimeter & Area placement solver
// (shared/shapes/labels.ts) instead of a second one: a force's label is a "free" pill that hugs its arrow, everything else is a fixed rectangle
// the solver steers around. The renderer never drops a label: a scene that cannot place one reports it (`unplaced`).
import { placePills, type PillIn, type Rect, type Seg, type Scene as PlaceScene } from "../shapes/labels";
import { bodyAnchors, bodyOutline, bodyPoint, bodySize } from "./bodies";
import { add, dir, leftNormal, lblText, mul, visibleAt, type Arc, type Dim, type Pt, type Scene, type SceneElement } from "./scene";

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
}

export interface Layout {
  visible: SceneElement[];
  labels: PlacedLabel[];
  /** Ids of labels that overlap something after placement (should be empty; a test asserts it). */
  unplaced: string[];
  /** Solid lines (surfaces, outlines, arrows, dimension lines): a label must not sit on these. */
  obstacles: Seg[];
  /** Dashed level lines and the stand-ins for hatching: a label avoids them if it can. */
  guides: Seg[];
}

const segOf = (a: Pt, b: Pt): Seg => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
const polySegs = (pts: Pt[]): Seg[] => pts.map((p, i) => segOf(p, pts[(i + 1) % pts.length]));

/** Where an arc's label sits: beyond the arc, on its bisector. */
const arcLabelPoint = (a: Arc, gap: number): Pt => {
  let to = a.to; if (to < a.from) to += 360;
  return add(a.at, mul(dir((a.from + to) / 2), a.r + gap));
};

export function layoutScene(scene: Scene, opts: { step?: number; showAnswer?: boolean; fontSize: number }): Layout {
  const { step, showAnswer = false, fontSize } = opts;
  const visible = scene.elements.filter((e) => visibleAt(e, step));
  const shape: Seg[] = [];
  const helpers: Seg[] = [];
  const fixed: { id: string; text: string; rect: Rect; lx: number; ly: number; hasLeader: boolean }[] = [];
  const free: { id: string; text: string; item: PillIn }[] = [];
  const pillH = fontSize * 1.25;
  const pad = 6;

  const fixedAt = (id: string, text: string, at: Pt) =>
    fixed.push({ id, text, rect: { x: at.x, y: at.y, w: textWidth(text, fontSize) + pad, h: pillH }, lx: at.x, ly: at.y, hasLeader: false });

  for (const e of visible) {
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
      case "body": {
        (e.ghost ? helpers : shape).push(...polySegs(bodyOutline(e)));
        const t = lblText(e.label, showAnswer);
        if (t) {
          const an = bodyAnchors(e), { w } = bodySize(e);
          // inside the upper part of a block, clear of the weight arrow that starts at its centre
          if (e.kind === "block" && textWidth(t, fontSize) + pad <= w && pillH <= bodySize(e).h / 2) fixedAt(e.id, t, add(an.centre, { x: 0, y: -12 }));
          else {
            // too big to sit inside (or a particle): a pill that hugs the top edge and goes wherever there is room
            const left = bodyPoint(e, -w / 2, bodySize(e).h), right = bodyPoint(e, w / 2, bodySize(e).h);
            const n = leftNormal(left, right);
            free.push({ id: e.id, text: t, item: { ax: left.x, ay: left.y, bx: right.x, by: right.y, nx: n.x, ny: n.y, w: textWidth(t, fontSize) + pad, h: pillH, free: true } });
          }
        }
        break;
      }
      case "force": shape.push(segOf(e.from, e.to)); break;
      case "dim": {
        const l = dimLine(e);
        shape.push(segOf(l.a, l.b));
        if (e.witness) { helpers.push(segOf(e.a, l.a), segOf(e.b, l.b)); }
        const t = lblText(e.label, showAnswer);
        if (t) {
          if (Math.abs(l.b.x - l.a.x) >= Math.abs(l.b.y - l.a.y)) fixedAt(e.id, t, { x: (l.a.x + l.b.x) / 2, y: (l.a.y + l.b.y) / 2 });
          else {
            // a vertical dimension: the text cannot break the line sensibly, so it stands beside it, on whichever side has room
            const n = leftNormal(l.a, l.b);
            free.push({ id: e.id, text: t, item: { ax: l.a.x, ay: l.a.y, bx: l.b.x, by: l.b.y, nx: n.x, ny: n.y, w: textWidth(t, fontSize) + pad, h: pillH, free: true } });
          }
        }
        break;
      }
      case "arc": {
        const t = lblText(e.label, showAnswer);
        if (t) fixedAt(e.id, t, arcLabelPoint(e, fontSize * 0.55 + textWidth(t, fontSize) / 2));
        break;
      }
      case "marker": {
        const at = add(e.at, mul(dir(e.dir ?? 135), e.dist ?? fontSize * 0.9));
        fixedAt(e.id, e.name, at);
        break;
      }
    }
  }

  // forces last, so every fixed rectangle is known before their labels are steered around it
  for (const e of visible) {
    if (e.type !== "force") continue;
    const t = lblText(e.label, showAnswer);
    if (!t) continue;
    const n = leftNormal(e.from, e.to);
    free.push({ id: e.id, text: t, item: { ax: e.from.x, ay: e.from.y, bx: e.to.x, by: e.to.y, nx: n.x, ny: n.y, w: textWidth(t, fontSize) + pad, h: pillH, free: true } });
  }

  const sc: PlaceScene = {
    shape, helpers,
    fixed: fixed.map((f) => f.rect),
    bounds: { x0: 2, y0: 2, x1: scene.w - 2, y1: scene.h - 2 },
    reach: 10, cramp: 3,
    inside: () => false,
  };
  const labels: PlacedLabel[] = fixed.map((f) => ({ id: f.id, text: f.text, x: f.rect.x, y: f.rect.y, rect: f.rect, lx: f.lx, ly: f.ly, hasLeader: false }));
  if (free.length) {
    const spots = placePills(free.map((f) => f.item), sc);
    free.forEach((f, i) => {
      const o = spots[i];
      const rect = { x: o.x, y: o.y, w: f.item.w, h: f.item.h };
      labels.push({ id: f.id, text: f.text, x: o.x, y: o.y, rect, lx: o.lx, ly: o.ly, hasLeader: Math.hypot(o.x - o.lx, o.y - o.ly) > f.item.h * 1.4 });
    });
  }

  // honest check: a label may not overlap another label or run off the picture; report it instead of hiding it
  const unplaced: string[] = [];
  const all = labels;
  for (let i = 0; i < all.length; i++) {
    const r = all[i].rect;
    const off = r.x - r.w / 2 < 0 || r.y - r.h / 2 < 0 || r.x + r.w / 2 > scene.w || r.y + r.h / 2 > scene.h;
    let hit = off ? "off the picture" : "";
    for (let j = 0; j < all.length && !hit; j++) {
      if (i === j) continue;
      const q = all[j].rect;
      if (Math.abs(r.x - q.x) < (r.w + q.w) / 2 && Math.abs(r.y - q.y) < (r.h + q.h) / 2) hit = `overlaps ${all[j].id}`;
    }
    if (hit) unplaced.push(`${all[i].id} (${hit})`);
  }
  return { visible, labels, unplaced, obstacles: shape, guides: helpers };
}
