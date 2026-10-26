// Perimeter & Area — the Question Option pools, shared by the tool's config and its generators.
import type { ToolMultiSelect, ToolVariable } from "../../../shared";

const opt = (value: string, label: string, defaultActive: boolean, requires?: string[]) => ({ value, label, defaultActive, ...(requires ? { requires } : {}) });

export const ASK: ToolMultiSelect = { key: "askFor", label: "Ask for", balanced: true, options: [opt("perimeter", "Perimeter", true), opt("area", "Area", true)] };
export const GIVEN: ToolMultiSelect = { key: "given", label: "Given", balanced: true, options: [opt("perimeter", "Perimeter", true), opt("area", "Area", true)] };
export const SCALE: ToolMultiSelect = { key: "scale", label: "Scales", balanced: true, options: [opt("two", "1 Square = 2 cm", true), opt("five", "1 Square = 5 cm", false)] };
export const UNITS: ToolMultiSelect = { key: "units", label: "Units", exclusive: true, options: [opt("same", "Same Units", true), opt("mixed", "Mixed Units", false)] };

// Standard Shapes: which shapes come up, by level
export const SHAPES_1: ToolMultiSelect = { key: "shapes", label: "Shape Types", balanced: true, options: [opt("rectangle", "Rectangle", true), opt("square", "Square", true), opt("regularPolygon", "Regular Polygon", true, ["perimeter"])] };
export const SHAPES_2: ToolMultiSelect = {
  key: "shapes", label: "Shape Types", balanced: true,
  options: [opt("rightTriangle", "Right-Angled Triangle", true), opt("isoscelesTriangle", "Isosceles Triangle", true), opt("parallelogram", "Parallelogram", true), opt("trapezium", "Trapezium", true)],
};
export const SHAPES_3: ToolMultiSelect = {
  key: "shapes", label: "Shape Types", balanced: true,
  options: [opt("rectangle", "Rectangle", true), opt("triangle", "Triangle", true), opt("parallelogram", "Parallelogram", true), opt("trapezium", "Trapezium", false)],
};

// Compound Shapes
export const SIDES_1: ToolMultiSelect = { key: "sidesGiven", label: "Sides Given", exclusive: true, options: [opt("all", "All Sides", true), opt("missing", "Some Missing", false)] };
export const SIDES_2: ToolMultiSelect = { key: "sidesGiven", label: "Sides Given", exclusive: true, options: [opt("all", "All Sides", false), opt("missing", "Some Missing", true)] };
export const PERIMETER_METHOD: ToolMultiSelect = { key: "perimeterMethod", label: "Method for Perimeter", exclusive: true, displayOnly: true, options: [opt("addSides", "Add the Sides", true), opt("boundingRectangle", "Bounding Rectangle", false)] };
export const AREA_METHOD: ToolMultiSelect = { key: "areaMethod", label: "Method for Area", exclusive: true, displayOnly: true, options: [opt("split", "Split Up", true), opt("subtract", "Subtract", false)] };
export const showSplit = (on: boolean): ToolVariable => ({ key: "showSplit", label: "Show the Split on the Question", defaultValue: on, displayOnly: true });

// With Algebra
export const ALG_SHAPES: ToolMultiSelect = { key: "shapes", label: "Shape Types", balanced: true, options: [opt("rectangle", "Rectangle", true), opt("triangle", "Triangle", true), opt("square", "Square", true)] };
export const ALG_TYPES: ToolMultiSelect = { key: "questionTypes", label: "Question Types", balanced: true, options: [opt("areaExpression", "Area, Expanded", true), opt("lShapePerimeter", "L-Shape Perimeter", true)] };
