import { useEffect, useState, useSyncExternalStore } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// The three screen sizes every shell is designed for (CLAUDE.md "Always consider three screen sizes"):
//   phone  — up to 640px wide
//   tablet — 641–1180px wide, plus any touch-first device (`pointer: coarse`) up to 1400px (an iPad Pro in landscape is 1366px)
//   laptop — everything else
// A tablet gets the PHONE's interaction model (click-through start screens, the fixed bottom action bar, big touch targets) laid out
// for landscape and the extra width; it is not a shrunken laptop. ToolShell and DecisionShell both read this one hook.
// ═══════════════════════════════════════════════════════════════════════════

export type LayoutMode = "phone" | "tablet" | "laptop";

export const PHONE_MAX = 640;
export const TABLET_MAX = 1180;
export const TOUCH_TABLET_MAX = 1400;

/** the mode for a window of this width, and whether the primary pointer is a finger */
export function layoutModeOf(width: number, coarsePointer = false): LayoutMode {
  if (width <= PHONE_MAX) return "phone";
  if (width <= TABLET_MAX) return "tablet";
  if (coarsePointer && width <= TOUCH_TABLET_MAX) return "tablet";
  return "laptop";
}

// ── "View as": the landing-page menu lets a teacher treat this device as a phone, tablet or laptop (to preview, or when a device guesses wrong).
// Kept per device (localStorage), shared across tabs, and applied by every shell through useLayoutMode(). It changes the layout logic, not the
// browser's own width, so the CSS that depends on the real width (e.g. Tailwind's lg:) still follows the actual window.
const VIEW_KEY = "mt-view-mode";
const VIEW_EVT = "mt-view-mode-change";
export type ViewOverride = LayoutMode | null; // null = automatic

export const getViewOverride = (): ViewOverride => {
  try { const v = localStorage.getItem(VIEW_KEY); return v === "phone" || v === "tablet" || v === "laptop" ? v : null; } catch { return null; }
};
export const setViewOverride = (v: ViewOverride): void => {
  try { if (v) localStorage.setItem(VIEW_KEY, v); else localStorage.removeItem(VIEW_KEY); } catch { /* private mode etc. */ }
  window.dispatchEvent(new Event(VIEW_EVT));
};
const subscribeView = (cb: () => void): (() => void) => {
  window.addEventListener(VIEW_EVT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(VIEW_EVT, cb); window.removeEventListener("storage", cb); };
};
export const useViewOverride = (): ViewOverride => useSyncExternalStore(subscribeView, getViewOverride, () => null);

/** Heights at or under this count as a short screen (a laptop, a projector at 720p). */
export const SHORT_MAX = 820;
/** The Computer Science shell's own cut-off for its stacked, single-column layout. */
export const NARROW_MAX = 767;

const read = (): { mode: LayoutMode; portrait: boolean; short: boolean; narrowWidth: boolean } => {
  if (typeof window === "undefined") return { mode: "laptop", portrait: false, short: false, narrowWidth: false };
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return {
    mode: layoutModeOf(window.innerWidth, coarse), portrait: window.innerHeight > window.innerWidth,
    short: window.innerHeight <= SHORT_MAX, narrowWidth: window.innerWidth <= NARROW_MAX,
  };
};

/** The live layout mode (follows resizing and rotating) and whether the window is portrait.
 *  `short` is the real window height (≤ 820px) and is never overridden. `narrow` is the stacked single-column layout
 *  (≤ 767px wide, or "View as" phone) used by the Computer Science shell. */
export function useLayoutMode(): { mode: LayoutMode; portrait: boolean; short: boolean; narrow: boolean; phone: boolean; tablet: boolean; laptop: boolean } {
  const [state, setState] = useState(read);
  useEffect(() => {
    const on = () => setState((prev) => { const next = read(); return prev.mode === next.mode && prev.portrait === next.portrait && prev.short === next.short && prev.narrowWidth === next.narrowWidth ? prev : next; });
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    const coarse = window.matchMedia("(pointer: coarse)");
    coarse.addEventListener("change", on);
    return () => { window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); coarse.removeEventListener("change", on); };
  }, []);
  const override = useViewOverride();
  const mode = override ?? state.mode;
  const narrow = override ? override === "phone" : state.narrowWidth;
  return { mode, portrait: state.portrait, short: state.short, narrow, phone: mode === "phone", tablet: mode === "tablet", laptop: mode === "laptop" };
}
