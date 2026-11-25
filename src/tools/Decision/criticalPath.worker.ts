// Makes Critical Path questions off the page's thread, so the page stays free to show its spinner (see criticalPathAsync.ts).
import { generate } from "./criticalPathGenerate";
import { generateSeeded } from "../../shared/seededGenerate";

self.onmessage = (e: MessageEvent<{ id: number; level: number; ctx?: Parameters<typeof generate>[1] }>) => {
  const { id, level, ctx } = e.data;
  try {
    self.postMessage({ id, problem: generateSeeded(() => generate(level, ctx)) });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
