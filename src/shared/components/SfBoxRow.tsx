import { classifySf, type SfKind } from "../sigFigs";

// The number as a row of digit boxes, shared by the Rounding tool (Identify Sig. Figs) and the significant-figure Teach scenes so the
// two look identical. Marks (one per kind of zero, see specs/decks/sig-figs.md §3): significant digits blue; a trapped zero is
// blue with a GREEN underline; a trailing zero that counts is blue with an AMBER underline; leading zeros and placeholder
// zeros are grey. The caller decides what is shown at each moment through `decorate`.

export type SfTone = "plain" | "sig" | "off" | "pick";
export interface SfDecor {
  tone: SfTone;
  underline?: "green" | "amber";
  /** a small label under the box ("1st", "2nd") */
  label?: string;
  /** an orange ring (the zero being asked about) */
  ring?: boolean;
  /** a dashed outline (the digits before / after the zero being asked about) */
  dashed?: boolean;
}

const TONES: Record<SfTone, { bg: string; border: string; color: string }> = {
  sig: { bg: "#dbeafe", border: "#2563eb", color: "#1d4ed8" },
  off: { bg: "#f1f5f9", border: "#cbd5e1", color: "#94a3b8" },
  plain: { bg: "#ffffff", border: "#94a3b8", color: "#0f172a" },
  pick: { bg: "#fef3c7", border: "#d97706", color: "#b45309" },
};
export const SF_UNDERLINE = { green: "#16a34a", amber: "#d97706" };

/** The mark a digit of this kind gets once it has been classified (what "reveal" shows). */
export const sfDecorFor = (kind: SfKind): SfDecor =>
  kind === "lead" || kind === "trailingNo" ? { tone: "off" }
  : kind === "trapped" ? { tone: "sig", underline: "green" }
  : kind === "trailing" ? { tone: "sig", underline: "amber" }
  : { tone: "sig" };

export function SfBoxRow({ raw, decorate, size = 1 }: { raw: string; decorate: (digitIndex: number, kind: SfKind, ch: string) => SfDecor; size?: number }) {
  const { cells } = classifySf(raw);
  let di = -1;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 4 * size }}>
      {cells.map((c, i) => {
        if (c.sep) return <span key={i} style={{ fontSize: `${2 * size}rem`, fontWeight: 700, color: "#334155", alignSelf: "flex-end", lineHeight: 1.5, paddingBottom: 4 }}>.</span>;
        di++;
        const d = decorate(di, c.kind, c.ch);
        const tone = TONES[d.tone];
        return (
          <div key={i} style={{ position: "relative" }}>
            <div style={{
              width: `${2.6 * size}rem`, height: `${3.2 * size}rem`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${2 * size}rem`, fontWeight: 700,
              borderRadius: 8, border: `2px ${d.dashed ? "dashed" : "solid"} ${d.dashed ? "#d97706" : tone.border}`, background: tone.bg, color: tone.color,
              boxShadow: d.ring ? "0 0 0 4px #f59e0b" : undefined, transition: "background .35s ease, color .35s ease, border-color .35s ease",
            }}>{c.ch}</div>
            {d.underline && <div style={{ position: "absolute", left: 4, right: 4, top: "calc(100% + 5px)", height: 5, borderRadius: 3, background: SF_UNDERLINE[d.underline] }} />}
            {d.label && <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: d.underline ? 14 : 5, whiteSpace: "nowrap", fontSize: `${0.8 * size}rem`, fontWeight: 700, color: "#1d4ed8" }}>{d.label}</div>}
          </div>
        );
      })}
    </div>
  );
}
