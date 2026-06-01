import { useState, useEffect, useRef, CSSProperties } from "react";
import { loadKaTeX } from "../katex";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = () => window as any;

interface MathProps {
  latex: string;
  style?: CSSProperties;
  className?: string;
}

// KaTeX rendering notes:
//   1. Container set to fontSize 0.826em (= 1/1.21) for non-fraction expressions.
//      Fractions use 1em — their internal scaling looks correct as-is.
//   2. verticalAlign must be "baseline" not "middle".
//   3. displayMode is always false — wrap in a <div> for block display.
export const MathRenderer = ({ latex, style, className }: MathProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!w().katex);

  useEffect(() => {
    loadKaTeX().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !ref.current) return;
    try {
      w().katex.render(latex, ref.current, {
        displayMode: false,
        throwOnError: false,
        output: "html",
      });
    } catch {
      if (ref.current) ref.current.textContent = latex;
    }
  }, [latex, ready]);

  const hasFrac = latex.includes("\\frac");
  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline", verticalAlign: "baseline", fontSize: hasFrac ? "1em" : "0.826em", ...style }}
    />
  );
};

// Renders a string containing $...$ inline LaTeX alongside plain text.
// Only genuine mathematical content should be inside $...$; prose stays plain.
export const InlineMath = ({ text }: { text: string }) => {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span style={{ display: "inline" }}>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          return <MathRenderer key={i} latex={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
