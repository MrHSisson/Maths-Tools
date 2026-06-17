import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import type { ToolEntry, DifficultyLevel } from "../types";
import { LV_LABELS, LV_HEADER_COLORS } from "../colors";
import { normalizeMultiSelect } from "../helpers";

export const usePopover = () => {
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
  return { open, setOpen, ref };
};

const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl border-2 font-bold text-base transition-colors shadow-sm flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-gray-300 text-gray-600 hover:border-blue-900 hover:text-blue-900"}`}
  >
    Question Options{" "}
    <ChevronDown size={18} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
  </button>
);

export const TogglePill = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-3 cursor-pointer py-1">
    <div
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${checked ? "bg-blue-900" : "bg-gray-300"}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </div>
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </label>
);

export const SegButtons = ({
  value,
  onChange,
  opts,
}: {
  value: string;
  onChange: (v: string) => void;
  opts: { value: string; label: string }[];
}) => (
  <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
    {opts.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export const DropdownSection = ({
  dropdown,
  value,
  onChange,
}: {
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] };
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dropdown.label}</span>
    <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
      {dropdown.options.map(opt =>
        dropdown.useTwoLineButtons ? (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-4 py-2.5 text-center flex flex-col items-center justify-center transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            <span className="text-base font-bold leading-tight">{opt.label}</span>
            {opt.sub && (
              <span className={`text-xs mt-0.5 leading-tight ${value === opt.value ? "text-blue-200" : "text-gray-400"}`}>{opt.sub}</span>
            )}
          </button>
        ) : (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${value === opt.value ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
          >
            {opt.label}
          </button>
        )
      )}
    </div>
  </div>
);

export const MultiSelectSection = ({
  multiSelect,
  values,
  onChange,
}: {
  multiSelect: { key: string; label: string; options: { value: string; label: string; sub?: string; info?: string }[]; allowEmpty?: boolean };
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => {
  const activeCount = multiSelect.options.filter(o => values[o.value]).length;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{multiSelect.label}</span>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
        {multiSelect.options.map(opt => {
          const isActive = values[opt.value] ?? false;
          const isLast = !multiSelect.allowEmpty && isActive && activeCount === 1;
          return (
            <button
              key={opt.value}
              onClick={() => { if (!isLast) onChange(opt.value, !isActive); }}
              className={`group relative flex-1 min-w-0 px-3 py-2 text-sm font-bold transition-colors flex flex-col items-center justify-center text-center ${isActive ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <span className="leading-tight">{opt.label}{opt.info ? <span className="ml-0.5 opacity-70">ⓘ</span> : null}</span>
              {opt.sub && (
                <span className={`text-xs mt-0.5 leading-tight ${isActive ? "text-blue-200" : "text-gray-400"}`}>{opt.sub}</span>
              )}
              {opt.info && (
                <div
                  className="absolute bottom-full left-1/2 mb-2 hidden group-hover:flex pointer-events-none flex-col items-center"
                  style={{ transform: "translateX(-50%)", zIndex: 9999 }}
                >
                  <div className="bg-gray-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg" style={{ maxWidth: "13rem", whiteSpace: "normal", textAlign: "center" }}>{opt.info}</div>
                  <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2937" }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Renders one or more independent multi-select pools, all sharing one flat values record.
const MultiSelectGroups = ({
  groups,
  values,
  onChange,
}: {
  groups: { key: string; label: string; options: { value: string; label: string; sub?: string; info?: string }[]; allowEmpty?: boolean }[];
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => (
  <>
    {groups.map(g => (
      <div key={g.key} style={{ display: "contents" }}>
        <MultiSelectSection multiSelect={g} values={values} onChange={onChange} />
      </div>
    ))}
  </>
);

export const VariablesSection = ({
  variables,
  values,
  onChange,
}: {
  variables: { key: string; label: string }[];
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Options</span>
    {variables.map(v => (
      <label key={v.key} className="flex items-center gap-3 cursor-pointer py-1">
        <div
          onClick={() => onChange(v.key, !values[v.key])}
          className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${values[v.key] ? "bg-blue-900" : "bg-gray-300"}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${values[v.key] ? "translate-x-7" : "translate-x-1"}`} />
        </div>
        <span className="text-base font-semibold text-gray-700">{v.label}</span>
      </label>
    ))}
  </div>
);

export const StandardQOPopover = ({
  variables,
  variableValues,
  onVariableChange,
  dropdown,
  dropdownValue,
  onDropdownChange,
  multiSelect,
  multiSelectValues,
  onMultiSelectChange,
}: {
  variables: { key: string; label: string }[];
  variableValues: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[] } | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelect: { key: string; label: string; options: { value: string; label: string }[]; allowEmpty?: boolean }[];
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const hasContent = variables.length > 0 || dropdown !== null || multiSelect.length > 0;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-[26rem] p-5 flex flex-col gap-5">
          {dropdown && <DropdownSection dropdown={dropdown} value={dropdownValue} onChange={onDropdownChange} />}
          <MultiSelectGroups groups={multiSelect} values={multiSelectValues} onChange={onMultiSelectChange} />
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
          {!hasContent && <p className="text-sm text-gray-400">No additional options for this tool.</p>}
        </div>
      )}
    </div>
  );
};

export const DiffQOPopover = ({
  toolSettings,
  levelVariables,
  onLevelVariableChange,
  levelDropdowns,
  onLevelDropdownChange,
  levelMultiSelect,
  onLevelMultiSelectChange,
}: {
  toolSettings: ToolEntry;
  levelVariables: Record<string, Record<string, boolean>>;
  onLevelVariableChange: (lv: string, k: string, v: boolean) => void;
  levelDropdowns: Record<string, string>;
  onLevelDropdownChange: (lv: string, v: string) => void;
  levelMultiSelect: Record<string, Record<string, boolean>>;
  onLevelMultiSelectChange: (lv: string, k: string, v: boolean) => void;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels = ["level1", "level2", "level3"] as DifficultyLevel[];
  const getDDForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
  const getVarsForLevel = (lv: string) => toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables;
  const getMSForLevel = (lv: string) => normalizeMultiSelect(toolSettings.difficultySettings?.[lv]?.multiSelect ?? toolSettings.multiSelect);
  const anyContent = levels.some(lv => getDDForLevel(lv) !== null || (getVarsForLevel(lv)?.length ?? 0) > 0 || getMSForLevel(lv).length > 0);
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-[28rem] p-5 flex flex-col gap-5">
          {!anyContent ? (
            <p className="text-sm text-gray-400">No additional options for this tool.</p>
          ) : (
            levels.map(lv => {
              const dd = getDDForLevel(lv);
              const vars = getVarsForLevel(lv) ?? [];
              const ms = getMSForLevel(lv);
              return (
                <div key={lv} className="flex flex-col gap-2">
                  <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                  <div className="flex flex-col gap-3 pl-1">
                    {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={v => onLevelDropdownChange(lv, v)} />}
                    <MultiSelectGroups groups={ms} values={levelMultiSelect[lv] ?? {}} onChange={(k, v) => onLevelMultiSelectChange(lv, k, v)} />
                    {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k, v) => onLevelVariableChange(lv, k, v)} />}
                    {!dd && ms.length === 0 && vars.length === 0 && <p className="text-xs text-gray-400">No options at this level.</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export const InlineQOPanel = ({
  toolEntry,
  level,
  variables,
  onVariableChange,
  dropdownValue,
  onDropdownChange,
  multiSelectValues,
  onMultiSelectChange,
}: {
  toolEntry: ToolEntry;
  level: DifficultyLevel;
  variables: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
}) => {
  const dd = toolEntry.difficultySettings?.[level]?.dropdown ?? toolEntry.dropdown;
  const vars = toolEntry.difficultySettings?.[level]?.variables ?? toolEntry.variables;
  const ms = normalizeMultiSelect(toolEntry.difficultySettings?.[level]?.multiSelect ?? toolEntry.multiSelect);
  const hasContent = dd !== null || (vars?.length ?? 0) > 0 || ms.length > 0;
  if (!hasContent) return <p className="text-sm text-gray-400">No options for this level.</p>;
  return (
    <div className="flex flex-col gap-4">
      {dd && <DropdownSection dropdown={dd} value={dropdownValue} onChange={onDropdownChange} />}
      <MultiSelectGroups groups={ms} values={multiSelectValues} onChange={onMultiSelectChange} />
      {(vars?.length ?? 0) > 0 && <VariablesSection variables={vars} values={variables} onChange={onVariableChange} />}
    </div>
  );
};
