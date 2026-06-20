import { useState, useRef } from "react";
import { RefreshCw, Eye, X } from "lucide-react";
import type {
  DifficultyLevel,
  AnyQuestion,
  ToolConfig,
  PrintMode,
  QOSnapshot,
} from "./types";
import { normalizeMultiSelect, makeUniqueQ } from "./helpers";
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
}

export const WorksheetBuilder = ({
  config,
  generateQuestion,
  questionRenderer,
  customPrintHandler,
  comingSoonLevels = [],
}: WorksheetBuilderProps) => {
  const generateUniqueQ = makeUniqueQ(generateQuestion);
  const toolKeys = Object.keys(config.tools);

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
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [numColumns, setNumColumns] = useState(3);
  const [worksheet, setWorksheet] = useState<AnyQuestion[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("both");
  const worksheetRef = useRef<HTMLDivElement>(null);

  const totalQuestions = groups.reduce((s, g) => s + g.count, 0);

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
        for (let i = 0; i < g.count; i++)
          secQs.push(
            stampQO(
              generateUniqueQ(
                g.tool,
                g.level,
                g.variables,
                g.dropdownValue,
                usedKeys,
                g.multiSelectValues,
              ),
              snap,
            ),
          );
      });
      if (sectionShuffles[secIdx]) {
        for (let i = secQs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [secQs[i], secQs[j]] = [secQs[j], secQs[i]];
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      secQs.forEach((q) => {
        (q as any)._sectionIdx = secIdx;
      });
      questions.push(...secQs);
    });
    setWorksheet(questions);
    setShowAnswers(false);
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
  const lvBorder = (lv: DifficultyLevel) =>
    lv === "level1" ? "#16a34a" : lv === "level2" ? "#eab308" : "#dc2626";

  const selectedGroup = groups.find((g) => g.id === selectedId) ?? groups[0];
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
      <div
        className="flex flex-col rounded-xl border-2 border-gray-300 overflow-hidden"
        style={{ width: "50%", flexShrink: 0, backgroundColor: "#fff" }}
      >
        <div className="flex-1 overflow-y-auto">
          {sections.map((secGroups, secIdx) => (
            <div key={secIdx}>
              {secIdx > 0 && (
                <div
                  className="flex items-center gap-2 px-4 py-1.5"
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  <div className="flex-1 border-t border-gray-300" />
                  <button
                    onClick={() => {
                      const prevGroupId =
                        sections[secIdx - 1][sections[secIdx - 1].length - 1]
                          ?.id;
                      if (prevGroupId !== undefined) toggleDivider(prevGroupId);
                    }}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                    title="Remove divider"
                  >
                    <X size={10} />
                  </button>
                  <button
                    onClick={() => toggleSectionShuffle(secIdx)}
                    className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${sectionShuffles[secIdx] ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
                    title={
                      sectionShuffles[secIdx]
                        ? "Shuffle on for this section"
                        : "Shuffle off for this section"
                    }
                  >
                    Shuffle
                  </button>
                  <div className="flex-1 border-t border-gray-300" />
                </div>
              )}
              {secIdx === 0 && sections.length > 1 && (
                <div
                  className="flex items-center gap-2 px-4 py-1.5"
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  <div className="flex-1" />
                  <button
                    onClick={() => toggleSectionShuffle(0)}
                    className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${sectionShuffles[0] ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
                    title={
                      sectionShuffles[0]
                        ? "Shuffle on for this section"
                        : "Shuffle off for this section"
                    }
                  >
                    Shuffle
                  </button>
                  <div className="flex-1" />
                </div>
              )}
              {secGroups.map((g) => {
                const idx = globalIdx++;
                const isSel = g.id === selectedId;
                return (
                  <div key={g.id}>
                    <div
                      onClick={() => setSelectedId(g.id)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100"
                      style={{
                        borderLeft: `3px solid ${isSel ? lvBorder(g.level) : "transparent"}`,
                        backgroundColor: isSel ? "#f0f4ff" : undefined,
                      }}
                    >
                      <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      {/* Sub-tool selector */}
                      {toolKeys.length > 1 && (
                        <select
                          value={g.tool}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newTool = e.target.value;
                            const fresh = makeDefaultGroup(
                              g.id,
                              newTool,
                              g.level,
                            );
                            updateGroup(g.id, { ...fresh, id: g.id });
                            setSelectedId(g.id);
                          }}
                          className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded px-1.5 py-1 max-w-[100px] truncate"
                        >
                          {toolKeys.map((k) => (
                            <option key={k} value={k}>
                              {config.tools[k].name}
                            </option>
                          ))}
                        </select>
                      )}
                      {/* Level selector */}
                      <div
                        className="flex rounded-lg border-2 border-gray-200 overflow-hidden flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(
                          ["level1", "level2", "level3"] as DifficultyLevel[]
                        ).map((lv, li) => {
                          const isLvDisabled = comingSoonLevels.includes(lv);
                          return (
                            <button
                              key={lv}
                              onClick={() => {
                                if (!isLvDisabled) {
                                  const fresh = makeDefaultGroup(
                                    g.id,
                                    g.tool,
                                    lv,
                                  );
                                  updateGroup(g.id, { ...fresh, id: g.id });
                                  setSelectedId(g.id);
                                }
                              }}
                              className={`px-2.5 py-1 font-bold text-xs transition-colors ${isLvDisabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : g.level === lv ? `${lvColor(lv)} text-white` : "bg-white text-gray-400 hover:bg-gray-50"}`}
                            >
                              L{li + 1}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex-1" />
                      {/* Count stepper */}
                      <div
                        className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            updateGroup(g.id, {
                              count: Math.max(1, g.count - 1),
                            })
                          }
                          disabled={g.count <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-base leading-none"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-800 tabular-nums">
                          {g.count}
                        </span>
                        <button
                          onClick={() =>
                            updateGroup(g.id, {
                              count: Math.min(24, g.count + 1),
                            })
                          }
                          disabled={g.count >= 24}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-base leading-none"
                        >
                          +
                        </button>
                      </div>
                      {/* Delete */}
                      {groups.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDividers((prev) => {
                              const next = new Set(prev);
                              next.delete(g.id);
                              return next;
                            });
                            const rem = groups.filter((ag) => ag.id !== g.id);
                            setGroups(rem);
                            if (g.id === selectedId)
                              setSelectedId(
                                rem[
                                  Math.max(0, groups.indexOf(g) - 1)
                                ]?.id ?? rem[0].id,
                              );
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {secIdx === sections.length - 1 && sections.length > 1 && (
                <div
                  className="flex items-center gap-2 px-4 py-1.5"
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  <div className="flex-1" />
                  <button
                    onClick={() => toggleSectionShuffle(secIdx)}
                    className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${sectionShuffles[secIdx] ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
                    title={
                      sectionShuffles[secIdx]
                        ? "Shuffle on for this section"
                        : "Shuffle off for this section"
                    }
                  >
                    Shuffle
                  </button>
                  <div className="flex-1" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
          {canAdd ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newId = nextId.current++;
                  const lastTool =
                    groups.length > 0
                      ? groups[groups.length - 1].tool
                      : toolKeys[0];
                  setGroups((g) => [
                    ...g,
                    makeDefaultGroup(newId, lastTool),
                  ]);
                  setSelectedId(newId);
                }}
                className="flex-1 py-2 rounded-lg border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                + Add group
              </button>
              <button
                onClick={() => {
                  const lastGroup = groups[groups.length - 1];
                  if (lastGroup && !dividers.has(lastGroup.id))
                    toggleDivider(lastGroup.id);
                }}
                disabled={
                  !groups.length ||
                  dividers.has(groups[groups.length - 1]?.id)
                }
                className="aspect-square py-2 px-3 rounded-lg border-2 border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Add section divider"
              >
                + Section
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-gray-400 font-semibold py-1">
              Maximum 10 groups reached
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderOptionsPanel = () => {
    if (!selectedGroup) return null;
    const toolEntry = config.tools[selectedGroup.tool];
    if (!toolEntry) return null;
    const groupIdx = groups.indexOf(selectedGroup);
    return (
      <div
        className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-4 overflow-y-auto"
        style={{ backgroundColor: "#fff" }}
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Group {groupIdx + 1} ·{" "}
          {toolKeys.length > 1
            ? `${toolEntry.name} · `
            : ""}
          {selectedGroup.level === "level1"
            ? "Level 1"
            : selectedGroup.level === "level2"
              ? "Level 2"
              : "Level 3"}{" "}
          · Options
        </p>
        <InlineQOPanel
          toolEntry={toolEntry}
          level={selectedGroup.level}
          variables={selectedGroup.variables}
          onVariableChange={(k, v) =>
            updateGroup(selectedGroup.id, {
              variables: { ...selectedGroup.variables, [k]: v },
            })
          }
          dropdownValue={selectedGroup.dropdownValue}
          onDropdownChange={(v) =>
            updateGroup(selectedGroup.id, { dropdownValue: v })
          }
          multiSelectValues={selectedGroup.multiSelectValues}
          onMultiSelectChange={(k, v) =>
            updateGroup(selectedGroup.id, {
              multiSelectValues: {
                ...selectedGroup.multiSelectValues,
                [k]: v,
              },
            })
          }
        />
      </div>
    );
  };

  const renderPreview = () => {
    if (worksheet.length === 0) return null;
    const fsz = "text-xl";
    if (layout === "list") {
      return (
        <div
          ref={worksheetRef}
          className="bg-white rounded-xl shadow-lg p-6 mt-6"
        >
          <div style={{ columnCount: numColumns, columnGap: "2rem" }}>
            {worksheet.map((q, i) => {
              const secIdx =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (q as any)._sectionIdx as number | undefined;
              const prevSec =
                i > 0
                  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ((worksheet[i - 1] as any)._sectionIdx as
                      | number
                      | undefined)
                  : undefined;
              const showDivider =
                secIdx !== undefined &&
                prevSec !== undefined &&
                secIdx !== prevSec;
              return (
                <div key={q.key + i}>
                  {showDivider && (
                    <div
                      className="border-t border-gray-300 my-2"
                      style={{ breakInside: "avoid" }}
                    />
                  )}
                  <div
                    className="py-1 flex gap-2"
                    style={{ breakInside: "avoid" }}
                  >
                    <span className="text-sm font-bold text-gray-400 w-6 text-right flex-shrink-0">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      {questionRenderer ? (
                        questionRenderer(
                          q,
                          showAnswers,
                          "default",
                          true,
                          i,
                        )
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
                            latex={
                              (q as any).displayLatex ?? (q as any).display
                            }
                          />
                        </div>
                      )}
                      {showAnswers && (
                        <div
                          className="text-sm font-semibold mt-0.5"
                          style={{ color: "#059669" }}
                        >
                          <MathRenderer
                            latex={ansEq(
                              (q as any).answerLatex ?? (q as any).answer,
                            )}
                          />
                          {(q as any).answerSuffix && (
                            <span className="ml-1">
                              {(q as any).answerSuffix}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Grid layout
    return (
      <div ref={worksheetRef} className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
          }}
        >
          {worksheet.map((q, i) => {
            const secIdx =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (q as any)._sectionIdx as number | undefined;
            const prevSec =
              i > 0
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ((worksheet[i - 1] as any)._sectionIdx as
                    | number
                    | undefined)
                : undefined;
            const showDivider =
              secIdx !== undefined &&
              prevSec !== undefined &&
              secIdx !== prevSec;
            return (
              <div key={q.key + i} style={showDivider ? { gridColumn: `1 / -1` } : undefined}>
                {showDivider && (
                  <div className="border-t-2 border-gray-300 my-2 col-span-full" />
                )}
                <div
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: "#f5f3f0",
                    minHeight: 60,
                  }}
                >
                  <span className="text-xs font-bold text-gray-300 block mb-1">
                    {i + 1}
                  </span>
                  {questionRenderer ? (
                    questionRenderer(
                      q,
                      showAnswers,
                      "default",
                      true,
                      i,
                    )
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
                        latex={
                          (q as any).displayLatex ?? (q as any).display
                        }
                      />
                    </div>
                  )}
                  {showAnswers && (
                    <div
                      className={`${fsz} font-semibold mt-1`}
                      style={{ color: "#059669" }}
                    >
                      <MathRenderer
                        latex={ansEq(
                          (q as any).answerLatex ?? (q as any).answer,
                        )}
                      />
                      {(q as any).answerSuffix && (
                        <span className="ml-1">
                          {(q as any).answerSuffix}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mb-8">
      <div className="p-6">
        <div className="flex gap-3" style={{ minHeight: 300 }}>
          {renderGroupList()}
          {renderOptionsPanel()}
        </div>
        <div className="flex justify-center items-center gap-4 flex-wrap mt-4">
          <div className="flex items-center gap-2">
            <label className="text-base font-semibold text-gray-700">
              Columns:
            </label>
            <input
              type="number"
              min="1"
              max="4"
              value={numColumns}
              onChange={(e) =>
                setNumColumns(
                  Math.max(1, Math.min(4, parseInt(e.target.value) || 3)),
                )
              }
              className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-base font-semibold text-center"
            />
          </div>
          <div className="flex rounded-lg border-2 border-gray-300 overflow-hidden">
            <button
              onClick={() => setLayout("grid")}
              className={`px-3 py-1.5 text-sm font-bold transition-colors ${layout === "grid" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setLayout("list")}
              className={`px-3 py-1.5 text-sm font-bold transition-colors ${layout === "list" ? "bg-blue-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              List
            </button>
          </div>
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
