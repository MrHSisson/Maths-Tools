// Barrel export for the Decision Mathematics shell (see docs/architecture/DECISION_SHELL_PLAN.md).
export { default as DecisionShell } from "./DecisionShell";
export { default as NetworkView } from "./representations/NetworkView";
export { default as MatrixView } from "./representations/MatrixView";
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
  DecisionProblemExport,
} from "./types";
