// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

// KaTeX is bundled from npm rather than loaded from a CDN, so maths rendering
// keeps working on school networks that block third-party CDNs. It is
// dynamically imported so it stays out of the landing-page chunk, and is
// assigned to window.katex for compatibility with existing call sites.
export const loadKaTeX = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (promise) return promise;
    promise = (async () => {
      if (typeof window === "undefined" || w().katex) return;
      const [katex] = await Promise.all([
        import("katex"),
        import("katex/dist/katex.min.css"),
      ]);
      w().katex = katex.default ?? katex;
    })();
    return promise;
  };
})();
