import { useState, useRef, useEffect } from "react";
import { RefreshCw, Eye, X, ChevronDown, ChevronUp } from "lucide-react";
import type {
  DifficultyLevel,
  AnyQuestion,
  ToolConfig,
  PrintMode,
  QOSnapshot,
} from "./types";
import { normalizeMultiSelect, makeUniqueQ } from "./helpers";
import { splitIntoSections, hasSections } from "./sections";
import { MathRenderer, InlineMath } from "./components/MathRenderer";
import { InlineQOPanel } from "./components/QOPopovers";
import { PrintSplitButton } from "./components/PrintSplitButton";
import { handlePrint } from "./print";
import { ansEq } from "./helpers";

interface BuilderGroup {
  id: number;
  tool: string;
  level: DifficultyLevel;
  count: number;
  variables: Record<string, boolean>;
  dropdownValue: string;
  multiSelectValues: Record<string, boolean>;
}

export interface WorksheetBuilderProps {
  config: ToolConfig;
  generateQuestion: (
    tool: string,
    level: DifficultyLevel,
    variables: Record<string, boolean>,
    dropdownValue: string,
    multiSelectValues?: Record<string, boolean>,
  ) => AnyQuestion;
  questionRenderer?: (
    q: AnyQuestion,
    showAnswer: boolean,
    colorScheme: string,
    compact?: boolean,
    idx?: number,
    qo?: QOSnapshot,
    fontClass?: string,
  ) => JSX.Element | null;
  customPrintHandler?: (
    questions: AnyQuestion[],
    printMode: PrintMode,
    worksheetEl: HTMLElement | null,
  ) => void;
  comingSoonLevels?: DifficultyLevel[];
  hideFontControls?: boolean;
  /** When set, every group is locked to this single sub-tool and the per-group
   *  sub-tool selector is hidden (used for the in-tool "Advanced" worksheet mode,
   *  which must only draw from the current sub-tool). Omit for the cross-tool
   *  Builder, where groups can mix sub-tools. */
  lockedTool?: string;
}

