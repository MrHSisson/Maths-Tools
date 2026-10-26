import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AnyQuestion } from "./types";

/** Worksheet text sizes, smallest to largest (Tailwind classes). */
export const WORKSHEET_FONT_SIZES = ["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl"];

/**
 * Fullscreen worksheet auto-fit. Starts from the largest size, waits a moment for the maths to draw, then steps down (before the next
 * paint) until the sheet is no taller than the screen. It only ever steps down, so it settles; anything that changes the sheet starts it
 * again. Showing or hiding answers never fits again: while fitting, every cell is drawn as its answer (`fsProbe`, the tallest it gets),
 * so the size never has to change afterwards. Pressing a text-size button turns auto-fit off (`setFsAuto(false)`).
 */
export function useWorksheetFit({ active, cols, effCols, worksheet, showAnswers }: {
  active: boolean; cols: number; effCols: number; worksheet: AnyQuestion[]; showAnswers: boolean;
}) {
  const [fsAuto, setFsAuto] = useState(true);       // text size fits the screen by itself until a text-size button is pressed
  const [fsAutoIdx, setFsAutoIdx] = useState(5);
  const fsScrollRef = useRef<HTMLDivElement>(null);
  const [fsFitKey, setFsFitKey] = useState(0);      // bumped when the window resizes, to fit again from the largest size
  const [fsSettled, setFsSettled] = useState(false);
  const [fsProbe, setFsProbe] = useState(false);   // while fitting, every cell is drawn as its answer (the tallest it gets), so the size never has to change when answers are shown
  const [fsFit, setFsFit] = useState(false);   // true once the text size fits: the rows then split the screen exactly (equal cells)
  // does the sheet overflow the screen, or does any cell's content overflow its own cell (past its padding — a tall fraction answer may use it)?
  const fsOverflows = (sc: HTMLElement) => sc.scrollHeight > sc.clientHeight + 2 || [...sc.querySelectorAll<HTMLElement>(".group")].some(c => c.scrollHeight > c.clientHeight + 12);
  useEffect(() => { if (active) setFsAuto(true); else setFsProbe(false); }, [active]);
  useEffect(() => {
    if (!active || !fsAuto) return;
    setFsAutoIdx(WORKSHEET_FONT_SIZES.length - 1);
    setFsSettled(false);
    setFsFit(false);
    setFsProbe(true);
    const t = window.setTimeout(() => setFsSettled(true), 250);
    return () => window.clearTimeout(t);
  }, [active, fsAuto, cols, effCols, worksheet, fsFitKey]);
  useLayoutEffect(() => {
    if (!active || !fsAuto || !fsSettled) return;
    const sc = fsScrollRef.current;
    if (!sc) return;
    if (fsOverflows(sc)) { if (fsAutoIdx > 0) setFsAutoIdx(fsAutoIdx - 1); else { setFsFit(false); setFsProbe(false); } }
    else { setFsFit(true); setFsProbe(false); }
  }, [active, fsAuto, fsSettled, fsAutoIdx]);
  const answersToggledAt = useRef(0);
  useLayoutEffect(() => { answersToggledAt.current = Date.now(); }, [showAnswers]);
  // Showing / hiding the answers does NOT fit again: the size stays exactly as it was (flipping cells one at a time never changed it either).
  useEffect(() => {
    if (!active || !fsAuto || !fsSettled) return;
    const sc = fsScrollRef.current;
    if (!sc?.firstElementChild) return;
    const ro = new ResizeObserver(() => { if (Date.now() - answersToggledAt.current < 600) return; if (fsOverflows(sc)) setFsAutoIdx(i => Math.max(0, i - 1)); });
    ro.observe(sc.firstElementChild);
    return () => ro.disconnect();
  }, [active, fsAuto, fsSettled]);
  useEffect(() => {
    if (!active) return;
    const on = () => setFsFitKey(k => k + 1);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [active]);
  return { fsAuto, setFsAuto, fsAutoIdx, fsScrollRef, fsSettled, fsProbe, fsFit };
}
