import { LV_SELECTOR, LV_LABELS } from "../colors";

export const DifficultyToggle = ({
  value,
  onChange,
  disabledLevels = [],
  levels = ["level1", "level2", "level3"],
  fullWidth = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disabledLevels?: string[];
  /** The levels to show (a sub-tool's ToolEntry.levels); others are hidden. */
  levels?: string[];
  /** stretch to the container, each level an equal share (phone option sheets) */
  fullWidth?: boolean;
}) => (
  // No overflow-hidden so the tooltip can escape the container
  <div className={`flex rounded-xl border border-slate-200 bg-white ${fullWidth ? "w-full" : ""}`} style={{ overflow: "visible" }}>
    {levels.map((val, idx, arr) => {
      const label = LV_LABELS[val];
      const isDisabled = disabledLevels.includes(val);
      const isActive = !isDisabled && value === val;
      const col = LV_SELECTOR[val as keyof typeof LV_SELECTOR];
      // Recreate the look of overflow-hidden by rounding the outer buttons individually
      const roundClass = idx === 0 ? "rounded-l-[10px]" : idx === arr.length - 1 ? "rounded-r-[10px]" : "";
      const borderClass = idx > 0 ? "border-l border-slate-200" : "";

      return (
        <div key={val} style={{ position: "relative" }} className={`group ${fullWidth ? "flex-1" : ""}`}>
          <button
            onClick={() => { if (!isDisabled) onChange(val); }}
            className={`${fullWidth ? "w-full" : ""} px-5 py-2 whitespace-nowrap font-bold text-base transition-colors ${roundClass} ${borderClass} ${
              isDisabled
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : isActive
                  ? `${col.bg} ${col.text}`
                  : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
          {isDisabled && (
            <div
              className="absolute bottom-full left-1/2 mb-2 hidden group-hover:flex pointer-events-none flex-col items-center"
              style={{ transform: "translateX(-50%)", zIndex: 9999 }}
            >
              <div className="bg-gray-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                Coming soon
              </div>
              {/* caret */}
              <div
                style={{
                  width: 0, height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid #1f2937",
                }}
              />
            </div>
          )}
        </div>
      );
    })}
  </div>
);
