// Swiping through a deck on a phone: a swipe from right to left goes forward a slide, from left to right goes back. A phone held upright
// shows the deck turned on its side (the slide is always drawn landscape), so the same swipe is a different movement of the finger on the
// glass: `turned` says the page has been turned a quarter turn clockwise, and then the swipe the person means along the slide's width is a
// swipe up or down the screen. Pure logic; the player reads the touches.

export type Swipe = "forward" | "back" | null;

/** A swipe is a quick, mostly sideways (in the slide's own terms) movement of at least `MIN_PX`. */
const SWIPE_MIN_PX = 50;
const SWIPE_MAX_MS = 800;
const SIDEWAYS_RATIO = 1.5;

/** Which way a touch went, from where it began and ended on the screen (`dx` to the right, `dy` down), how long it took, and whether the slide is turned. */
export function swipeOf(dx: number, dy: number, ms: number, turned = false): Swipe {
  // a page turned a quarter turn clockwise: its right is the screen's down, and its down is the screen's left
  const across = turned ? dy : dx;      // along the slide's width: negative is towards the slide's left (right to left)
  const along = turned ? -dx : dy;      // along the slide's height
  if (ms > SWIPE_MAX_MS || Math.abs(across) < SWIPE_MIN_PX || Math.abs(across) < Math.abs(along) * SIDEWAYS_RATIO) return null;
  return across < 0 ? "forward" : "back";
}
