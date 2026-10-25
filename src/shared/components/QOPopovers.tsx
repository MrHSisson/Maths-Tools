import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import type { ToolEntry, DifficultyLevel } from "../types";
import { LV_LABELS, LV_HEADER_COLORS } from "../colors";
import { normalizeMultiSelect, unmetRequires } from "../helpers";

export const usePopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // Esc closes the popover and stops there: it must not also leave a fullscreen the popover is open inside
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
    };
    document.addEventListener("mousedown", h);
    window.addEventListener("keydown", esc, true);
    return () => { document.removeEventListener("mousedown", h); window.removeEventListener("keydown", esc, true); };
  }, [open]);
  return { open, setOpen, ref };
};

const PopoverButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 whitespace-nowrap rounded-xl border font-semibold text-base transition-colors flex items-center gap-2 ${open ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-blue-900 hover:text-blue-900"}`}
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

/** Question-option buttons, the one look used everywhere: well-spaced single buttons. Short labels sit four to a row when they fit, otherwise three, otherwise
 *  two (the default); a short last row is centred. A button with a smaller descriptive line (`sub`) always keeps the two-column look. */
const approxBtnWidth = (label: string) => label.length * 7.6 + 30; // text-sm semibold plus px-3 and the border
const GRID_GAP = 8;
/** the footnote for any option whose label ends with an asterisk */
export const hasStarred = (groups: { options: { label: string }[] }[]) => groups.some((g) => g.options.some((o) => o.label.endsWith("*")));
export const StarNote = () => <p className="text-xs text-gray-500 !mb-0">* beyond standard questioning</p>;

export const OptionGrid = ({
  items,
  onPress,
}: {
  items: { value: string; label: string; sub?: string; active: boolean; disabled?: boolean; title?: string }[];
  onPress: (value: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const widest = Math.max(...items.map((it) => approxBtnWidth(it.label)));
  const fits = (c: number) => width > 0 && c * widest + (c - 1) * GRID_GAP <= width;
  const cols = items.some((it) => it.sub) || items.length < 3 ? 2 : items.length >= 4 && fits(4) ? 4 : fits(3) ? 3 : 2;
  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-2">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          disabled={it.disabled}
          title={it.title}
          aria-pressed={it.active}
          onClick={() => onPress(it.value)}
          style={{ flexBasis: `calc((100% - ${(cols - 1) * GRID_GAP}px) / ${cols})`, maxWidth: `calc((100% - ${(cols - 1) * GRID_GAP}px) / ${cols})` }}
          className={`min-w-0 grow-0 px-3 py-2 rounded-lg border text-sm font-semibold leading-snug text-center !whitespace-normal transition-colors ${
            it.disabled ? "bg-gray-50 border-gray-200 text-gray-300 line-through cursor-not-allowed"
            : it.active ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-300 text-gray-700 hover:bg-gray-50"}`}
        >
          {it.label}
          {it.sub && <span className={`block text-xs font-normal mt-0.5 ${it.active ? "text-blue-100" : "text-gray-500"}`}>{it.sub}</span>}
        </button>
      ))}
    </div>
  );
};

export const SegButtons = ({
  value,
  onChange,
  opts,
}: {
  value: string;
  onChange: (v: string) => void;
  opts: { value: string; label: string; sub?: string }[];
}) => <OptionGrid items={opts.map(o => ({ ...o, active: value === o.value }))} onPress={onChange} />;

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
    <SegButtons value={value} opts={dropdown.options} onChange={onChange} />
  </div>
);

