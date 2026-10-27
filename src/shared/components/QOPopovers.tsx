import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import type { ToolEntry, DifficultyLevel, QOTab } from "../types";
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
const hasStarred = (groups: { options: { label: string }[] }[]) => groups.some((g) => g.options.some((o) => o.label.endsWith("*")));
const StarNote = () => <p className="text-xs text-gray-500 !mb-0">* beyond standard questioning</p>;

// ── Tabs inside the options popover ─────────────────────────────────────────
// A tool with many option groups tags each with a `tab`; the popover then shows small pill tabs
// (only those with something on them, and only when there are two or more) and one tab's groups at a time.
const TAB_ORDER: QOTab[] = ["questions", "numbers", "method", "display"];
const TAB_LABEL: Record<QOTab, string> = { questions: "Questions", numbers: "Numbers", method: "Method", display: "Display" };
type Tabbed = { tab?: QOTab };
const tabOf = (g: Tabbed) => g.tab ?? "questions";
/** The tabs that have at least one of these groups on them, in the fixed order. */
const tabsIn = (groups: Tabbed[]) => TAB_ORDER.filter(t => groups.some(g => tabOf(g) === t));
/** The tab on show: the one picked, or the first that has something on it (the picked one may be empty at another level). */
const useQOTab = (present: QOTab[]) => {
  const [picked, setPicked] = useState<QOTab | null>(null);
  const active: QOTab | null = present.length < 2 ? null : picked && present.includes(picked) ? picked : present[0];
  return [active, setPicked] as const;
};
/** Keeps a group when no tab is on show (one tab or none) or it sits on the tab on show. */
const onTab = (active: QOTab | null) => (g: Tabbed) => active === null || tabOf(g) === active;
const QOTabs = ({ tabs, active, onPick }: { tabs: QOTab[]; active: QOTab | null; onPick: (t: QOTab) => void }) =>
  active === null ? null : (
    <div role="tablist" aria-label="Option groups" className="flex flex-wrap gap-1.5">
      {tabs.map(t => (
        <button key={t} type="button" role="tab" aria-selected={t === active} onClick={() => onPick(t)}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${t === active ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          {TAB_LABEL[t]}
        </button>
      ))}
    </div>
  );

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
  multiSelect: { key: string; label: string; options: { value: string; label: string; sub?: string; divider?: boolean; requires?: (string | string[])[] }[]; allowEmpty?: boolean; exclusive?: true };
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
      <span className="text-sm font-bold text-gray-400 uppercase tracking-wider self-start">{multiSelect.label}</span>
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
type MSGroup = { key: string; label: string; info?: string; options: { value: string; label: string; sub?: string; divider?: boolean; requires?: (string | string[])[] }[]; allowEmpty?: boolean; exclusive?: true; };
const MultiSelectGroups = ({
  groups,
  allGroups,
  values,
  onChange,
}: {
  groups: MSGroup[];
  /** Every pool in the popover, when `groups` is only the ones on the tab on show (a `requires` can name a pool on another tab). */
  allGroups?: MSGroup[];
  values: Record<string, boolean>;
  onChange: (k: string, v: boolean) => void;
}) => {
  const every = allGroups ?? groups;
  const offered = new Set(every.flatMap(g => g.options.map(o => o.value)));
  const labels = new Map(every.flatMap(g => g.options.map(o => [o.value, o.label] as const)));
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
  variables: { key: string; label: string; tab?: QOTab }[];
  variableValues: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: { key: string; label: string; tab?: QOTab; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; workedExampleOnly?: boolean } | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelect: { key: string; label: string; tab?: QOTab; options: { value: string; label: string }[]; allowEmpty?: boolean; exclusive?: true }[];
  multiSelectValues: Record<string, boolean>;
  onMultiSelectChange: (k: string, v: boolean) => void;
  /** Hides a dropdown flagged `workedExampleOnly` — it only changes the
   *  displayed working, so it has nothing to offer a printed worksheet. Pass
   *  true from the Worksheet mode QO popover; omit (or false) in
   *  Whiteboard/Worked Example mode, where it still applies. */
  hideWorkedExampleOnly?: boolean;
}) => {
  const { open, setOpen, ref } = usePopover();
  const allDd = dropdown && !(hideWorkedExampleOnly && dropdown.workedExampleOnly) ? dropdown : null;
  const tabs = tabsIn([...(allDd ? [allDd] : []), ...multiSelect, ...variables]);
  const [tab, setTab] = useQOTab(tabs);
  const shown = onTab(tab);
  const dd = allDd && shown(allDd) ? allDd : null;
  const ms = multiSelect.filter(shown);
  const vars = variables.filter(shown);
  const sections = (dd ? 1 : 0) + ms.length + (vars.length > 0 ? 1 : 0);
  // an untabbed list of more than four groups splits into two columns with a thin grey divider (the Split QO layout);
  // a tabbed popover stays one narrow column, since no tab holds more than a few groups
  const twoCol = tab === null && sections > 4;
  const hasContent = variables.length > 0 || allDd !== null || multiSelect.length > 0;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div
          className={`absolute top-full mt-2 bg-white rounded-xl shadow-lift border border-gray-200 z-50 p-5 flex flex-col gap-5 ${twoCol ? "left-1/2 -translate-x-1/2 border-2 !border-gray-400" : "left-0 min-w-[26rem]"}`}
          style={twoCol ? { width: "min(54rem, calc(100vw - 2rem))" } : undefined}
        >
          <QOTabs tabs={tabs} active={tab} onPick={setTab} />
          <div
            className={twoCol ? "[&>*]:break-inside-avoid [&>*]:mb-5" : "flex flex-col gap-5"}
            style={twoCol ? { columnCount: 2, columnGap: "2.5rem", columnRule: "1px solid #d1d5db" } : undefined}
          >
            {dd && <DropdownSection dropdown={dd} value={dropdownValue} onChange={onDropdownChange} />}
            <MultiSelectGroups groups={ms} allGroups={multiSelect} values={multiSelectValues} onChange={onMultiSelectChange} />
            {vars.length > 0 && <VariablesSection variables={vars} values={variableValues} onChange={onVariableChange} />}
          </div>
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
  // one row of tabs for every level shown: each level lists only its groups on the tab on show
  const tabs = tabsIn(levels.flatMap(lv => { const dd = getDDForLevel(lv); return [...(dd ? [dd] : []), ...getMSForLevel(lv), ...(getVarsForLevel(lv) ?? [])]; }));
  const [tab, setTab] = useQOTab(tabs);
  const shown = onTab(tab);
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-lift border border-gray-200 z-50 min-w-[28rem] p-5 flex flex-col gap-5">
          <QOTabs tabs={tabs} active={tab} onPick={setTab} />
          {!anyContent ? (
            <p className="text-sm text-gray-400">No additional options for this tool.</p>
          ) : (
            levels.map(lv => {
              const rawDd = getDDForLevel(lv);
              const dd = rawDd && shown(rawDd) ? rawDd : null;
              const vars = (getVarsForLevel(lv) ?? []).filter(shown);
              const allMs = getMSForLevel(lv);
              const ms = allMs.filter(shown);
              return (
                <div key={lv} className="flex flex-col gap-2">
                  <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                  <div className="flex flex-col gap-3 pl-1">
                    {dd && <DropdownSection dropdown={dd} value={levelDropdowns[lv] ?? dd.defaultValue} onChange={v => onLevelDropdownChange(lv, v)} />}
                    <MultiSelectGroups groups={ms} allGroups={allMs} values={levelMultiSelect[lv] ?? {}} onChange={(k, v) => onLevelMultiSelectChange(lv, k, v)} />
                    {vars.length > 0 && <VariablesSection variables={vars} values={levelVariables[lv] ?? {}} onChange={(k, v) => onLevelVariableChange(lv, k, v)} />}
                    {!dd && ms.length === 0 && vars.length === 0 && <p className="text-xs text-gray-400">{tab ? "Nothing on this tab at this level." : "No options at this level."}</p>}
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
  const allMs = normalizeMultiSelect(toolEntry.difficultySettings?.[level]?.multiSelect ?? toolEntry.multiSelect);
  const tabs = tabsIn([...(dd ? [dd] : []), ...allMs, ...(vars ?? [])]);
  const [tab, setTab] = useQOTab(tabs);
  const shown = onTab(tab);
  const ms = allMs.filter(shown);
  const tabVars = (vars ?? []).filter(shown);
  const hasContent = dd !== null || (vars?.length ?? 0) > 0 || allMs.length > 0;
  if (!hasContent) return <p className="text-sm text-gray-400">No options for this level.</p>;
  return (
    <div className="flex flex-col gap-4">
      <QOTabs tabs={tabs} active={tab} onPick={setTab} />
      {dd && shown(dd) && <DropdownSection dropdown={dd} value={dropdownValue} onChange={onDropdownChange} />}
      <MultiSelectGroups groups={ms} allGroups={allMs} values={multiSelectValues} onChange={onMultiSelectChange} />
      {tabVars.length > 0 && <VariablesSection variables={tabVars} values={variables} onChange={onVariableChange} />}
      {hasStarred(allMs) && <StarNote />}
    </div>
  );
};
