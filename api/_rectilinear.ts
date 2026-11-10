// Portable dimensions for authored rectilinear questions; browser and API share validation.
export interface RectilinearSpec {
  version: 1;
  shape: "L" | "T" | "stairs3";
  width: number; height: number; cutWidth: number; cutHeight: number;
  method: "split" | "subtract";
  orientation: number;
  reducedLabels: boolean;
  /** Full prompts, the split only, or independent work. Applies to the printed sheet. */
  scaffold: "full" | "split" | "none";
}
export function isRectilinearSpec(value: unknown): value is RectilinearSpec {
  if (!value || typeof value !== "object") return false;
  const s = value as RectilinearSpec;
  if (s.version !== 1 || !["L", "T", "stairs3"].includes(s.shape) || !["split", "subtract"].includes(s.method)
    || !["full", "split", "none"].includes(s.scaffold) || typeof s.reducedLabels !== "boolean"
    || !Number.isInteger(s.orientation) || s.orientation < 0 || s.orientation > 7) return false;
  if (![s.width, s.height, s.cutWidth, s.cutHeight].every(n => Number.isInteger(n) && n >= 1 && n <= 100)) return false;
  return s.cutWidth * (s.shape === "L" ? 1 : 2) < s.width && s.cutHeight * (s.shape === "stairs3" ? 2 : 1) < s.height;
}
export const defaultRectilinear = (): RectilinearSpec => ({ version: 1, shape: "L", width: 8, height: 6, cutWidth: 3, cutHeight: 2, method: "split", orientation: 0, reducedLabels: true, scaffold: "full" });
