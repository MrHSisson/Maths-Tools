// Shared bits of the Power builders: a power written in W or kW, the sizes of a vehicle, and the way a context supplies its numbers.
import { type MechContext, type Range, inRange } from "../../../shared/mechanics/contexts";

export type PowerUnit = "W" | "kW";
/** x (in W or J) as a number in W or kW (J or kJ): the unit a question gives it in */
export const kilo = (x: number, k: boolean): number => Number((k ? x / 1000 : x).toPrecision(12));
export const powerIn = (P: number, unit: PowerUnit): number => kilo(P, unit === "kW");

/** the realistic sizes of a vehicle (or of a generic one when the question has no story): its mass (kg), a resistance (N), and a speed (m s⁻¹) */
interface VehicleSizes { mass: Range; resist: Range; speed: Range }
const GENERIC: VehicleSizes = { mass: [500, 2000, 100], resist: [200, 1200, 50], speed: [5, 30, 1] };

/** a resistance is about half the largest force a context drives with, rounded to its step */
export function vehicleSizes(c: MechContext | undefined): VehicleSizes {
  if (!c) return GENERIC;
  const [lo, hi, step] = c.force;
  return { mass: c.mass, resist: [lo, Math.max(lo + 4 * step, Math.round(hi / 2 / step) * step), step], speed: c.speed ?? [2, 20, 1] };
}

/** a vehicle's speed in m s⁻¹: a multiple of 5 m s⁻¹ (18 km h⁻¹) when the question gives km h⁻¹, so the conversion is exact; a cyclist stays at or under 36 km h⁻¹ */
export function vehicleSpeed(c: MechContext | undefined, km: boolean, sizes: VehicleSizes): number {
  if (!km) return inRange(sizes.speed);
  const [lo, hi] = sizes.speed;
  const top = c?.id === "cyclist" ? Math.min(hi, 10) : hi;
  return 5 * inRange([Math.max(1, Math.ceil(lo / 5)), Math.max(2, Math.floor(top / 5)), 1]);
}

/** a power a context could realistically work at (W) */
export const POWER_RANGE: Record<string, Range> = {
  cyclist: [100, 400, 10], climber: [100, 600, 10], crane: [5000, 60000, 1000], car: [10000, 90000, 1000],
  van: [10000, 60000, 1000], truck: [30000, 200000, 5000], particle: [100, 5000, 100],
};
