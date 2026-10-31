import type { CSSProperties } from "react";

/** The one look for every button drawn on a slide (Show answers, New question, Show working, Previous / Next question, Print…): the same
 *  text size, padding and border everywhere, so no slide has a button out of scale with the next. The size is in slide units (the canvas
 *  is 1600 wide). */
export const SLIDE_BUTTON_PX = 26;
export const slideButton: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 10, padding: "0 22px", height: 48, boxSizing: "border-box", borderRadius: 16, border: "2px solid #cbd5e1",
  background: "white", fontWeight: 600, fontSize: SLIDE_BUTTON_PX, lineHeight: 1.2, color: "#334155",
};
