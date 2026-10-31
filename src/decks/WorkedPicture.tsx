import { useEffect, useRef, useState, type ReactNode } from "react";
import { RatioTable } from "../shared/components/RatioTable";
import { BarModel } from "../shared/components/BarModel";
import { rowsBarNatural, type BarModelData } from "../shared/barModel";
import type { RatioTableData } from "../shared";

// The pictures in a question's working: a ratio table growing row by row, or the fraction bar model. A generator slide draws them
// from the question's working steps; a fixed question carries them in its explanation lines as `caption\n@ratiotable {json}` or
// `caption\n@bar {json}` (made by `fromWorked`), so a hand-fixed question shows exactly what the tool shows.

/** Shrinks a picture of a known size to the width of its box (never enlarges it), and keeps it centred. */
export function FitWidth({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setK(el.clientWidth ? Math.min(1, el.clientWidth / w) : 1);   // layout width: not affected by the slide's own scale
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return <div ref={box} style={{ width: "100%", height: h * k, display: "flex", justifyContent: "center" }}><div style={{ width: w, height: h, flexShrink: 0, transform: `scale(${k})`, transformOrigin: "center top" }}>{children}</div></div>;
}

type WorkedKind = "ratioTable" | "bar";

/** One working picture, with its caption above it. */
export function WorkedPicture({ type, data, caption }: { type: WorkedKind; data: unknown; caption?: string }) {
  if (type === "ratioTable") return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{caption && <div style={{ fontSize: "0.75em", lineHeight: 1.4 }}>{caption}</div>}<RatioTable data={data as RatioTableData} scale={1.5} /></div>;
  const bar = data as BarModelData, size = 30, { w, h } = rowsBarNatural(bar, size);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {caption && <div style={{ fontSize: "0.75em", lineHeight: 1.4 }}>{caption}</div>}
      <FitWidth w={Math.ceil(w) + 8} h={Math.ceil(h) + 8}><BarModel data={bar} width={Math.ceil(w) + 8} height={Math.ceil(h) + 8} size={size} /></FitWidth>
    </div>
  );
}

const PICTURE = /^([\s\S]*?)\n?@(ratiotable|bar) (\{[\s\S]*\})$/;
export const pictureLine = (caption: string, type: WorkedKind, data: unknown) => `${caption}\n@${type === "ratioTable" ? "ratiotable" : "bar"} ${JSON.stringify(data)}`;

/** A working line that carries a picture, or null for an ordinary line. */
export function parsePictureLine(line: string): { caption: string; type: WorkedKind; data: unknown } | null {
  const m = line.match(PICTURE);
  if (!m) return null;
  try { return { caption: m[1].trim(), type: m[2] === "ratiotable" ? "ratioTable" : "bar", data: JSON.parse(m[3]) }; } catch { return null; }
}
