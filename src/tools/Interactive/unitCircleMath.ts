// Pure maths for the Unit Circle tool: exact trig values for the 30° and 45° families and degree ↔ radian conversion.
// Exact values are plain strings ("−√3/2", "1/2", "0", "undefined") that the tool draws as stacked fractions.

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

const SIN_MAG: Record<number, string> = { 0: "0", 30: "1/2", 45: "√2/2", 60: "√3/2", 90: "1" };
const COS_MAG: Record<number, string> = { 0: "1", 30: "√3/2", 45: "√2/2", 60: "1/2", 90: "0" };
const TAN_MAG: Record<number, string> = { 0: "0", 30: "√3/3", 45: "1", 60: "√3", 90: "undefined" };

export type Family = "30" | "45" | "all";

export interface Special { deg: number; family: "30" | "45" | "both" }

/** Every multiple of 30° and of 45° in [0°, 360°): 16 points. */
export const SPECIALS: Special[] = (() => {
  const set = new Map<number, Special>();
  for (let d = 0; d < 360; d += 30) set.set(d, { deg: d, family: "30" });
  for (let d = 0; d < 360; d += 45) set.set(d, set.has(d) ? { deg: d, family: "both" } : { deg: d, family: "45" });
  return [...set.values()].sort((a, b) => a.deg - b.deg);
})();

export const inFamily = (s: Special, f: Family): boolean => f === "all" || s.family === "both" || s.family === f;
export const specialsFor = (f: Family): number[] => SPECIALS.filter((s) => inFamily(s, f)).map((s) => s.deg);

const norm = (deg: number): number => ((Math.round(deg) % 360) + 360) % 360;

/** Reference (acute) angle in 0–90 for a degree value. */
const refAngle = (d: number): number => (d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d);

export interface Exact { sin: string; cos: string; tan: string }

/** Exact sin, cos and tan of a multiple of 30° or 45°; null for any other angle. */
export function exactValues(deg: number): Exact | null {
  const d = norm(deg);
  if (!SPECIALS.some((s) => s.deg === d)) return null;
  const r = refAngle(d);
  const sinPos = d <= 180;
  const cosPos = d <= 90 || d >= 270;
  const signed = (mag: string, pos: boolean) => (mag === "0" || mag === "undefined" || pos ? mag : "−" + mag);
  return { sin: signed(SIN_MAG[r], sinPos), cos: signed(COS_MAG[r], cosPos), tan: signed(TAN_MAG[r], sinPos === cosPos) };
}

/** Decimal values (null where undefined, e.g. tan 90°). */
export function decimalValues(deg: number): { sin: number; cos: number; tan: number | null } {
  const rad = (deg * Math.PI) / 180;
  const s = Math.sin(rad), c = Math.cos(rad);
  return { sin: Math.abs(s) < 1e-12 ? 0 : s, cos: Math.abs(c) < 1e-12 ? 0 : c, tan: Math.abs(c) < 1e-9 ? null : s / c };
}

interface RadFrac { n: number; d: number }

/** Whole degrees as a reduced multiple of π: 150° → { n: 5, d: 6 } (5π/6). */
function radFraction(deg: number): RadFrac {
  const g = gcd(Math.round(deg), 180) || 1;
  return { n: Math.round(deg) / g, d: 180 / g };
}

/** Radians as text: 0, π/6, 5π/6, π, 3π/2, 2π, and negatives (−π/6). */
export function radText(deg: number): string {
  if (deg < 0) return `−${radText(-deg)}`;
  const { n, d } = radFraction(deg);
  if (n === 0) return "0";
  const top = n === 1 ? "π" : `${n}π`;
  return d === 1 ? top : `${top}/${d}`;
}

/** Working for degrees → radians: ["150° × π/180", "150π/180", "5π/6"] (last step skipped when nothing reduces). */
export function degToRadWorking(deg: number): string[] {
  const dd = Math.round(deg);
  if (dd === 0) return ["0° × π/180 = 0"];
  const unreduced = `${dd}π/180`;
  const reduced = radText(dd);
  const steps = [`${dd}° × π/180`, unreduced];
  if (reduced !== unreduced) steps.push(reduced);
  return steps;
}

/** Working for radians → degrees: ["5π/6 × 180/π", "5 × 180/6", "150°"]. */
export function radToDegWorking(deg: number): string[] {
  const dd = Math.round(deg);
  if (dd === 0) return ["0 × 180/π = 0°"];
  const { n, d } = radFraction(dd);
  const rad = radText(dd);
  return d === 1 ? [`${rad} × 180/π`, `${n} × 180`, `${dd}°`] : [`${rad} × 180/π`, `${n} × 180/${d}`, `${dd}°`];
}

// ── Inverse functions ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The principal range of each inverse function, in degrees: sin⁻¹ and tan⁻¹ give −90° to 90°, cos⁻¹ gives 0° to 180°. */
export const BRANCH: Record<"sin" | "cos" | "tan", [number, number]> = { sin: [-90, 90], cos: [0, 180], tan: [-90, 90] };

/** The principal value of the inverse function at a given angle: sin⁻¹(sin θ), cos⁻¹(cos θ) or tan⁻¹(tan θ), in degrees (null where tan is undefined).
 *  It equals θ only when θ lies in the inverse's range; otherwise it is the other angle with the same value. */
export function principalDeg(fn: "sin" | "cos" | "tan", thetaDeg: number): number | null {
  const t = (thetaDeg * Math.PI) / 180;
  let a: number;
  if (fn === "sin") a = Math.asin(Math.sin(t));
  else if (fn === "cos") a = Math.acos(Math.cos(t));
  else { const c = Math.cos(t); if (Math.abs(c) < 1e-9) return null; a = Math.atan(Math.sin(t) / c); }
  const d = (a * 180) / Math.PI;
  const r = Math.round(d);
  return Math.abs(d - r) < 1e-6 ? (r === 0 ? 0 : r) : d;
}
