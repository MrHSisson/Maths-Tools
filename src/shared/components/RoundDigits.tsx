import { Fragment } from "react";

// Rounding's worked-example picture, shared so a deck slide can draw it too (Rounding tool and decks).
/** The number as digit boxes: rounding digit (blue), decider (orange), the rest greyed. */
export function RoundDigits({ numStr, e, sf }: { numStr: string; e: number; sf: boolean }) {
  const [intPart] = numStr.replace(/,/g, "").split(".");
  let seenPoint = false, intIdx = 0, fracIdx = 0, seenNonZero = false;
  const cells = numStr.split("").map((ch, i) => {
    if (ch === "," || ch === ".") { if (ch === ".") seenPoint = true; return { key: i, sep: ch }; }
    const exp = seenPoint ? -(++fracIdx) : intPart.length - 1 - intIdx++;
    if (ch !== "0") seenNonZero = true;
    const lead = sf && !seenNonZero;      // leading zeros are not significant figures
    const kind = lead ? "lead" : exp > e ? "kept" : exp === e ? "round" : exp === e - 1 ? "decide" : "dropped";
    return { key: i, ch, kind };
  });
  const palette: Record<string, { bg: string; border: string; color: string }> = {
    kept: { bg: "#ffffff", border: "#94a3b8", color: "#0f172a" },
    round: { bg: "#dbeafe", border: "#2563eb", color: "#1d4ed8" },
    decide: { bg: "#fef3c7", border: "#d97706", color: "#b45309" },
    dropped: { bg: "#f1f5f9", border: "#cbd5e1", color: "#94a3b8" },
    lead: { bg: "#f1f5f9", border: "#cbd5e1", color: "#94a3b8" },
  };
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "26px 0", gap: 4 }}>
      {cells.map(c => "sep" in c && c.sep ? (
        <span key={c.key} style={{ fontSize: "2rem", fontWeight: 700, color: "#334155", alignSelf: "flex-end", lineHeight: 1.5 }}>{c.sep}</span>
      ) : (
        <Fragment key={c.key}>
        {/* the dotted "cut" line between the rounding digit and the decider */}
        {(c as any).kind === "decide" && <div style={{ alignSelf: "stretch", borderLeft: "3px dotted #334155", margin: "-8px 6px" }} />}
        <div style={{ position: "relative" }}>
          <div style={{ width: "2.6rem", height: "3.2rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, borderRadius: 8, border: `2px solid ${palette[(c as any).kind].border}`, background: palette[(c as any).kind].bg, color: palette[(c as any).kind].color }}>{(c as any).ch}</div>
          {(c as any).kind === "round" && <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: 700, color: "#1d4ed8", marginTop: 4 }}>rounding digit</div>}
          {(c as any).kind === "decide" && <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: 700, color: "#b45309", marginBottom: 4 }}>decider</div>}
        </div>
        </Fragment>
      ))}
    </div>
  );
}
