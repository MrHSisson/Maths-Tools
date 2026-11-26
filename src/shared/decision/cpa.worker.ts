// Makes Critical Path questions off the page's thread, so the page stays free to show its spinner (see cpaAsync.ts).
import { generate } from "./cpaGenerate";
import { generateSeeded } from "../seededGenerate";

self.onmessage = (e: MessageEvent<{ id: number; level: number; ctx?: Parameters<typeof generate>[1] }>) => {
  const { id, level, ctx } = e.data;
  try {
    self.postMessage({ id, problem: generateSeeded(() => generate(level, ctx)) });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
