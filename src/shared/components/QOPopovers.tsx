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

// ── Tabs and headers inside the options popover ─────────────────────────────
// Every option group carries a `tab` (Questions · Numbers · Method · Display) and is listed in that order. How the popover shows them
// depends on how many choices a level has (`qoLayout`): more than 8 → pill tabs, one tab at a time; 5 to 8 over three or more
// groups → the tab names as small headers over their groups; fewer → the groups in tab order with nothing added. Groups on one tab only
// never get tabs or headers.
const TAB_ORDER: QOTab[] = ["questions", "numbers", "method", "display"];
const TAB_LABEL: Record<QOTab, string> = { questions: "Questions", numbers: "Numbers", method: "Method", display: "Display" };
type Tabbed = { tab?: QOTab };
const tabOf = (g: Tabbed) => g.tab ?? "questions";
/** The tabs that have at least one of these groups on them, in the fixed order. */
const tabsIn = (groups: Tabbed[]) => TAB_ORDER.filter(t => groups.some(g => tabOf(g) === t));

/** More choices than this on a level and its groups go on tabs. */
export const QO_TABS_ABOVE = 8;
/** At least this many choices (and three groups) and the tab names show as headers. */
const QO_HEADERS_FROM = 5;
type QOLayout = "tabs" | "headers" | "plain";
type LevelOpts = { dd: (Tabbed & { options: unknown[] }) | null; ms: (Tabbed & { options: unknown[] })[]; vars: Tabbed[] };
const choicesIn = ({ dd, ms, vars }: LevelOpts) => (dd ? dd.options.length : 0) + ms.reduce((a, g) => a + g.options.length, 0) + vars.length;
/** How a level's options are laid out (see the note above). The differentiated popover passes the busiest level shown. */
export const qoLayout = (lv: LevelOpts): QOLayout => {
  const groups = [...(lv.dd ? [lv.dd] : []), ...lv.ms, ...lv.vars];
  if (tabsIn(groups).length < 2) return "plain";
  const n = choicesIn(lv);
  if (n > QO_TABS_ABOVE) return "tabs";
  const sections = (lv.dd ? 1 : 0) + lv.ms.length + (lv.vars.length ? 1 : 0);
  return n >= QO_HEADERS_FROM && sections >= 3 ? "headers" : "plain";
};
const busiest = (levels: LevelOpts[]): QOLayout => {
  const ls = levels.map(qoLayout);
  return ls.includes("tabs") ? "tabs" : ls.includes("headers") ? "headers" : "plain";
};

