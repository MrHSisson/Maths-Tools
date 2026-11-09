import type { DifficultyLevel } from "./types";

// A saved ToolShell question as the saved list keeps it: the same recipe the print basket uses (tab, level, options, seed — see
// decision/printBasket.ts), with the shell's settings written into the options record under a prefix so one list holds both shells' questions.
//   v:<key>  a Question Option switch ("1" / "0")      m:<key>  a multi-select option ("1" / "0")      dd  the dropdown's value
// Pure logic; the shell decides when to save and restore.

interface ToolSettings { vars: Record<string, boolean>; ms: Record<string, boolean>; dd: string }

export const levelNumber = (l: DifficultyLevel): number => Number(l.slice(-1));
export const levelKey = (n: number): DifficultyLevel => `level${n}` as DifficultyLevel;

export function encodeToolOptions({ vars, ms, dd }: ToolSettings): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) out[`v:${k}`] = v ? "1" : "0";
  for (const [k, v] of Object.entries(ms)) out[`m:${k}`] = v ? "1" : "0";
  if (dd) out.dd = dd;
  return out;
}

export function decodeToolOptions(options: Record<string, string>): ToolSettings {
  const vars: Record<string, boolean> = {}, ms: Record<string, boolean> = {};
  let dd = "";
  for (const [k, v] of Object.entries(options)) {
    if (k.startsWith("v:")) vars[k.slice(2)] = v === "1";
    else if (k.startsWith("m:")) ms[k.slice(2)] = v === "1";
    else if (k === "dd") dd = v;
  }
  return { vars, ms, dd };
}
