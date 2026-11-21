// Shared bits of the Energy builders: mass and speed written in the unit a question gives them, and the way a speed is shown.
import { fromSI, numText, type Unit } from "../../../shared/mechanics";

export type SpeedUnit = "m s⁻¹" | "km h⁻¹";
export type MassUnit = "kg" | "g" | "tonne";
/** a speed in m s⁻¹ as a number in the unit a question gives it (km h⁻¹ is × 3.6, exactly for the multiples of 18 the generators use) */
export const speedIn = (v: number, unit: SpeedUnit): number => Number((unit === "km h⁻¹" ? v * 3.6 : v).toPrecision(12));
export const massIn = (m: number, unit: MassUnit): number => Number(fromSI(m, unit as Unit).toPrecision(12));
export const speedText = (v: number, unit: SpeedUnit): string => `${numText(speedIn(v, unit))} ${unit}`;
