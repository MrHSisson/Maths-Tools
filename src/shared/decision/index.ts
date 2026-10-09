// Barrel export for the Decision Mathematics shell (see docs/architecture/DECISION_SHELL_PLAN.md).
export { default as DecisionShell } from "./DecisionShell";
export { default as NetworkView } from "./representations/NetworkView";
export { default as MatrixView } from "./representations/MatrixView";
export { default as FlowView } from "./representations/FlowView";
export { default as PanZoom } from "./representations/PanZoom";
export { default as SandboxBoard, SandboxOverlay, problemFromNetwork } from "./representations/SandboxBoard";
export * from "./graphBank";
export * from "./flow";
export { flowBox } from "./cutCurve";
export { FLOW_TEMPLATES, templatesForLevel } from "./flowTemplates";
export { generateFlowProblem, defaultStyle } from "./flowGenerate";
export type { FlowGenOptions } from "./flowGenerate";
export { solveFlowProblem, questionView } from "./flowSolve";
export { sampleTemplate } from "./templating";
export { validateProblem, primMST, referenceNearestNeighbour, referencePrimOrder, referenceKruskalOrder, referenceLowerBound, referenceOptimalTour } from "./validate";
export { leastDistances, nearestNeighbour, completeNetworkLayout, placeEdgeLabels } from "./tsp";
export type { LeastDistances, NearestNeighbourResult } from "./tsp";
export * from "./mst";
export { solveKruskal, solvePrimNetwork, solvePrimMatrix } from "./mstSolve";
export { lowerBound } from "./tspBounds";
export type { LowerBoundResult } from "./tspBounds";
export { generateTsp, pairsToComplete, expandRoute } from "./tspGenerate";
export type { TspKind, TspGenOptions } from "./tspGenerate";
export { solveTsp } from "./tspSolve";
export * from "./routeInspection";
export { solveRoute } from "./routeInspectionSolve";
export { generateRandomNetwork } from "./randomNetwork";
export type { RandomNetworkOptions } from "./randomNetwork";
export type {
  GNode,
  GEdge,
  Network,
  TemplateEdge,
  NetworkTemplate,
  DecisionProblem,
  EdgeState,
  MatrixCell,
  MatrixCellState,
  DistanceTable,
  NodeRole,
  StepList,
  StepListItem,
  LegendItem,
  SolveStep,
  DecisionShellProps,
  CanvasExtras,
  GenerateContext,
  ShellOption,
  ShellSubTool,
  DecisionProblemExport,
} from "./types";
