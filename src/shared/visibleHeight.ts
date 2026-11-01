import { useLayoutEffect } from "react";

/** Keeps the CSS variable `--app-h` at the height of the screen the person can actually see. On a tablet or phone `100vh` is the page with the
 *  browser's address bar hidden, so a full-height page is taller than the visible area and its bottom (the end of a slide) is pushed off-screen;
 *  `window.innerHeight` follows the bars as they show and hide. The `.h-app` class (index.css) uses it. */
export function useVisibleHeight(): void {
  useLayoutEffect(() => {
    const set = () => document.documentElement.style.setProperty("--app-h", `${Math.round(window.innerHeight)}px`);
    set();
    window.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    return () => { window.removeEventListener("resize", set); window.removeEventListener("orientationchange", set); document.documentElement.style.removeProperty("--app-h"); };
  }, []);
}
