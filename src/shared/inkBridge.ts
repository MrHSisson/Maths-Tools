// Lets a page read and replace what is drawn on the app-wide pen layer (InkOverlay), which keeps its strokes in screen coordinates.
// A deck uses it to keep each slide's writing while the deck is open: it reads the strokes when you leave a slide and puts them back
// when you return, converting to and from slide units so they stay put when the window or full screen changes.
import type { Stroke } from "./components/BoardTools";

export const getInk = (): Stroke[] => { const d = { strokes: [] as Stroke[] }; window.dispatchEvent(new CustomEvent("mt-ink-get", { detail: d })); return d.strokes; };
export const setInk = (strokes: Stroke[]): void => { window.dispatchEvent(new CustomEvent("mt-ink-set", { detail: strokes })); };

/** The rectangle a slide of `unitsWide` units occupies on screen: strokes convert with it. */
export interface InkFrame { left: number; top: number; width: number }
const toUnits = (frame: InkFrame, unitsWide: number) => unitsWide / frame.width;
export const strokesToSlide = (strokes: Stroke[], frame: InkFrame, unitsWide: number): Stroke[] => {
  const k = toUnits(frame, unitsWide);
  return strokes.map((s) => ({ ...s, ...(s.width !== undefined ? { width: s.width * k } : {}), points: s.points.map((p) => ({ x: (p.x - frame.left) * k, y: (p.y - frame.top) * k })) }));
};
export const strokesFromSlide = (strokes: Stroke[], frame: InkFrame, unitsWide: number): Stroke[] => {
  const k = 1 / toUnits(frame, unitsWide);
  return strokes.map((s) => ({ ...s, ...(s.width !== undefined ? { width: s.width * k } : {}), points: s.points.map((p) => ({ x: p.x * k + frame.left, y: p.y * k + frame.top })) }));
};
