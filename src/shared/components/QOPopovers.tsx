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
  multiSelect: { key: string; label: string; info?: string; options: { value: string; label: string; sub?: string; divider?: boolean }[]; allowEmpty?: boolean };
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => {
  const activeCount = multiSelect.options.filter(o => values[o.value]).length;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative group flex items-center gap-1 self-start">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{multiSelect.label}</span>
        {multiSelect.info && (
          <>
            <span className="text-gray-400 text-sm leading-none cursor-help">&#9432;</span>
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex pointer-events-none flex-col items-start" style={{ zIndex: 9999 }}>
              <div className="bg-gray-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg" style={{ maxWidth: "15rem", whiteSpace: "normal" }}>{multiSelect.info}</div>
              <div style={{ width: 0, height: 0, marginLeft: "0.6rem", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2937" }} />
            </div>
          </>
        )}
      </div>
      <div className="flex rounded-lg border-2 border-gray-200 overflow-hidden">
        {multiSelect.options.map(opt => {
          const isActive = values[opt.value] ?? false;
          const isLast = !multiSelect.allowEmpty && isActive && activeCount === 1;
          return (
            <button
              key={opt.value}
              onClick={() => { if (!isLast) onChange(opt.value, !isActive); }}
              className={`flex-1 min-w-0 px-3 py-2 text-sm font-bold transition-colors flex flex-col items-center justify-center text-center ${opt.divider ? "border-l-2 border-gray-800" : ""} ${isActive ? "bg-blue-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              <span className="leading-tight">{opt.label}</span>
              {opt.sub && (
                <span className={`text-xs mt-0.5 leading-tight ${isActive ? "text-blue-200" : "text-gray-400"}`}>{opt.sub}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// A weighted 2-option pool (e.g. "Negative coefficients": non-negative vs
// negative) is exactly the None/Mixed/Exclusive state space — the easier
// (lower-weight) option active only, both active, or the harder option
// active only — just reached by clicking through one compact button instead
// of ticking two pill cells. Same ToolMultiSelect data, same pickActive/
// weightOf/buildQuotaOverrides/sortByDifficulty pipeline underneath; this is
// a rendering choice only. Gated on BOTH options carrying a `weight` (not
// just "2 options") so a genuine peer choice like a 2-unit Units pool never
// gets forced into a "None/Mixed/Exclusive" framing that wouldn't make sense
// for it — see CLAUDE.md's "QO control types" section.
const CYCLE_LABELS = ["None", "Mixed", "Exclusive"] as const;

const CycleSelect = ({
  multiSelect,
  values,
  onChange,
}: {
  multiSelect: { key: string; label: string; options: { value: string; label: string; weight?: number }[] };
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => {
  const [base, hard] = [...multiSelect.options].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
  const activeBase = values[base.value] ?? false;
  const activeHard = values[hard.value] ?? false;
  const state = activeHard && !activeBase ? 2 : activeBase && !activeHard ? 0 : 1;
  const next = () => {
    const n = (state + 1) % 3;
    onChange(base.value, n !== 2);
    onChange(hard.value, n !== 0);
  };
  return (
    <button
      onClick={next}
      title={`${base.label} / ${hard.label}`}
      className="flex flex-col items-start gap-1 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-900 transition-colors text-left flex-shrink-0"
    >
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{multiSelect.label}</span>
      <span
        className={`text-sm font-bold px-2 py-0.5 rounded transition-colors self-stretch text-center ${
          state === 0 ? "bg-gray-100 text-gray-600" : state === 1 ? "bg-blue-100 text-blue-900" : "bg-blue-900 text-white"
        }`}
      >
        {CYCLE_LABELS[state]}
      </span>
    </button>
  );
};

const isCycleGroup = (g: { options: { weight?: number }[] }) => g.options.length === 2 && g.options.every(o => o.weight !== undefined);

// Renders one or more independent multi-select pools, all sharing one flat
// values record. Consecutive weighted-2-option pools (see CycleSelect above)
// are rendered as a compact flex-wrap row of cycle buttons instead of each
// claiming its own full-width labeled block — several fit inline where a
// growing QO popover would otherwise sprawl one bordered row per pool.
const MultiSelectGroups = ({
  groups,
  values,
  onChange,
}: {
  groups: { key: string; label: string; info?: string; options: { value: string; label: string; sub?: string; divider?: boolean; weight?: number }[]; allowEmpty?: boolean }[];
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => {
  const els: JSX.Element[] = [];
  let i = 0;
  while (i < groups.length) {
    if (isCycleGroup(groups[i])) {
      const run: typeof groups = [];
      while (i < groups.length && isCycleGroup(groups[i])) { run.push(groups[i]); i++; }
      els.push(
        <div key={`cycle-${run[0].key}`} className="flex flex-wrap gap-3">
          {run.map(g => <CycleSelect key={g.key} multiSelect={g} values={values} onChange={onChange} />)}
        </div>
      );
    } else {
      els.push(<MultiSelectSection key={groups[i].key} multiSelect={groups[i]} values={values} onChange={onChange} />);
      i++;
    }
  }
  return <>{els}</>;
};

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
  hideWorkedExampleOnly,
}: {
  variables: { key: string; label: string }[];
  variableValues: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; workedExampleOnly?: boolean } | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelect: { key: string; label: string; options: { value: string; label: string }[]; allowEmpty?: boolean }[];
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
  /** Hides a dropdown flagged `workedExampleOnly` — it only changes the
   *  displayed working, so it has nothing to offer a printed worksheet. Pass
   *  true from the Worksheet mode QO popover; omit (or false) in
   *  Whiteboard/Worked Example mode, where it still applies. */
  hideWorkedExampleOnly?: boolean;
}) => {
  const { open, setOpen, ref } = usePopover();
  const dd = dropdown && !(hideWorkedExampleOnly && dropdown.workedExampleOnly) ? dropdown : null;
  const hasContent = variables.length > 0 || dd !== null || multiSelect.length > 0;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-[26rem] p-5 flex flex-col gap-5">
          {dd && <DropdownSection dropdown={dd} value={dropdownValue} onChange={onDropdownChange} />}
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
  levels: levelsProp,
  hideWorkedExampleOnly,
}: {
  toolSettings: ToolEntry;
  levelVariables: Record<string, Record<string, boolean>>;
  onLevelVariableChange: (lv: string, k: string, v: boolean) => void;
  levelDropdowns: Record<string, string>;
  onLevelDropdownChange: (lv: string, v: string) => void;
  levelMultiSelect: Record<string, Record<string, boolean>>;
  onLevelMultiSelectChange: (lv: string, k: string, v: boolean) => void;
  /** Only show options for these levels — e.g. the levels currently selected
   *  for a differentiated worksheet. Defaults to all three. */
  levels?: DifficultyLevel[];
  /** See StandardQOPopover — hides any dropdown flagged `workedExampleOnly`. */
  hideWorkedExampleOnly?: boolean;
}) => {
  const { open, setOpen, ref } = usePopover();
  const levels = levelsProp ?? (["level1", "level2", "level3"] as DifficultyLevel[]);
  const getDDForLevel = (lv: string) => {
    const dd = toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
    return dd && !(hideWorkedExampleOnly && dd.workedExampleOnly) ? dd : null;
  };
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
