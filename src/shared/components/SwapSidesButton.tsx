import { ArrowLeftRight } from "lucide-react";
import { setSwapSides, useSwapSides } from "../layoutMode";

/** Mirrors every two-sided layout (see `useSwapSides`); for the fullscreen bars, where the tool's menu is out of reach. */
export const SwapSidesButton = ({ style }: { style?: React.CSSProperties }) => {
  const swapped = useSwapSides();
  return (
    <button onClick={() => setSwapSides(!swapped)} aria-pressed={swapped} aria-label="Swap sides" title="Swap sides: put the question on the other side"
      style={{ background: swapped ? "#374151" : "rgba(0,0,0,0.08)", border: "none", borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      <ArrowLeftRight size={16} color={swapped ? "#ffffff" : "#6b7280"} />
    </button>
  );
};