export const MultiSelectSection = ({
  multiSelect,
  values,
  onChange,
  offered,
  labelOf,
}: {
  multiSelect: { key: string; label: string; info?: string; options: { value: string; label: string; sub?: string; divider?: boolean; requires?: (string | string[])[] }[]; allowEmpty?: boolean; exclusive?: true };
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
  // every value on offer in the whole popover (not just this pool), so a `requires` clause can name another pool's option
  offered?: ReadonlySet<string>;
  labelOf?: (value: string) => string | undefined;
}) => {
  const unmetOf = (o: { requires?: (string | string[])[] }) => unmetRequires(o.requires, values, offered);
  const activeCount = multiSelect.options.filter(o => values[o.value] && unmetOf(o).length === 0).length;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative group flex items-center gap-1 self-start">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{multiSelect.label}</span>
        {multiSelect.info && (
          <>
            <span className="text-gray-400 text-sm leading-none cursor-help">&#9432;</span>
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex pointer-events-none flex-col items-start" style={{ zIndex: 9999 }}>
              <div className="bg-gray-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lift" style={{ maxWidth: "15rem", whiteSpace: "normal" }}>{multiSelect.info}</div>
              <div style={{ width: 0, height: 0, marginLeft: "0.6rem", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2937" }} />
            </div>
          </>
        )}
      </div>
      <OptionGrid
        items={multiSelect.options.map(opt => {
          const unmet = unmetOf(opt);
          const blocked = unmet.length > 0;
          return {
            value: opt.value, label: opt.label, sub: opt.sub,
            active: (values[opt.value] ?? false) && !blocked,
            disabled: blocked,
            title: blocked ? `Needs ${unmet.map(c => (Array.isArray(c) ? c : [c]).map(v => labelOf?.(v) ?? v).join(" or ")).join(" and ")}` : undefined,
          };
        })}
        onPress={v => {
          const isActive = (values[v] ?? false) && unmetOf(multiSelect.options.find(o => o.value === v)!).length === 0;
          const isLast = !multiSelect.allowEmpty && isActive && activeCount === 1;
          if (multiSelect.exclusive) {
            // single-choice pool: picking an option turns every other one off
            if (!isActive) multiSelect.options.forEach(o => onChange(o.value, o.value === v));
          } else if (!isLast) onChange(v, !isActive);
        }}
      />
    </div>
  );
};

// Renders one or more independent multi-select pools, all sharing one flat
// values record.
const MultiSelectGroups = ({
  groups,
  values,
  onChange,
}: {
  groups: { key: string; label: string; info?: string; options: { value: string; label: string; sub?: string; divider?: boolean; weight?: number; requires?: (string | string[])[] }[]; allowEmpty?: boolean; exclusive?: true; }[];
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => {
  const offered = new Set(groups.flatMap(g => g.options.map(o => o.value)));
  const labels = new Map(groups.flatMap(g => g.options.map(o => [o.value, o.label] as const)));
  const labelOf = (v: string) => labels.get(v);
  return (
    <>
      {groups.map(g => <MultiSelectSection key={g.key} multiSelect={g} values={values} onChange={onChange} offered={offered} labelOf={labelOf} />)}
    </>
  );
};

export const VariablesSection = ({
  variables,
  values,
  onChange,
}: {
  variables: { key: string; label: string; info?: string }[];
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
        <span className="relative group flex items-center gap-1.5">
          <span className="text-base font-semibold text-gray-700">{v.label}</span>
          {v.info && (
            <>
              <span className="text-gray-400 text-sm leading-none cursor-help">&#9432;</span>
              <span className="absolute bottom-full left-0 mb-2 hidden group-hover:flex pointer-events-none flex-col items-start" style={{ zIndex: 9999 }}>
                <span className="bg-gray-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lift" style={{ width: "15rem", whiteSpace: "normal" }}>{v.info}</span>
                <span style={{ width: 0, height: 0, marginLeft: "0.6rem", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1f2937" }} />
              </span>
            </>
          )}
        </span>
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
  columns,
}: {
  variables: { key: string; label: string; info?: string }[];
  variableValues: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; workedExampleOnly?: boolean } | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelect: { key: string; label: string; options: { value: string; label: string }[]; allowEmpty?: boolean; exclusive?: true }[];
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
  /** Hides a dropdown flagged `workedExampleOnly` — it only changes the
   *  displayed working, so it has nothing to offer a printed worksheet. Pass
   *  true from the Worksheet mode QO popover; omit (or false) in
   *  Whiteboard/Worked Example mode, where it still applies. */
  hideWorkedExampleOnly?: boolean;
  /** 2 → a tool with many options lays its sections out in two balanced columns with a thin
   *  grey divider, in a popover twice as wide (centred under its button so it stays on screen). */
  columns?: 1 | 2;
}) => {
  const { open, setOpen, ref } = usePopover();
  const sections = (dropdown && !(hideWorkedExampleOnly && dropdown.workedExampleOnly) ? 1 : 0) + multiSelect.length + (variables.length > 0 ? 1 : 0);
  // a long list splits into two columns with a thin grey divider (the Split QO layout), whether or not the tool asked for it
  const twoCol = columns === 2 || (columns === undefined && sections > 4);
  const dd = dropdown && !(hideWorkedExampleOnly && dropdown.workedExampleOnly) ? dropdown : null;
  const hasContent = variables.length > 0 || dd !== null || multiSelect.length > 0;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div
          className={`absolute top-full mt-2 bg-white rounded-xl shadow-lift border border-gray-200 z-50 p-5 ${twoCol ? "left-1/2 -translate-x-1/2 border-2 !border-gray-400 [&>*]:break-inside-avoid [&>*]:mb-5" : "left-0 min-w-[26rem] flex flex-col gap-5"}`}
          style={twoCol ? { width: "min(54rem, calc(100vw - 2rem))", columnCount: 2, columnGap: "2.5rem", columnRule: "1px solid #d1d5db" } : undefined}
        >
          {dd && <DropdownSection dropdown={dd} value={dropdownValue} onChange={onDropdownChange} />}
          <MultiSelectGroups groups={multiSelect} values={multiSelectValues} onChange={onMultiSelectChange} />
          {variables.length > 0 && <VariablesSection variables={variables} values={variableValues} onChange={onVariableChange} />}
          {!hasContent && <p className="text-sm text-gray-400">No additional options for this tool.</p>}
          {hasStarred(multiSelect) && <StarNote />}
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
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-lift border border-gray-200 z-50 min-w-[28rem] p-5 flex flex-col gap-5">
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
          {anyContent && levels.some(lv => hasStarred(getMSForLevel(lv))) && <StarNote />}
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
  hideWorkedExampleOnly,
  hideWorksheetOnly,
}: {
  toolEntry: ToolEntry;
  level: DifficultyLevel;
  variables: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
  /** Hides a dropdown flagged `workedExampleOnly` (the worksheet builder passes true — it only
   *  changes the displayed working, which a printed worksheet doesn't show). */
  hideWorkedExampleOnly?: boolean;
  /** Hides variables flagged `worksheetOnly` (pass true outside Worksheet mode). */
  hideWorksheetOnly?: boolean;
}) => {
  const rawDd = toolEntry.difficultySettings?.[level]?.dropdown ?? toolEntry.dropdown;
  const dd = rawDd && !(hideWorkedExampleOnly && rawDd.workedExampleOnly) ? rawDd : null;
  const allVars = toolEntry.difficultySettings?.[level]?.variables ?? toolEntry.variables;
  const vars = hideWorksheetOnly ? allVars?.filter(v => !v.worksheetOnly) : allVars;
  const ms = normalizeMultiSelect(toolEntry.difficultySettings?.[level]?.multiSelect ?? toolEntry.multiSelect);
  const hasContent = dd !== null || (vars?.length ?? 0) > 0 || ms.length > 0;
  if (!hasContent) return <p className="text-sm text-gray-400">No options for this level.</p>;
  return (
    <div className="flex flex-col gap-4">
      {dd && <DropdownSection dropdown={dd} value={dropdownValue} onChange={onDropdownChange} />}
      <MultiSelectGroups groups={ms} values={multiSelectValues} onChange={onMultiSelectChange} />
      {(vars?.length ?? 0) > 0 && <VariablesSection variables={vars} values={variables} onChange={onVariableChange} />}
      {hasStarred(ms) && <StarNote />}
    </div>
  );
};
