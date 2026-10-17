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

/** Round a plain number string to `sf` significant figures, exactly (digit strings, round half up). Digits before the decimal point
 *  after the last kept digit become zeros (placeholders); digits after it are dropped; zeros at the end of a decimal answer are kept
 *  (4.96 to 2 s.f. is "5.0"); a carry can add a digit (9.96 to 2 s.f. is "10"). */
export function roundToSf(raw: string, sf: number): string {
  const [ip, fp = ""] = raw.split(".");
  const digits = ip + fp, ptr0 = ip.length;
  const first = digits.search(/[1-9]/);
  const keep = first + sf;
  const head = digits.slice(0, keep);
  const up = digits[keep] !== undefined && digits[keep] >= "5";
  // add one to the kept digits when rounding up (carrying through 9s)
  const bumped = [...head];
  if (up) {
    let i = bumped.length - 1;
    while (i >= 0 && bumped[i] === "9") bumped[i--] = "0";
    if (i >= 0) bumped[i] = String(Number(bumped[i]) + 1); else bumped.unshift("1");
  }
  const kept = bumped.join("");
  const shift = kept.length > head.length ? 1 : 0;
  const out = kept.padEnd(Math.max(digits.length, keep) + shift, "0");
  const ptr = ptr0 + shift;
  const len = Math.max(keep + shift, ptr);
  const body = out.slice(0, len).padEnd(len, "0");
  return len > ptr ? `${body.slice(0, ptr)}.${body.slice(ptr)}` : body;
}
