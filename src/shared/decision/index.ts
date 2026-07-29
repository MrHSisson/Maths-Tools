// Barrel export for the Decision Mathematics shell (see docs/architecture/DECISION_SHELL_PLAN.md).
export { default as DecisionShell } from "./DecisionShell";
export { default as NetworkView } from "./representations/NetworkView";
export { default as MatrixView } from "./representations/MatrixView";
export { sampleTemplate } from "./templating";
export { validateProblem, primMST } from "./validate";
export type {
  GNode,
  GEdge,
  Network,
  TemplateEdge,
  NetworkTemplate,
  DecisionProblem,
  EdgeState,
  MatrixCell,
  SolveStep,
  DecisionShellProps,
  DecisionProblemExport,
} from "./types";