export const WorksheetBuilder = ({
  config,
  generateQuestion,
  questionRenderer,
  customPrintHandler,
  comingSoonLevels = [],
  hideFontControls = false,
  lockedTool,
}: WorksheetBuilderProps) => {
  const generateUniqueQ = makeUniqueQ(generateQuestion);
  const allToolKeys = Object.keys(config.tools);
  // When locked to a single sub-tool, the per-group selector is hidden and every
  // group is forced to that tool.
  const toolKeys = lockedTool ? [lockedTool] : allToolKeys;

  const makeDefaultGroup = (
    id: number,
    toolKey: string = toolKeys[0],
    lv: DifficultyLevel = "level1",
  ): BuilderGroup => {
    const t = config.tools[toolKey];
    if (!t)
      return {
        id,
        tool: toolKey,
        level: lv,
        count: 5,
        variables: {},
        dropdownValue: "",
        multiSelectValues: {},
      };
    const dd = t.difficultySettings?.[lv]?.dropdown ?? t.dropdown;
    const vars = t.difficultySettings?.[lv]?.variables ?? t.variables;
    const ms = normalizeMultiSelect(
      t.difficultySettings?.[lv]?.multiSelect ?? t.multiSelect,
    );
    const variables: Record<string, boolean> = {};
    vars.forEach((v) => {
      variables[v.key] = v.defaultValue;
    });
    const multiSelectValues: Record<string, boolean> = {};
    ms.forEach((g) =>
      g.options.forEach((o) => {
        multiSelectValues[o.value] = o.defaultActive;
      }),
    );
    return {
      id,
      tool: toolKey,
      level: lv,
      count: 5,
      variables,
      dropdownValue: dd?.defaultValue ?? "",
      multiSelectValues,
    };
  };

  const [groups, setGroups] = useState<BuilderGroup[]>([makeDefaultGroup(1)]);
  const [selectedId, setSelectedId] = useState(1);
  const nextId = useRef(2);
  const [dividers, setDividers] = useState<Set<number>>(new Set());
  const [sectionShuffles, setSectionShuffles] = useState<
    Record<number, boolean>
  >({});
  const [sectionColumns, setSectionColumns] = useState<
    Record<number, number>
  >({});
  const [sectionHeaders, setSectionHeaders] = useState<
    Record<number, string>
  >({});
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [borders, setBorders] = useState(true);
  const [numColumns] = useState(3);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("both");
  const [worksheetFontSize, setWorksheetFontSize] = useState(1);
  const worksheetRef = useRef<HTMLDivElement>(null);

  const totalQuestions = groups.reduce((s, g) => s + g.count, 0);

  const fontSizes = ["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"];
  const canFontIncrease = worksheetFontSize < fontSizes.length - 1;
  const canFontDecrease = worksheetFontSize > 0;

  // If the locked sub-tool changes (the user switches the active sub-tool tab while
  // in the in-tool Advanced mode), remap every group to the new tool — re-deriving
  // its QO defaults while preserving the section structure and per-group counts —
  // and clear the now-stale worksheet.
  const prevLockedTool = useRef(lockedTool);
  useEffect(() => {
    if (!lockedTool || prevLockedTool.current === lockedTool) return;
    prevLockedTool.current = lockedTool;
    setGroups((gs) =>
      gs.map((g) => ({ ...makeDefaultGroup(g.id, lockedTool, g.level), count: g.count })),
    );
    setWorksheet([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedTool]);

  const computeSections = (
    gs: BuilderGroup[],
    divs: Set<number>,
  ): BuilderGroup[][] => {
    const sections: BuilderGroup[][] = [[]];
    gs.forEach((g, i) => {
      sections[sections.length - 1].push(g);
      if (divs.has(g.id) && i < gs.length - 1) sections.push([]);
    });
    return sections;
  };

  const stampQO = (q: AnyQuestion, snap: QOSnapshot): AnyQuestion => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)._qo = snap;
    return q;
  };

  const handleGenerate = () => {
    const usedKeys = new Set<string>();
    const questions: AnyQuestion[] = [];
    const sections = computeSections(groups, dividers);
    sections.forEach((sectionGroups, secIdx) => {
      const secQs: AnyQuestion[] = [];
      sectionGroups.forEach((g) => {
        const snap: QOSnapshot = {
          level: g.level,
          variables: g.variables,
          dropdownValue: g.dropdownValue,
          multiSelectValues: g.multiSelectValues,
        };
        for (let i = 0; i < g.count; i++) {
          const q = stampQO(
            generateUniqueQ(
              g.tool,
              g.level,
              g.variables,
              g.dropdownValue,
              usedKeys,
              g.multiSelectValues,
            ),
            snap,
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q as any)._tool = g.tool;
          secQs.push(q);
        }
      });
      if (sectionShuffles[secIdx]) {
        for (let i = secQs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [secQs[i], secQs[j]] = [secQs[j], secQs[i]];
        }
      }
      const secCols = sectionColumns[secIdx] ?? numColumns;
      const secHdr = sectionHeaders[secIdx] ?? "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      secQs.forEach((q) => {
        (q as any)._sectionIdx = secIdx;
        (q as any)._sectionCols = secCols;
        if (secHdr) (q as any)._sectionHeader = secHdr;
      });
      questions.push(...secQs);
    });
    setWorksheet(questions);
    setShowAnswers(false);
  };

  const regenQuestion = (idx: number) => {
    const q = worksheet[idx];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyQ = q as any;
    const snap = anyQ._qo as QOSnapshot | undefined;
    if (!snap) return;
    const tool = (anyQ._tool as string | undefined) ?? toolKeys[0];
    const existing = new Set(worksheet.map((w) => w.key));
    existing.delete(q.key);
    let replacement: AnyQuestion | null = null;
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = generateQuestion(
        tool,
        snap.level,
        snap.variables,
        snap.dropdownValue,
        snap.multiSelectValues,
      );
      if (!existing.has(candidate.key)) {
        replacement = stampQO(candidate, snap);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (replacement as any)._tool = tool;
        break;
      }
    }
    if (!replacement) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repl = replacement as any;
    if (anyQ._sectionIdx !== undefined) repl._sectionIdx = anyQ._sectionIdx;
    if (anyQ._sectionCols !== undefined) repl._sectionCols = anyQ._sectionCols;
    if (anyQ._sectionHeader !== undefined) repl._sectionHeader = anyQ._sectionHeader;
    setWorksheet((prev) => prev.map((w, i) => (i === idx ? replacement! : w)));
  };

  const updateGroup = (id: number, patch: Partial<BuilderGroup>) =>
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const toggleDivider = (groupId: number) => {
    setDividers((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleSectionShuffle = (secIdx: number) => {
    setSectionShuffles((prev) => ({ ...prev, [secIdx]: !prev[secIdx] }));
  };

  const lvColor = (lv: DifficultyLevel) =>
    lv === "level1"
      ? "bg-green-600"
      : lv === "level2"
        ? "bg-yellow-500"
        : "bg-red-600";
  const lvDot = (lv: DifficultyLevel) =>
    lv === "level1" ? "bg-green-500" : lv === "level2" ? "bg-yellow-400" : "bg-red-500";

  const sections = computeSections(groups, dividers);
  const canAdd = groups.length < 10;

  const getInstruction = () => {
    if (groups.length === 0) return "";
    const firstTool = config.tools[groups[0].tool];
    return firstTool?.instruction ?? "";
  };

  const renderGroupList = () => {
    let globalIdx = 0;
    return (
      <div className="flex flex-col gap-4">
        {sections.map((secGroups, secIdx) => (
          <div key={secIdx} className="rounded-xl border border-gray-200 overflow-hidden" style={{ backgroundColor: "#fff" }}>
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-3" style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #e5e7eb" }}>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">Section {secIdx + 1}</span>
              <div className="h-4 w-px bg-gray-300" />
              <input
                type="text"
                placeholder="Heading (e.g. Solve for x)"
                value={sectionHeaders[secIdx] ?? ""}
                onChange={e => setSectionHeaders(prev => ({ ...prev, [secIdx]: e.target.value }))}
                className="text-sm bg-transparent border-none px-0 py-0 flex-1 min-w-0 placeholder-gray-300 focus:outline-none font-medium text-gray-700"
              />
              <div className="h-4 w-px bg-gray-300" />
              <button onClick={() => toggleSectionShuffle(secIdx)}
                className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors flex-shrink-0 ${sectionShuffles[secIdx] ? "bg-blue-900 text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                Shuffle
              </button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex rounded-md overflow-hidden border border-gray-200">
                  {[1, 2, 3, 4].map(c => (
                    <button key={c} onClick={() => setSectionColumns(prev => ({ ...prev, [secIdx]: c }))}
                      className={`w-7 h-6 text-xs font-bold transition-colors ${(sectionColumns[secIdx] ?? numColumns) === c ? "bg-blue-900 text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400">col</span>
              </div>
              {secIdx > 0 && (
                <button onClick={() => {
                  const prevGroupId = sections[secIdx - 1][sections[secIdx - 1].length - 1]?.id;
                  if (prevGroupId !== undefined) toggleDivider(prevGroupId);
                }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0" title="Merge with section above">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Group rows */}
            <div className="divide-y divide-gray-100">
              {secGroups.map((g) => {
                const idx = globalIdx++;
                const isSel = g.id === selectedId;
                return (
                  <div key={g.id}>
                    <div onClick={() => setSelectedId(isSel ? -1 : g.id)}
                      className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${isSel ? "" : "hover:bg-gray-50"}`}
                      style={{ backgroundColor: isSel ? "#f0f4ff" : undefined }}>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${lvDot(g.level)}`} />
                        <span className="text-sm font-bold text-gray-400 tabular-nums w-5">{idx + 1}</span>
                      </div>
                      {toolKeys.length > 1 && (
                        <select
                          value={g.tool}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newTool = e.target.value;
                            const fresh = makeDefaultGroup(g.id, newTool, g.level);
                            updateGroup(g.id, { ...fresh, id: g.id });
                            setSelectedId(g.id);
                          }}
                          className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded px-2 py-1.5 min-w-0 flex-1"
                        >
                          {toolKeys.map((k) => (
                            <option key={k} value={k}>{config.tools[k].name}</option>
                          ))}
                        </select>
                      )}
                      <div className="flex rounded-lg overflow-hidden border border-gray-200 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {(["level1", "level2", "level3"] as DifficultyLevel[]).map((lv, li) => {
                          const isLvDisabled = comingSoonLevels.includes(lv);
                          return (
                            <button key={lv} onClick={() => { if (!isLvDisabled) { const fresh = makeDefaultGroup(g.id, g.tool, lv); updateGroup(g.id, { ...fresh, id: g.id }); setSelectedId(g.id); } }}
                              className={`px-3 py-1 font-semibold text-xs transition-colors ${isLvDisabled ? "bg-gray-50 text-gray-300 cursor-not-allowed" : g.level === lv ? `${lvColor(lv)} text-white` : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                              L{li + 1}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => updateGroup(g.id, { count: Math.max(1, g.count - 1) })} disabled={g.count <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm leading-none">−</button>
                        <span className="w-6 text-center text-sm font-bold text-gray-700 tabular-nums">{g.count}</span>
                        <button onClick={() => updateGroup(g.id, { count: Math.min(24, g.count + 1) })} disabled={g.count >= 24}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm leading-none">+</button>
                      </div>
                      <div className="flex-1" />
                      <ChevronDown size={14} className={`text-gray-300 transition-transform flex-shrink-0 ${isSel ? "rotate-180" : ""}`} />
                      <button onClick={e => {
                        e.stopPropagation();
                        if (groups.length <= 1) return;
                        setDividers(prev => { const next = new Set(prev); next.delete(g.id); return next; });
                        const rem = groups.filter(ag => ag.id !== g.id);
                        setGroups(rem);
                        if (g.id === selectedId) setSelectedId(rem[Math.max(0, groups.indexOf(g) - 1)]?.id ?? rem[0].id);
                      }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${groups.length > 1 ? "text-gray-300 hover:bg-red-50 hover:text-red-400" : "invisible"}`}>
                        <X size={12} />
                      </button>
                    </div>
                    {isSel && (
                      <div className="px-5 py-3 border-t border-blue-100 flex justify-center" style={{ backgroundColor: "#f8faff" }}>
                        <div style={{ maxWidth: "28rem", width: "100%" }}>
                          <InlineQOPanel
                            toolEntry={config.tools[g.tool]}
                            level={g.level}
                            variables={g.variables}
                            onVariableChange={(k, v) => updateGroup(g.id, { variables: { ...g.variables, [k]: v } })}
                            dropdownValue={g.dropdownValue}
                            onDropdownChange={v => updateGroup(g.id, { dropdownValue: v })}
                            multiSelectValues={g.multiSelectValues}
                            onMultiSelectChange={(k, v) => updateGroup(g.id, { multiSelectValues: { ...g.multiSelectValues, [k]: v } })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add group within section */}
            {canAdd && (
              <div className="px-5 py-2 border-t border-gray-100">
                <button onClick={() => { const newId = nextId.current++;
                  const lastInSec = secGroups[secGroups.length - 1];
                  if (lastInSec) {
                    const lastIdx = groups.indexOf(lastInSec);
                    setGroups(prev => { const next = [...prev]; next.splice(lastIdx + 1, 0, makeDefaultGroup(newId, lastInSec.tool)); return next; });
                  } else {
                    setGroups(prev => [...prev, makeDefaultGroup(newId)]);
                  }
                  setSelectedId(newId);
                }}
                  className="w-full py-1.5 text-xs font-semibold text-gray-300 hover:text-blue-600 transition-colors">
                  + Add group
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Bottom actions */}
        <div className="flex gap-3">
          {canAdd && (
            <button onClick={() => {
              const lastGroup = groups[groups.length - 1];
              if (lastGroup && !dividers.has(lastGroup.id)) {
                setDividers(prev => new Set([...prev, lastGroup.id]));
              }
              const newId = nextId.current++;
              const lastTool = groups.length > 0 ? groups[groups.length - 1].tool : toolKeys[0];
              setGroups(g => [...g, makeDefaultGroup(newId, lastTool)]);
              setSelectedId(newId);
            }}
              className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors">
              + Add section
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (worksheet.length === 0) return null;
    const fsz = fontSizes[worksheetFontSize];
    const fontSizeControls = hideFontControls ? null : (
      <div className="flex items-center justify-end gap-1 mb-3">
        <button disabled={!canFontDecrease} onClick={() => canFontDecrease && setWorksheetFontSize(f => f - 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canFontDecrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronDown size={20} /></button>
        <button disabled={!canFontIncrease} onClick={() => canFontIncrease && setWorksheetFontSize(f => f + 1)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${canFontIncrease ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ChevronUp size={20} /></button>
      </div>
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const regenBtn = (q: AnyQuestion, i: number) => (q as any)._qo ? (
      <button onClick={() => regenQuestion(i)} title="Regenerate this question"
        className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
        style={{ zIndex: 10 }}>
        <RefreshCw size={12} />
      </button>
    ) : null;
    if (layout === "list") {
      const renderListItem = (q: AnyQuestion, i: number) => (
        <div key={q.key + i}>
          <div className="group py-1 flex gap-2" style={{ breakInside: "avoid", position: "relative", paddingRight: "1.5rem" }}>
            {regenBtn(q, i)}
            <span className="text-sm font-bold text-gray-400 w-6 text-right flex-shrink-0">
              {i + 1}.
            </span>
            <div className="flex-1">
              {questionRenderer ? (
                questionRenderer(q, false, "default", true, i, (q as any)._qo, fsz)
              ) : q.kind === "worded" ? (
                <div className={`${fsz}`}>
                  {q.lines.map((line, li) => (
                    <span key={li}>
                      <InlineMath text={line} />
                      {li < q.lines.length - 1 && " "}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={`${fsz}`}>
                  <MathRenderer latex={(q as any).displayLatex ?? (q as any).display} />
                </div>
              )}
              {showAnswers && (
                <div className="text-sm font-semibold mt-0.5" style={{ color: "#059669" }}>
                  <MathRenderer latex={ansEq((q as any).answerLatex ?? (q as any).answer)} />
                  {(q as any).answerSuffix && <span className="ml-1">{(q as any).answerSuffix}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      );
      if (!hasSections(worksheet)) {
        return (
          <div ref={worksheetRef} className="bg-white rounded-xl shadow-lg p-6 mt-6 relative">{fontSizeControls}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${numColumns}, 1fr)`, columnGap: "2rem" }}>
              {worksheet.map((q, i) => renderListItem(q, i))}
            </div>
          </div>
        );
      }
      return (
        <div ref={worksheetRef} className="bg-white rounded-xl shadow-lg p-6 mt-6 relative">{fontSizeControls}
          {splitIntoSections(worksheet, numColumns).map((seg, si) => (
            <div key={si}>
              {si > 0 && <div style={{ width: "60%", margin: "0.5rem auto", borderTop: "1px solid #d1d5db" }} />}
              {seg.header && <p className="text-lg font-semibold mb-1 mt-2" style={{ color: "#000" }}>{seg.header}</p>}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${seg.cols}, 1fr)`, columnGap: "2rem" }}>
                {seg.items.map(({ q, globalIdx }) => renderListItem(q, globalIdx))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Grid layout — split into segments per section for per-section columns
    const renderGridCell = (q: AnyQuestion, i: number) => (
      <div key={q.key + i}>
        <div
          className={borders ? "group rounded-lg border border-gray-200 p-4 text-center" : "group p-4 text-center"}
          style={{
            ...(borders ? { backgroundColor: "#f5f3f0" } : {}),
            minHeight: 60,
            position: "relative",
          }}
        >
          <span className="text-xs font-bold text-gray-400" style={{ position: "absolute", top: 4, left: 6 }}>
            {i + 1}
          </span>
          {regenBtn(q, i)}
          {questionRenderer ? (
            questionRenderer(q, false, "default", true, i, (q as any)._qo, fsz)
          ) : q.kind === "worded" ? (
            <div className={`${fsz}`}>
              {q.lines.map((line, li) => (
                <span key={li}>
                  <InlineMath text={line} />
                  {li < q.lines.length - 1 && " "}
                </span>
              ))}
            </div>
          ) : (
            <div className={`${fsz}`}>
              <MathRenderer
                latex={(q as any).displayLatex ?? (q as any).display}
              />
            </div>
          )}
          {showAnswers && (
            <div
              className={`${fsz} font-semibold mt-1`}
              style={{ color: "#059669" }}
            >
              <MathRenderer
                latex={ansEq((q as any).answerLatex ?? (q as any).answer)}
              />
              {(q as any).answerSuffix && (
                <span className="ml-1">{(q as any).answerSuffix}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );

    if (!hasSections(worksheet)) {
      return (
        <div ref={worksheetRef} className="bg-white rounded-xl shadow-lg p-6 mt-6 relative">{fontSizeControls}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
            {worksheet.map((q, i) => renderGridCell(q, i))}
          </div>
        </div>
      );
    }
    return (
      <div ref={worksheetRef} className="bg-white rounded-xl shadow-lg p-6 mt-6 relative">{fontSizeControls}
        {splitIntoSections(worksheet, numColumns).map((seg, si) => (
          <div key={si}>
            {si > 0 && <div style={{ width: "60%", margin: "1rem auto", borderTop: "1px solid #d1d5db" }} />}
            {seg.header && <p className="text-lg font-semibold mb-2 mt-1" style={{ color: "#000" }}>{seg.header}</p>}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${seg.cols}, 1fr)` }}>
              {seg.items.map(({ q, globalIdx }) => renderGridCell(q, globalIdx))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mb-8">
      <div className="p-6">
        {renderGroupList()}
        <div className="flex justify-center items-center gap-4 flex-wrap mt-4">
          <div className="flex rounded-lg border-2 border-gray-300 overflow-hidden">
            <button
              onClick={() => setLayout("grid")}
              className={`px-3 py-1.5 text-sm font-bold transition-colors ${layout === "grid" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              Worksheet
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`px-3 py-1.5 text-sm font-bold transition-colors ${layout === "list" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              Textbook
            </button>
          </div>
          <label className={`flex items-center gap-2 cursor-pointer transition-opacity ${layout === "grid" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div onClick={() => setBorders(!borders)}
                className={`w-9 h-5 rounded-full transition-colors relative ${borders ? "bg-blue-900" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${borders ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm font-semibold text-gray-500">Borders</span>
            </label>
          <span className="text-sm font-bold text-gray-600">
            {totalQuestions} questions total
          </span>
          <button
            onClick={handleGenerate}
            className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"
          >
            <RefreshCw size={18} /> Generate
          </button>
          {worksheet.length > 0 && (
            <>
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-base shadow-sm hover:bg-blue-800 flex items-center gap-2"
              >
                <Eye size={18} /> {showAnswers ? "Hide Answers" : "Show Answers"}
              </button>
              <PrintSplitButton
                onPrint={(m) =>
                  customPrintHandler
                    ? customPrintHandler(
                        worksheet,
                        m,
                        worksheetRef.current,
                      )
                    : handlePrint(
                        worksheet,
                        config.pageTitle,
                        "advanced",
                        false,
                        numColumns,
                        getInstruction(),
                        m,
                        layout,
                        borders,
                      )
                }
                printMode={printMode}
                setPrintMode={setPrintMode}
              />
            </>
          )}
        </div>
      </div>
      {renderPreview()}
    </div>
  );
};
