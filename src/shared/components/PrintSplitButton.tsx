import { useState, useEffect, useRef } from "react";
import { ChevronDown, Printer } from "lucide-react";
import type { PrintMode } from "../types";

const PRINT_MODE_LABELS: Record<PrintMode, string> = {
  both: "Print Both",
  questions: "Questions",
  answers: "Answers",
};

export const PrintSplitButton = ({
  onPrint,
  printMode,
  setPrintMode,
  compact,
}: {
  onPrint: (mode: PrintMode) => void;
  printMode: PrintMode;
  setPrintMode: (m: PrintMode) => void;
  compact?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const fire = (mode: PrintMode) => { setPrintMode(mode); onPrint(mode); setOpen(false); };

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <div className={`flex ${compact ? "rounded-lg" : "rounded-xl"} overflow-hidden shadow-sm`} style={{ border: "none" }}>
        <button
          onClick={() => onPrint(printMode)}
          className={`${compact ? "px-3 py-1.5 font-semibold text-sm gap-1.5" : "px-5 py-2 font-bold text-base gap-2"} bg-green-700 text-white hover:bg-green-800 flex items-center transition-colors`}
        >
          <Printer size={compact ? 14 : 18} /> {PRINT_MODE_LABELS[printMode]}
        </button>
        <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        <button
          onClick={() => setOpen(o => !o)}
          className={`${compact ? "px-2 py-1.5" : "px-2.5 py-2"} bg-green-700 text-white hover:bg-green-800 flex items-center transition-colors`}
        >
          <ChevronDown size={16} style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden" style={{ minWidth: "160px" }}>
          {(["both", "questions", "answers"] as PrintMode[]).map(m => (
            <button
              key={m}
              onClick={() => fire(m)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${printMode === m ? "bg-green-700 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {PRINT_MODE_LABELS[m]}
              {printMode === m && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
