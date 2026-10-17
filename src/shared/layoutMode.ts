import { useEffect, useState } from "react";

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

const read = (): { mode: LayoutMode; portrait: boolean } => {
  if (typeof window === "undefined") return { mode: "laptop", portrait: false };
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return { mode: layoutModeOf(window.innerWidth, coarse), portrait: window.innerHeight > window.innerWidth };
};

/** The live layout mode (follows resizing and rotating) and whether the window is portrait. */
export function useLayoutMode(): { mode: LayoutMode; portrait: boolean; phone: boolean; tablet: boolean; laptop: boolean } {
  const [state, setState] = useState(read);
  useEffect(() => {
    const on = () => setState((prev) => { const next = read(); return prev.mode === next.mode && prev.portrait === next.portrait ? prev : next; });
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    const coarse = window.matchMedia("(pointer: coarse)");
    coarse.addEventListener("change", on);
    return () => { window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); coarse.removeEventListener("change", on); };
  }, []);
  return { ...state, phone: state.mode === "phone", tablet: state.mode === "tablet", laptop: state.mode === "laptop" };
}
