import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

/** The text size each element is actually drawn at, reported by the slide as it fits its text. The editor reads it so the size
 *  control shows what is on screen and the first press of bigger / smaller starts from there, not from the automatic maximum. */
const sizes = new Map<string, number>();
const listeners = new Set<() => void>();

function reportShownSize(id: string, size: number | null): void {
  const next = size === null ? undefined : Math.round(size);
  if (sizes.get(id) === next) return;
  if (next === undefined) sizes.delete(id); else sizes.set(id, next);
  listeners.forEach((l) => l());
}

export function useShownSize(id: string | undefined): number | undefined {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => (id ? sizes.get(id) : undefined),
    () => undefined,
  );
}

/** The editor's canvas asks its elements to report the size they are drawn at (thumbnails and previews do not, so they never clash). */
export const ReportSizesCtx = createContext(false);

/** The editor is showing answers on every book activity and grid (its Questions / Answers switch), so their answer size can be set while looking at them. */
export const ForceAnswersCtx = createContext(false);

/** Tells the editor the text size an element is really drawn at, so its size control starts from what is on screen. */
export function useReportSize(id: string | undefined, size: number | null): void {
  const on = useContext(ReportSizesCtx);
  useEffect(() => {
    if (!on || !id || size === null) return;
    reportShownSize(id, size);
    return () => reportShownSize(id, null);
  }, [on, id, size]);
}
