// "Something is full screen" flag: while any full-screen view (worksheet, whiteboard, worked example, Teach present, Depth present) is up,
// <html> carries data-mt-fs, and chrome that would cover the content (the lesson step bar) hides itself with CSS (`html[data-mt-fs] .mt-lesson-bar`).
import { useEffect } from "react";

let open = 0;
export function useFullscreenFlag(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    open++;
    document.documentElement.dataset.mtFs = "1";
    return () => {
      open = Math.max(0, open - 1);
      if (open === 0) delete document.documentElement.dataset.mtFs;
    };
  }, [active]);
}