/** The tab on show: the one picked, or the first that has something on it (the picked one may be empty at another level). */
const useQOTab = (present: QOTab[], on: boolean) => {
  const [picked, setPicked] = useState<QOTab | null>(null);
  const active: QOTab | null = !on || present.length < 2 ? null : picked && present.includes(picked) ? picked : present[0];
  return [active, setPicked] as const;
};
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
const TabHeader = ({ tab }: { tab: QOTab }) => (
  <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
    <span>{TAB_LABEL[tab]}</span><span className="h-px flex-1 bg-slate-200" />
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

type MSGroup = { key: string; label: string; tab?: QOTab; info?: string; options: { value: string; label: string; sub?: string; divider?: boolean; requires?: (string | string[])[] }[]; allowEmpty?: boolean; exclusive?: true; };

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

type DDOpt = { key: string; label: string; tab?: QOTab; useTwoLineButtons?: boolean; options: { value: string; label: string; sub?: string }[]; workedExampleOnly?: boolean };
type VarOpt = { key: string; label: string; tab?: QOTab };

/** One level's option groups in tab order: only the tab on show (`tab`), under tab headers (`headers`), or all of them. */
const QOBody = ({ dd, ddValue, onDd, ms, msValues, onMs, vars, varValues, onVar, tab, headers, gap = "gap-5", split }: {
  dd: DDOpt | null; ddValue: string; onDd: (v: string) => void;
  ms: MSGroup[]; msValues: Record<string, boolean>; onMs: (k: string, v: boolean) => void;
  vars: VarOpt[]; varValues: Record<string, boolean>; onVar: (k: string, v: boolean) => void;
  tab: QOTab | null; headers: boolean; gap?: string;
  /** Lay the sections out in two columns with a thin grey divider (the Split QO layout). */
  split?: boolean;
}) => {
  const offered = new Set(ms.flatMap(g => g.options.map(o => o.value)));
  const labels = new Map(ms.flatMap(g => g.options.map(o => [o.value, o.label] as const)));
  const labelOf = (v: string) => labels.get(v);
  const sections: { tab: QOTab; key: string; label: string; el: JSX.Element }[] = [];
  if (dd) sections.push({ tab: tabOf(dd), key: `dd-${dd.key}`, label: dd.label, el: <DropdownSection dropdown={dd} value={ddValue} onChange={onDd} /> });
  ms.forEach(g => sections.push({ tab: tabOf(g), key: `ms-${g.key}`, label: g.label, el: <MultiSelectSection multiSelect={g} values={msValues} onChange={onMs} offered={offered} labelOf={labelOf} /> }));
  TAB_ORDER.forEach(t => {
    const vs = vars.filter(v => tabOf(v) === t);
    if (vs.length) sections.push({ tab: t, key: `vars-${t}`, label: "Options", el: <VariablesSection variables={vs} values={varValues} onChange={onVar} /> });
  });
  const shown = TAB_ORDER.flatMap(t => (tab === null || tab === t ? sections.filter(x => x.tab === t) : []));
  const blocks = headers
    ? TAB_ORDER.filter(t => shown.some(x => x.tab === t)).map(t => {
      const here = shown.filter(x => x.tab === t);
      // a tab whose only group is named the same ("Numbers" over NUMBERS) needs no header
      const sameName = here.length === 1 && here[0].label.toLowerCase() === TAB_LABEL[t].toLowerCase();
      return <div key={t} className={`flex flex-col ${gap}`}>{!sameName && <TabHeader tab={t} />}{here.map(x => <div key={x.key}>{x.el}</div>)}</div>;
    })
    : shown.map(x => <div key={x.key}>{x.el}</div>);
  return split
    ? <div className="[&>*]:break-inside-avoid [&>*]:mb-5" style={{ columnCount: 2, columnGap: "2.5rem", columnRule: "1px solid #d1d5db" }}>{blocks}</div>
    : <div className={`flex flex-col ${gap}`}>{blocks}</div>;
};

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
  variables: VarOpt[];
  variableValues: Record<string, boolean>;
  onVariableChange: (k: string, v: boolean) => void;
  dropdown: DDOpt | null;
  dropdownValue: string;
  onDropdownChange: (v: string) => void;
  multiSelect: (MSGroup & { tab?: QOTab })[];
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
  const layout = qoLayout({ dd, ms: multiSelect, vars: variables });
  const tabs = tabsIn([...(dd ? [dd] : []), ...multiSelect, ...variables]);
  const [tab, setTab] = useQOTab(tabs, layout === "tabs");
  const sections = (dd ? 1 : 0) + multiSelect.length + (variables.length > 0 ? 1 : 0);
  // a long untabbed list splits into two columns with a thin grey divider (the Split QO layout); a tabbed popover stays one narrow column
  const twoCol = layout !== "tabs" && sections > 4;
  const hasContent = variables.length > 0 || dd !== null || multiSelect.length > 0;
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div
          className={`absolute top-full mt-2 bg-white rounded-xl shadow-lift border border-gray-200 z-50 p-5 flex flex-col gap-5 ${twoCol ? "left-1/2 -translate-x-1/2 border-2 !border-gray-400" : "left-0 min-w-[26rem]"}`}
          style={twoCol ? { width: "min(54rem, calc(100vw - 2rem))" } : undefined}
        >
          <QOTabs tabs={tabs} active={tab} onPick={setTab} />
          <QOBody dd={dd} ddValue={dropdownValue} onDd={onDropdownChange} ms={multiSelect} msValues={multiSelectValues} onMs={onMultiSelectChange}
            vars={variables} varValues={variableValues} onVar={onVariableChange} tab={tab} headers={layout === "headers"} split={twoCol} />
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
  const optsFor = (lv: string) => {
    const rawDd = toolSettings.difficultySettings?.[lv]?.dropdown ?? toolSettings.dropdown;
    return {
      dd: rawDd && !(hideWorkedExampleOnly && rawDd.workedExampleOnly) ? rawDd : null,
      ms: normalizeMultiSelect(toolSettings.difficultySettings?.[lv]?.multiSelect ?? toolSettings.multiSelect),
      vars: toolSettings.difficultySettings?.[lv]?.variables ?? toolSettings.variables ?? [],
    };
  };
  const all = levels.map(optsFor);
  const anyContent = all.some(o => o.dd !== null || o.vars.length > 0 || o.ms.length > 0);
  // one row of tabs for every level shown, laid out for the busiest level
  const layout = busiest(all);
  const tabs = tabsIn(all.flatMap(o => [...(o.dd ? [o.dd] : []), ...o.ms, ...o.vars]));
  const [tab, setTab] = useQOTab(tabs, layout === "tabs");
  return (
    <div className="relative" ref={ref}>
      <PopoverButton open={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-lift border border-gray-200 z-50 min-w-[28rem] p-5 flex flex-col gap-5">
          <QOTabs tabs={tabs} active={tab} onPick={setTab} />
          {!anyContent ? (
            <p className="text-sm text-gray-400">No additional options for this tool.</p>
          ) : (
            levels.map((lv, i) => {
              const { dd, ms, vars } = all[i];
              const onThisTab = tab === null || [...(dd ? [dd] : []), ...ms, ...vars].some(g => tabOf(g) === tab);
              return (
                <div key={lv} className="flex flex-col gap-2">
                  <span className={`text-sm font-extrabold uppercase tracking-wider ${LV_HEADER_COLORS[lv]}`}>{LV_LABELS[lv]}</span>
                  <div className="pl-1">
                    {onThisTab && (dd || ms.length > 0 || vars.length > 0) ? (
                      <QOBody dd={dd} ddValue={levelDropdowns[lv] ?? dd?.defaultValue ?? ""} onDd={v => onLevelDropdownChange(lv, v)}
                        ms={ms} msValues={levelMultiSelect[lv] ?? {}} onMs={(k, v) => onLevelMultiSelectChange(lv, k, v)}
                        vars={vars} varValues={levelVariables[lv] ?? {}} onVar={(k, v) => onLevelVariableChange(lv, k, v)}
                        tab={tab} headers={layout === "headers"} gap="gap-3" />
                    ) : <p className="text-xs text-gray-400">{tab ? "Nothing on this tab at this level." : "No options at this level."}</p>}
                  </div>
                </div>
              );
            })
          )}
          {anyContent && all.some(o => hasStarred(o.ms)) && <StarNote />}
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
  const allVars = toolEntry.difficultySettings?.[level]?.variables ?? toolEntry.variables ?? [];
  const vars = hideWorksheetOnly ? allVars.filter(v => !v.worksheetOnly) : allVars;
  const ms = normalizeMultiSelect(toolEntry.difficultySettings?.[level]?.multiSelect ?? toolEntry.multiSelect);
  const layout = qoLayout({ dd, ms, vars });
  const tabs = tabsIn([...(dd ? [dd] : []), ...ms, ...vars]);
  const [tab, setTab] = useQOTab(tabs, layout === "tabs");
  const hasContent = dd !== null || vars.length > 0 || ms.length > 0;
  if (!hasContent) return <p className="text-sm text-gray-400">No options for this level.</p>;
  return (
    <div className="flex flex-col gap-4">
      <QOTabs tabs={tabs} active={tab} onPick={setTab} />
      <QOBody dd={dd} ddValue={dropdownValue} onDd={onDropdownChange} ms={ms} msValues={multiSelectValues} onMs={onMultiSelectChange}
        vars={vars} varValues={variables} onVar={onVariableChange} tab={tab} headers={layout === "headers"} gap="gap-4" />
      {hasStarred(ms) && <StarNote />}
    </div>
  );
};
