// Significant figures — which digit of a plain number string counts, and why. One source for the Rounding tool's digit boxes,
// its generators and the Teach decks (see specs/decks/sig-figs.md for the wording of the rules).
//
// Leading zero  : no non-zero digit BEFORE it       → never counts
// Trapped zero  : a non-zero digit before AND after → always counts
// Trailing zero : no non-zero digit AFTER it        → counts only if the number has a decimal point

export type SfKind = "sig" | "trapped" | "trailing" | "lead" | "trailingNo";
export type SfCell = { sep: true } | { sep?: false; ch: string; kind: SfKind };

/** Every digit of a plain number string ("0.00305", "120.00", "1200") classified; `sig` are the digits that count, in order. */
export function classifySf(raw: string): { cells: SfCell[]; sig: string[]; hasPoint: boolean } {
  const hasPoint = raw.includes(".");
  const digits = raw.replace(".", "");
  const firstNZ = digits.search(/[1-9]/);
  const lastNZ = digits.length - 1 - [...digits].reverse().findIndex(c => c !== "0");
  let di = 0;
  const cells: SfCell[] = [...raw].map(ch => {
    if (ch === ".") return { sep: true };
    const i = di++;
    const kind: SfKind = i < firstNZ ? "lead" : ch !== "0" ? "sig" : i < lastNZ ? "trapped" : hasPoint ? "trailing" : "trailingNo";
    return { ch, kind };
  });
  const sig = cells.filter((c): c is Extract<SfCell, { ch: string }> => !c.sep && c.kind !== "lead" && c.kind !== "trailingNo").map(c => c.ch);
  return { cells, sig, hasPoint };
}

/** Does this digit count as a significant figure? */
export const sfCounts = (kind: SfKind) => kind !== "lead" && kind !== "trailingNo";
