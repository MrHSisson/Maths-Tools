import {
  ToolShell, handleDiagramPrint, applyAbout, extras,
  withDiagramSteps, diagramStepVisual, diagramSplitQuestion,
  type ToolConfig, type DifficultyLevel, type AnyQuestion, type QOSnapshot,
} from "../../shared";
import { ABOUT } from "./PerimeterArea.about";
import { ShapeDiagram } from "../../shared/shapes/Diagram";
import type { Drawing, Focus } from "../../shared/shapes/drawing";
import { toQuestion } from "./perimeterArea/build";
import { genGrid } from "./perimeterArea/grid";
import { genShapes } from "./perimeterArea/shapes";
import { genCompound } from "./perimeterArea/compound";
import { genAlgebraic } from "./perimeterArea/algebraic";
import {
  ASK, GIVEN, SCALE, UNITS, SHAPES_1, SHAPES_2, SHAPES_3, SIDES_1, SIDES_2, SIDES_3, SIDES_SHAPES, PERIMETER_METHOD, AREA_METHOD, showSplit, ALG_SHAPES, ALG_TYPES,
} from "./perimeterArea/pools";

// ─── TOOL CONFIG ──────────────────────────────────────────────────────────────
const TOOL_CONFIG: ToolConfig = {
  pageTitle: "Perimeter & Area",
  tools: {
    grid: {
      name: "Counting on a Grid",
      variables: [], dropdown: null, multiSelect: ASK,
      difficultySettings: { level1: {}, level2: {}, level3: { multiSelect: [ASK, SCALE] } },
    },
    shapes: {
      name: "Standard Shapes",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { multiSelect: [ASK, SHAPES_1, SIDES_SHAPES] },
        level2: { multiSelect: [ASK, SHAPES_2, UNITS, SIDES_SHAPES] },
        level3: { multiSelect: [GIVEN, SHAPES_3, UNITS] },
      },
    },
    compound: {
      name: "Compound Shapes",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { multiSelect: [ASK, SIDES_1, PERIMETER_METHOD, AREA_METHOD], variables: [showSplit(true)] },
        level2: { multiSelect: [ASK, SIDES_2, PERIMETER_METHOD, AREA_METHOD], variables: [showSplit(false)] },
        level3: { multiSelect: [ASK, SIDES_3, UNITS], variables: [showSplit(false)] },
      },
    },
    algebraic: {
      name: "With Algebra",
      variables: [], dropdown: null,
      difficultySettings: {
        level1: { multiSelect: ALG_SHAPES },
        level2: { multiSelect: ALG_SHAPES },
        level3: { multiSelect: ALG_TYPES },
      },
    },
  },
};

// ─── generateQuestion ─────────────────────────────────────────────────────────
function generateQuestion(
  tool: string,
  level: DifficultyLevel,
  variables: Record<string, boolean>,
  _dropdownValue: string,
  multiSelectValues: Record<string, boolean> = {},
): AnyQuestion {
  switch (tool) {
    case "grid": return toQuestion(genGrid(level, multiSelectValues));
    case "shapes": return toQuestion(genShapes(level, multiSelectValues));
    case "compound": return toQuestion(genCompound(level, multiSelectValues, variables));
    default: return toQuestion(genAlgebraic(level, multiSelectValues));
  }
}

// ─── questionRenderer ─────────────────────────────────────────────────────────
const questionRenderer = (q: AnyQuestion, showAnswer: boolean, compact?: boolean, idx?: number, qo?: QOSnapshot): JSX.Element | null => {
  const d = extras(q)._diagram as Drawing | undefined;
  if (!d) return null;
  const focus = extras(q)._focus as Focus | undefined;     // set per step by the split worked example

  // Worksheet cell: the picture only; the shell puts the answer under it when answers are showing.
  if (compact === true) return <div style={{ width: "100%" }}><ShapeDiagram d={d} showAnswer={showAnswer} small dataIndex={idx} /></div>;

  // Whiteboard (embedded or fullscreen) says the answer under the picture; the worked example has its own answer line.
  const onBoard = compact === undefined || qo?.fullscreen === true;
  return (
    <div style={{ width: "100%", maxWidth: compact === undefined ? 340 : 520, margin: "0 auto" }}>
      <ShapeDiagram d={d} showAnswer={showAnswer} dataIndex={idx} focus={focus} />
      {onBoard && showAnswer && <div className="text-center mt-3 text-2xl font-semibold" style={{ color: "#166534" }}>{d.answerLine}</div>}
    </div>
  );
};

applyAbout(TOOL_CONFIG, ABOUT);

export const __test = { TOOL_CONFIG, generateQuestion };

// Two-view Worked Example: the diagram moves into the picture slot beside the steps (see src/shared/diagramSplit.tsx).
const splitGenerate = withDiagramSteps(generateQuestion);
const splitQuestion = diagramSplitQuestion(questionRenderer, { promptInDiagram: true });
const splitVisual = diagramStepVisual(questionRenderer);

export default function App() {
  return (
    <ToolShell
      config={TOOL_CONFIG}
      generateQuestion={splitGenerate}
      questionRenderer={splitQuestion}
      stepVisualRenderer={splitVisual}
      stepVisualKeepsWorking
      customPrintHandler={handleDiagramPrint}
      defaults={{ numQuestions: 9, numColumns: 3, maxColumns: 4, hideFontControls: true, hideAnswerStep: true, toolTabRows: [2, 2] }}
    />
  );
}
