export const DifficultyToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden shadow-sm">
    {([["level1", "Level 1", "bg-green-600"], ["level2", "Level 2", "bg-yellow-500"], ["level3", "Level 3", "bg-red-600"]] as const).map(
      ([val, label, col]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`px-5 py-2 font-bold text-base transition-colors ${value === val ? `${col} text-white` : "bg-white text-gray-500 hover:bg-gray-50"}`}
        >
          {label}
        </button>
      )
    )}
  </div>
);
