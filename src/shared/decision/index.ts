// Barrel export for the Decision Mathematics shell (see docs/architecture/DECISION_SHELL_PLAN.md).
export { default as DecisionShell } from "./DecisionShell";
export { default as NetworkView } from "./representations/NetworkView";
export { default as MatrixView } from "./representations/MatrixView";
export { default as FlowView } from "./representations/FlowView";
export * from "./flow";
export { FLOW_TEMPLATES, templatesForLevel } from "./flowTemplates";
export { generateFlowProblem, defaultStyle } from "./flowGenerate";
export type { FlowGenOptions } from "./flowGenerate";
export { solveFlowProblem, questionView } from "./flowSolve";
export { sampleTemplate } from "./templating";
export { validateProblem, primMST, referenceNearestNeighbour } from "./validate";
export { leastDistances, nearestNeighbour, completeNetworkLayout, placeEdgeLabels } from "./tsp";
export type { LeastDistances, NearestNeighbourResult } from "./tsp";
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
  LegendItem,
  SolveStep,
  DecisionShellProps,
  GenerateContext,
  ShellOption,
  ShellSubTool,
  DecisionProblemExport,
} from "./types";
