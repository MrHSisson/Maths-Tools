// Mechanics diagrams: the public surface. Import from "../../shared/mechanics" only; nothing outside this folder reaches into its files.
export { default as MechDiagram } from "./MechDiagram";
export type { MechDiagramProps } from "./MechDiagram";
export { layoutScene, textWidth } from "./labelling";
export type { Layout, PlacedLabel } from "./labelling";
export { FORCE_STYLES, LABEL_SIZE } from "./palette";
export type { DiagramSize, ForceStyle } from "./palette";
export { mirrorScene, validateScene, lblText, visibleAt } from "./scene";
export type { Scene, SceneElement, Force, ForceKind, Dim, Arc, Body, Marker, Surface, Line, Lbl, Pt } from "./scene";
export { buildHorizontal } from "./templates/horizontal";
export type { HorizontalParams, HorizontalForce } from "./templates/horizontal";
export { buildVertical } from "./templates/vertical";
export type { VerticalParams, VerticalPosition } from "./templates/vertical";
