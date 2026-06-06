export const DifficultyToggle = ({
  value,
  onChange,
  disabledLevels = [],
}: {
  value: string;
  onChange: (v: string) => void;
  disabledLevels?: string[];
}) => (
  // No overflow-hidden so the tooltip can escape the container
  <div className="flex rounded-xl border-2 border-gray-300 shadow-sm" style={{ overflow: "visible" }}>
    {(
      [
        ["level1", "Level 1", "bg-green-600"],
        ["level2", "Level 2", "bg-yellow-500"],
        ["level3", "Level 3", "bg-red-600"],
      ] as const
    ).map(([val, label, col], idx) => {
      const isDisabled = disabledLevels.includes(val);
      const isActive = !isDisabled && value === val;
      // Recreate the look of overflow-hidden by rounding the outer buttons individually
      const roundClass = idx === 0 ? "rounded-l-[10px]" : idx === 2 ? "rounded-r-[10px]" : "";
      const borderClass = idx > 0 ? "border-l border-gray-300" : "";

      return (
        <div key={val} style={{ position: "relative" }} className="group">
          <button
            onClick={() => { if (!isDisabled) onChange(val); }}
            className={`px-5 py-2 font-bold text-base transition-colors ${roundClass} ${borderClass} ${
              isDisabled
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : isActive
                  ? `${col} text-white`
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
