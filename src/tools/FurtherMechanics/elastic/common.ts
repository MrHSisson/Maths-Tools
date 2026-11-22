// Shared bits of the Elastic builders: a length written in metres or centimetres, and the words for a spring or a string.
import { fromSI } from "../../../shared/mechanics";

export type LenUnit = "m" | "cm";
/** a length in m as a number in the unit a question gives it */
export const lenIn = (x: number, unit: LenUnit): number => Number(fromSI(x, unit).toPrecision(12));
/** "A light spring" or "An elastic string" */
export const thing = (kind: "spring" | "string"): string => (kind === "spring" ? "A light spring" : "An elastic string");
export const theThing = (kind: "spring" | "string"): string => (kind === "spring" ? "the spring" : "the string");
