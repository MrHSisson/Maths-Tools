import { LV_SELECTOR, LV_LABELS } from "../colors";

export const DifficultyToggle = ({
  value,
  onChange,
  levels = ["level1", "level2", "level3"],
  fullWidth = false,
}: {
  value: string;
  onChange: (v: string) => void;
  /** The levels to show (a sub-tool's ToolEntry.levels); others are hidden. */
  levels?: string[];
  /** stretch to the container, each level an equal share (phone option sheets) */
  fullWidth?: boolean;
}) => (
  <div className={`flex rounded-xl border border-slate-200 bg-white ${fullWidth ? "w-full" : ""}`}>
    {levels.map((val, idx, arr) => {
      const label = LV_LABELS[val];
      const col = LV_SELECTOR[val as keyof typeof LV_SELECTOR];
      // Recreate the look of overflow-hidden by rounding the outer buttons individually
      const roundClass = idx === 0 ? "rounded-l-[10px]" : idx === arr.length - 1 ? "rounded-r-[10px]" : "";
      const borderClass = idx > 0 ? "border-l border-slate-200" : "";

      return (
        <div key={val} className={fullWidth ? "flex-1" : ""}>
          <button
            onClick={() => onChange(val)}
            className={`${fullWidth ? "w-full" : ""} px-5 py-2 whitespace-nowrap font-bold text-base transition-colors ${roundClass} ${borderClass} ${
              value === val ? `${col.bg} ${col.text}` : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        </div>
      );
    })}
  </div>
);
